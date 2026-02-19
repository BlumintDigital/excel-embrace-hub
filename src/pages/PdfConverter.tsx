import { useState, useRef, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-logger";

type ConversionState = "idle" | "converting" | "done" | "error";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function PdfConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ConversionState>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [resultName, setResultName] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      setErrorMsg("Please select a PDF file.");
      setState("error");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setErrorMsg("File exceeds the 20 MB limit.");
      setState("error");
      return;
    }
    setFile(f);
    setState("idle");
    setErrorMsg("");
    setResultBlob(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) handleFile(picked);
    e.target.value = "";
  };

  const reset = () => {
    setFile(null);
    setState("idle");
    setErrorMsg("");
    setResultBlob(null);
    setResultName("");
    setStatusMsg("");
  };

  const convert = async () => {
    if (!file) return;

    setState("converting");
    setStatusMsg("Uploading document...");
    setErrorMsg("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const formData = new FormData();
      formData.append("file", file);

      setStatusMsg("Converting to Word...");

      // Use native fetch — supabase.functions.invoke doesn't handle FormData→binary correctly
      const res = await fetch(`${supabaseUrl}/functions/v1/pdf-to-word`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anonKey,
          // Do NOT set Content-Type — browser must set it with the multipart boundary
        },
        body: formData,
      });

      if (!res.ok) {
        let errMsg = `Request failed (HTTP ${res.status})`;
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch { /* response wasn't JSON */ }
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const name = file.name.replace(/\.pdf$/i, ".docx");
      setResultBlob(blob);
      setResultName(name);
      setState("done");
      logActivity({ action: "converted", entity_type: "pdf_conversion", entity_name: file.name, details: `Converted to ${name}` });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Conversion failed. Please try again.");
      setState("error");
    }
  };

  const downloadResult = () => {
    if (!resultBlob || !resultName) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
      {/* Header */}
      <PageHeader
        title="PDF to Word"
        subtitle="Convert PDF files to editable Word documents (.docx)"
      />

      {/* Drop zone */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragOver
            ? "border-primary bg-primary/5"
            : file
            ? "border-border bg-muted/20"
            : "border-border hover:border-primary/50 hover:bg-muted/10"
        }`}
        onClick={() => !file && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 flex flex-col items-center text-center gap-3">
          {file ? (
            <>
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7 gap-1"
                onClick={(e) => { e.stopPropagation(); reset(); }}
              >
                <X className="h-3 w-3" /> Remove
              </Button>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Drop a PDF here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-0.5">PDF files only · Max 20 MB</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Convert button */}
      {state !== "done" && (
        <Button
          className="w-full sm:w-auto"
          onClick={convert}
          disabled={!file || state === "converting"}
        >
          {state === "converting" ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {statusMsg || "Converting..."}
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Convert to Word
            </>
          )}
        </Button>
      )}

      {/* Result */}
      {state === "done" && resultBlob && (
        <Card className="border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{resultName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ready to download</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" onClick={downloadResult}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download
              </Button>
              <Button size="sm" variant="outline" onClick={reset}>
                Convert another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {state === "error" && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Conversion failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">{errorMsg}</p>
            </div>
            <Button size="sm" variant="outline" onClick={reset}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
        <p>Powered by Adobe PDF Services · Files are processed securely and not stored.</p>
        <p>Conversion typically takes 10–30 seconds depending on document size and complexity.</p>
      </div>
    </div>
  );
}
