"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUploadCall } from "@/hooks/useUploadCall";
import { Upload, X, FileAudio, Loader2, AlertCircle } from "lucide-react";

interface Props {
  onClose: () => void;
  onUploaded?: () => void;
}

const ACCEPTED = ["audio/", "video/mp4", "video/quicktime", "video/x-m4v"];

function isAccepted(file: File) {
  return ACCEPTED.some((t) => file.type.startsWith(t)) || /\.(mp3|mp4|m4a|wav|ogg|webm|opus|aac|flac|wma|amr|3gp)$/i.test(file.name);
}

export function UploadCallModal({ onClose, onUploaded }: Props) {
  const router = useRouter();
  const { upload, uploading, error } = useUploadCall();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  function pickFile(f: File) {
    if (!isAccepted(f)) {
      setFileError("Please select an audio or video file (mp3, mp4, m4a, wav, etc.).");
      return;
    }
    setFileError(null);
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    try {
      const result = await upload(file, title);
      onUploaded?.();
      onClose();
      router.push(`/calls/${result.id}`);
    } catch {
      // error shown via hook's `error` state
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Upload Recording</h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors
              ${dragOver
                ? "border-[var(--brand)] bg-[var(--brand-dim)]"
                : file
                  ? "border-[var(--positive)] bg-[var(--positive-dim)]"
                  : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--brand)] hover:bg-[var(--brand-dim)]"
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="audio/*,video/mp4,video/quicktime,.m4a,.mp3,.wav,.ogg,.webm,.opus,.aac,.flac,.wma,.amr,.3gp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
              disabled={uploading}
            />
            {file ? (
              <>
                <FileAudio size={28} className="text-[var(--positive)]" />
                <p className="text-sm font-medium text-[var(--foreground)] text-center break-all">{file.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{(file.size / 1024 / 1024).toFixed(1)} MB · click to change</p>
              </>
            ) : (
              <>
                <Upload size={28} className="text-[var(--text-muted)]" />
                <p className="text-sm font-medium text-[var(--foreground)]">Drop your recording here</p>
                <p className="text-xs text-[var(--text-muted)]">or click to browse · mp3, mp4, m4a, wav and more</p>
              </>
            )}
          </div>

          {fileError && (
            <p className="flex items-center gap-1.5 text-xs text-[var(--negative)]">
              <AlertCircle size={12} /> {fileError}
            </p>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Title <span className="text-[var(--text-muted)] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sales call with Acme"
              disabled={uploading}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] disabled:opacity-50 transition-colors"
            />
          </div>

          {/* API error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-[var(--negative-dim)] border border-[var(--negative)]/20 px-3 py-2.5 text-xs text-[var(--negative)]">
              <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--brand)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Analyze
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
