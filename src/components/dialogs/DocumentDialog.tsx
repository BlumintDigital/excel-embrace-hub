import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCreateDocument } from "@/hooks/use-supabase-mutations";
import type { DbProject } from "@/hooks/use-supabase-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: DbProject[];
}

const categories = ["Drawings", "Reports", "Permits", "Specifications", "Other"];

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function DocumentDialog({ open, onOpenChange, projects }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("Reports");
  const [projectId, setProjectId] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [sizeError, setSizeError] = useState("");
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const create = useCreateDocument();

  useEffect(() => {
    if (open) {
      setFile(null);
      setCategory("Reports");
      setProjectId("");
      setSizeError("");
      setUploading(false);
    }
  }, [open]);

  const handleFile = (f: File) => {
    if (f.size > MAX_BYTES) {
      setSizeError(`File is ${formatFileSize(f.size)} — maximum allowed is 5 MB.`);
      setFile(null);
      return;
    }
    setSizeError("");
    setFile(f);
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

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user?.id ?? "anon"}/${Date.now()}-${file.name}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      // Save metadata
      await create.mutateAsync({
        name: file.name,
        category,
        project_id: projectId || undefined,
        size: file.size,
        file_path: path,
      });

      onOpenChange(false);
    } catch (err) {
      setSizeError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const isPending = uploading || create.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center text-center gap-3 transition-colors cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : file
                ? "border-border bg-muted/20 cursor-default"
                : "border-border hover:border-primary/50 hover:bg-muted/10"
            }`}
            onClick={() => !file && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <>
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium truncate max-w-[260px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7 gap-1"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setSizeError(""); }}
                >
                  <X className="h-3 w-3" /> Remove
                </Button>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Drop a file here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Max 5 MB</p>
                </div>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleInputChange}
          />

          {/* Size error */}
          {sizeError && (
            <div className="flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{sizeError}</span>
            </div>
          )}

          {/* Category */}
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          <div>
            <Label>Project (optional)</Label>
            <Select value={projectId || "__none"} onValueChange={(v) => setProjectId(v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— No project —</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file || !!sizeError || isPending}>
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Upload</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
