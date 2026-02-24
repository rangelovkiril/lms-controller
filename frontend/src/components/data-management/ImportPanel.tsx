"use client";

import { useState, useRef } from "react";
import { StatusBar } from "../ui/StatusBar";
import { Spinner }   from "../ui/Spinner";
import { Label }     from "../ui/Label";
import { inputBase } from "../ui/inputStyles";

type UploadStatus = "idle" | "uploading";

interface Props {
  onSend:    (file: File, observationSet: string) => Promise<void>;
  onOverlay: (file: File, observationSet: string) => void;
}

export default function ImportPanel({ onSend, onOverlay }: Props) {
  const [file,           setFile]           = useState<File | null>(null);
  const [observationSet, setObservationSet] = useState("");
  const [status,         setStatus]         = useState<UploadStatus>("idle");
  const [error,          setError]          = useState("");
  const [lastUpload,     setLastUpload]     = useState<{ label: string; time: string } | null>(null);
  const [dragging,       setDragging]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSend    = !!(file && observationSet.trim() && status === "idle");
  const canOverlay = !!(file && status === "idle");

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const f = files[0];
    if (!f.name.match(/\.(csv|json)$/i)) {
      setError("Само .csv и .json файлове са поддържани");
      return;
    }
    setFile(f);
    setError("");
    setLastUpload(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleSend() {
    if (!canSend) return;
    setError("");
    setLastUpload(null);
    setStatus("uploading");
    try {
      await onSend(file!, observationSet.trim());
      setLastUpload({
        label: `${file!.name} → ${observationSet.trim()}`,
        time:  new Date().toLocaleTimeString("bg-BG"),
      });
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStatus("idle");
    }
  }

  function handleOverlay() {
    if (!canOverlay) return;
    onOverlay(file!, observationSet.trim());
  }

  return (
    <div className="bg-surface border border-border rounded-[14px] overflow-hidden flex flex-col h-full">

      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-blue-dim border border-blue/20 flex items-center justify-center text-blue">
          <UploadIcon />
        </div>
        <div>
          <div className="text-sm font-semibold text-text">Импорт</div>
          <div className="text-[11px] font-mono text-text-muted">Качи траектория към станция</div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5 flex-1">

        {/* Observation set name */}
        <div className="flex flex-col gap-1.5">
          <Label>Observation set</Label>
          <input
            type="text"
            value={observationSet}
            onChange={e => setObservationSet(e.target.value)}
            placeholder="напр. ISS-pass-2026-03-01"
            className={inputBase}
            spellCheck={false}
          />
        </div>

        {/* File drop zone */}
        <div className="flex flex-col gap-1.5">
          <Label>Файл с траектория</Label>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={[
              "relative flex flex-col items-center justify-center gap-3 p-8 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-150",
              dragging ? "border-blue bg-blue/5 scale-[1.01]"
              : file   ? "border-accent/40 bg-accent-dim"
              : "border-border hover:border-border-hi hover:bg-surface-hi",
            ].join(" ")}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {file ? (
              <>
                <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <FileIcon />
                </div>
                <div className="text-center">
                  <div className="text-[13px] font-mono text-text font-medium">{file.name}</div>
                  <div className="text-[11px] font-mono text-text-muted mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="absolute top-3 right-3 text-text-muted hover:text-danger transition-colors p-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-lg bg-surface-hi border border-border flex items-center justify-center text-text-muted">
                  <UploadIcon />
                </div>
                <div className="text-center">
                  <div className="text-[13px] font-mono text-text-dim">
                    Пусни файл тук или <span className="text-blue">избери</span>
                  </div>
                  <div className="text-[11px] font-mono text-text-muted mt-0.5">.csv · .json</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto pt-1">

          <button
            disabled={!canOverlay}
            onClick={handleOverlay}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-[13px] font-medium border border-accent/30 text-accent bg-accent-dim transition-all duration-150 disabled:opacity-35 disabled:cursor-not-allowed hover:enabled:bg-accent/20 hover:enabled:border-accent/50 cursor-pointer"
          >
            <OverlayIcon />
            Наложи траектория
          </button>
        </div>
      </div>

      <StatusBar
        status={status}
        error={error}
        lastAction={lastUpload}
        idleLabel="Готов за импорт"
        station={observationSet || undefined}
        object={undefined}
      />
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}
function OverlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
      <path d="M13 13l6 6"/>
    </svg>
  );
}