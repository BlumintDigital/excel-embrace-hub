import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allow any origin — access is still enforced by verifying the Supabase Bearer token
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADOBE_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
const ADOBE_API_BASE = "https://pdf-services-ue1.adobe.io";

async function getAdobeAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "openid,AdobeID,DCAPI",
  });

  const res = await fetch(ADOBE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Adobe auth failed: ${res.status} — ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Verify Supabase user auth ──────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Get the uploaded PDF from the request ──────────────────────
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (file.type !== "application/pdf") {
      return new Response(JSON.stringify({ error: "File must be a PDF" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
    if (file.size > MAX_BYTES) {
      return new Response(JSON.stringify({ error: "File exceeds 20 MB limit" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfBytes = await file.arrayBuffer();

    // ── 3. Authenticate with Adobe PDF Services ───────────────────────
    const clientId = Deno.env.get("ADOBE_CLIENT_ID");
    const clientSecret = Deno.env.get("ADOBE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: "Adobe credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAdobeAccessToken(clientId, clientSecret);

    const adobeHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "x-api-key": clientId,
    };

    // ── 4. Create an Adobe asset (get upload URI) ─────────────────────
    const assetRes = await fetch(`${ADOBE_API_BASE}/assets`, {
      method: "POST",
      headers: { ...adobeHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ mediaType: "application/pdf" }),
    });

    if (!assetRes.ok) {
      const text = await assetRes.text();
      throw new Error(`Adobe asset creation failed: ${assetRes.status} — ${text}`);
    }

    const { uploadUri, assetID } = await assetRes.json();

    // ── 5. Upload the PDF to Adobe's presigned URL ────────────────────
    const uploadRes = await fetch(uploadUri, {
      method: "PUT",
      headers: { "Content-Type": "application/pdf" },
      body: pdfBytes,
    });

    if (!uploadRes.ok) {
      throw new Error(`PDF upload to Adobe failed: ${uploadRes.status}`);
    }

    // ── 6. Start the export job (PDF → DOCX) ─────────────────────────
    const exportRes = await fetch(`${ADOBE_API_BASE}/operation/exportpdf`, {
      method: "POST",
      headers: { ...adobeHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ assetID, targetFormat: "docx" }),
    });

    if (exportRes.status !== 201) {
      const text = await exportRes.text();
      throw new Error(`Adobe export job failed to start: ${exportRes.status} — ${text}`);
    }

    const jobLocation = exportRes.headers.get("Location");
    if (!jobLocation) {
      throw new Error("Adobe did not return a job location URL");
    }

    // ── 7. Poll until the job is done ────────────────────────────────
    let downloadUri: string | null = null;
    const MAX_POLLS = 60;

    for (let i = 0; i < MAX_POLLS; i++) {
      await sleep(2000);

      const statusRes = await fetch(jobLocation, {
        headers: adobeHeaders,
      });

      if (!statusRes.ok) {
        throw new Error(`Failed to poll job status: ${statusRes.status}`);
      }

      const statusData = await statusRes.json();

      if (statusData.status === "done") {
        downloadUri = statusData.asset?.downloadUri ?? null;
        break;
      }

      if (statusData.status === "failed") {
        throw new Error(`Conversion failed: ${statusData.error?.message || "Unknown error"}`);
      }

      // status === "in progress" — keep polling
    }

    if (!downloadUri) {
      throw new Error("Conversion timed out. Please try again.");
    }

    // ── 8. Download the DOCX and return it to the client ─────────────
    const docxRes = await fetch(downloadUri);
    if (!docxRes.ok) {
      throw new Error(`Failed to download converted file: ${docxRes.status}`);
    }

    const docxBytes = await docxRes.arrayBuffer();
    const outputName = file.name.replace(/\.pdf$/i, ".docx");

    return new Response(docxBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${outputName}"`,
        "Content-Length": docxBytes.byteLength.toString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
