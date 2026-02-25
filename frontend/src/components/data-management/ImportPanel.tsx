"use client";

import { useState, useRef } from "react";
import { StatusBar } from "../ui/StatusBar";
import { Spinner }   from "../ui/Spinner";
import { Label }     from "../ui/Label";
import { inputBase } from "../ui/inputStyles";
import { useImport } from "@/hooks/useImport";

const UploadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const FileIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);

const SendIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const OverlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/>
  </svg>
);

const XIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

export default function ImportPanel({ onOverlay }: { onOverlay: (files: File[], name: string) => void }) {
  const { upload, status, error, lastUpload } = useImport();
  const [files, setFiles] = useState<File[]>([]);
  const [observationSet, setObservationSet] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSend = files.length > 0 && observationSet.trim() !== "" && status === "idle";

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles = Array.from(incoming);
    
    if (observationSet === "" && newFiles.length > 0) {
      const nameWithoutExt = newFiles[0].name.replace(/\.[^/.]+$/, "");
      setObservationSet(nameWithoutExt);
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!canSend) return;
    try {
      await upload(files, observationSet.trim());
      setFiles([]);
      setObservationSet("");
    } catch (e) {
      console.error("Import failed:", e);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-[14px] overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-blue-dim border border-blue/20 flex items-center justify-center text-blue">
          <UploadIcon />
        </div>
        <div>
          <div className="text-sm font-semibold text-text">Импорт на наблюдения</div>
          <div className="text-[11px] font-mono text-text-muted">Observation Set</div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5 flex-1">
        <div className="flex flex-col gap-1.5">
          <Label>Име на сесия (Observation set)</Label>
          <input
            className={inputBase}
            value={observationSet}
            onChange={e => setObservationSet(e.target.value)}
            placeholder="напр. ISS-pass-2026-03-01"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{ files.length ? `${files.length} файла` : "" }</Label>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            className={`relative flex flex-col items-center justify-center min-h-[160px] gap-3 p-4 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
              dragging ? "border-blue bg-blue/5 scale-[1.01]" : files.length > 0 ? "border-accent/30 bg-accent-dim/30" : "border-border hover:bg-surface-hi"
            }`}
          >
            <input 
              ref={inputRef} 
              accept="application/json"
              type="file" 
              multiple 
              className="hidden" 
              onChange={(e) => handleFiles(e.target.files)} 
            />

            {files.length > 0 ? (
              <div className="w-full flex flex-col gap-2 max-h-[200px] overflow-y-auto p-1">
                {files.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-md group">
                    <div className="text-accent/70"><FileIcon /></div>
                    <div className="flex-1 text-[12px] font-mono truncate text-text">{f.name}</div>
                    <button 
                      onClick={(e) => removeFile(i, e)}
                      className="p-1 hover:bg-danger/10 hover:text-danger rounded text-text-muted transition-colors"
                    >
                      <XIcon />
                    </button>
                  </div>
                ))}
                <div className="text-[10px] text-center text-text-muted pt-1 uppercase tracking-wider font-bold">
                  Кликни за добавяне на още
                </div>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-surface-hi flex items-center justify-center text-text-muted">
                  <UploadIcon />
                </div>
                <div className="text-center">
                  <div className="text-[13px] text-text">
                    Пусни файлове тук или <span className="text-blue">избери</span>
                  </div>
                  <div className="text-[11px] text-text-muted mt-1">.json (x,y,z или az,el,dist)</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-auto">
          <button
            disabled={!canSend}
            onClick={handleSend}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-blue text-white font-medium transition-all hover:bg-blue-hi disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {status === "uploading" ? (
              <><Spinner /> Качване...</>
            ) : (
              <><SendIcon /> Качи в базата</>
            )}
          </button>
          
          <button
            disabled={files.length === 0 || status !== "idle"}
            onClick={() => onOverlay(files, observationSet)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-accent/30 text-accent bg-accent-dim font-medium transition-all hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <OverlayIcon /> Наложи на картата
          </button>
        </div>
      </div>

      <StatusBar 
        status={status} 
        error={error} 
        lastAction={lastUpload} 
        station={observationSet || "---"} 
        object="ObservationSet" 
      />
    </div>
  );
}