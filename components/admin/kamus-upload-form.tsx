"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface RowError {
  row: number;
  message: string;
}

interface UploadSuccess {
  ok: true;
  event: string;
  created: number;
  updated: number;
  total: number;
}

interface PreviewResult {
  ok: true;
  summary: { new: number; changed: number; unchanged: number; deleted: number };
  newItems: Array<{ code: string; name: string; type: string }>;
  changedItems: Array<{
    code: string;
    before: { name: string; type: string };
    after: { name: string; type: string };
  }>;
  deletedItems: Array<{ code: string; name: string }>;
}

export function KamusUploadForm({ mode = "upload" }: { mode?: "upload" | "preview" }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<UploadSuccess | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setSuccess(null);
    setPreview(null);
    setErrors([]);
    setErrorMessage(null);
    setProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!file) {
      setErrorMessage("Please select a file to upload");
      return;
    }

    setUploading(true);
    setProgress(10);

    const endpoint = mode === "preview" ? "/api/kamus/preview" : "/api/kamus/upload";

    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      const promise = new Promise<{ status: number; body: string }>(
        (resolve, reject) => {
          xhr.upload.addEventListener("progress", (evt) => {
            if (evt.lengthComputable) {
              const percent = Math.round((evt.loaded / evt.total) * 80) + 10;
              setProgress(percent);
            }
          });
          xhr.addEventListener("load", () => {
            setProgress(100);
            resolve({ status: xhr.status, body: xhr.responseText });
          });
          xhr.addEventListener("error", () => reject(new Error("Network error")));
          xhr.open("POST", endpoint);
          xhr.send(formData);
        }
      );

      const result = await promise;
      const body = result.body ? JSON.parse(result.body) : {};

      if (result.status >= 200 && result.status < 300) {
        if (mode === "preview") {
          setPreview(body);
        } else {
          setSuccess(body);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
        setFile(null);
      } else if (body.errors) {
        setErrors(body.errors);
        setErrorMessage(body.error || "Validation failed");
      } else {
        setErrorMessage(body.error || `Request failed (${result.status})`);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        data-testid="kamus-upload-form"
        className="space-y-4"
      >
        <div>
          <label htmlFor="kamus-file" className="mb-2 block text-sm font-medium">
            Kamus template file (.csv)
          </label>
          <input
            id="kamus-file"
            ref={fileInputRef}
            data-testid="kamus-file-input"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {uploading && (
          <div data-testid="kamus-upload-progress" className="space-y-1">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            data-testid="submit-kamus-btn"
            disabled={uploading}
          >
            {mode === "preview" ? "Preview Changes" : "Upload Kamus"}
          </Button>
          <a
            href="/api/kamus/template"
            data-testid="download-template-btn"
            className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            download
          >
            Download Template
          </a>
        </div>
      </form>

      {success && (
        <div
          data-testid="kamus-created-alert"
          className="mt-4 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          Kamus submitted successfully. Event &quot;{success.event}&quot; generated.
          Created: {success.created}, Updated: {success.updated}, Total:{" "}
          {success.total}.
        </div>
      )}

      {errorMessage && (
        <div
          data-testid="kamus-error-alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      )}

      {errors.length > 0 && (
        <ul
          data-testid="kamus-error-list"
          className="mt-3 list-inside list-disc space-y-1 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {errors.map((er) => (
            <li key={`${er.row}-${er.message}`} data-testid={`kamus-error-row-${er.row}`}>
              Row {er.row}: {er.message}
            </li>
          ))}
        </ul>
      )}

      {preview && (
        <div
          data-testid="kamus-preview-container"
          className="mt-4 rounded-md border border-border bg-card p-4 text-sm"
        >
          <h3 className="mb-2 font-semibold">Preview of changes</h3>
          <p data-testid="kamus-preview-summary">
            New: {preview.summary.new} · Changed: {preview.summary.changed} ·
            Unchanged: {preview.summary.unchanged} · Removed:{" "}
            {preview.summary.deleted}
          </p>
          {preview.newItems.length > 0 && (
            <div className="mt-3">
              <p className="font-medium">New items</p>
              <ul data-testid="kamus-preview-new" className="list-inside list-disc">
                {preview.newItems.map((i) => (
                  <li key={i.code}>
                    {i.code} — {i.name} ({i.type})
                  </li>
                ))}
              </ul>
            </div>
          )}
          {preview.changedItems.length > 0 && (
            <div className="mt-3">
              <p className="font-medium">Changed items</p>
              <ul data-testid="kamus-preview-changed" className="list-inside list-disc">
                {preview.changedItems.map((i) => (
                  <li key={i.code}>
                    {i.code}: {i.before.name} → {i.after.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {preview.deletedItems.length > 0 && (
            <div className="mt-3">
              <p className="font-medium">Removed items</p>
              <ul data-testid="kamus-preview-deleted" className="list-inside list-disc">
                {preview.deletedItems.map((i) => (
                  <li key={i.code}>
                    {i.code} — {i.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
