"use client";
import {
  createContext, useContext, useState, useCallback, useRef, type ReactNode,
} from "react";
import { Vector3 }                          from "three";
import { ObsSet, createSet }                from "@/types";
import { parseObservationFile, ParseError } from "./parseObservationFile";

interface ObservationSetsContextValue {
  sets:            ObsSet[];
  activeSetId:     string;
  setActiveSetId:  (id: string) => void;
  addSet:          () => void;
  addSetFromFiles: (files: File[], label: string) => Promise<void>;
  removeSet:       (id: string) => void;
  updateSet:       <K extends keyof ObsSet>(id: string, key: K, value: ObsSet[K]) => void;
  clearSet:        (id: string) => void;
  openFilePicker:  () => void;
  fileInputRef:    React.RefObject<HTMLInputElement>;
}

const Ctx = createContext<ObservationSetsContextValue | null>(null);

export function ObservationSetsProvider({ children }: { children: ReactNode }) {
  const [sets,        setSets]        = useState<ObsSet[]>([]);
  const [activeSetId, setActiveSetId] = useState("");
  const fileInputRef                  = useRef<HTMLInputElement>(null!);

  const addSet = useCallback(() => {
    setSets((prev) => {
      const fresh = createSet(prev);
      setActiveSetId(fresh.id);
      return [...prev, fresh];
    });
  }, []);

  const addSetFromFiles = useCallback(async (files: File[], label: string) => {
    console.debug("[context] addSetFromFiles called, files:", files.map(f => f.name), "label:", label);

    const points: Vector3[] = [];
    for (const file of files) {
      const parsed = await parseObservationFile(file);
      console.debug("[context] parsed", parsed.length, "points from", file.name);
      points.push(...parsed);
    }

    console.debug("[context] total points:", points.length);
    if (points.length === 0) throw new ParseError("No valid points found in files");

    setSets((prev) => {
      const fresh = { ...createSet(prev, label || undefined), points };
      console.debug("[context] adding set:", fresh.id, fresh.label, "points:", fresh.points.length);
      setActiveSetId(fresh.id);
      return [...prev, fresh];
    });
  }, []);

  const removeSet = useCallback((id: string) => {
    setSets((prev) => {
      const next = prev.filter((s) => s.id !== id);
      setActiveSetId((cur) => cur === id ? (next.at(-1)?.id ?? "") : cur);
      return next;
    });
  }, []);

  const updateSet = useCallback(
    <K extends keyof ObsSet>(id: string, key: K, value: ObsSet[K]) =>
      setSets((prev) => prev.map((s) => s.id === id ? { ...s, [key]: value } : s)),
    []
  );

  const clearSet = useCallback(
    (id: string) =>
      setSets((prev) => prev.map((s) => s.id === id ? { ...s, points: [] } : s)),
    []
  );

  const openFilePicker = useCallback(() => {
    console.debug("[context] openFilePicker called, ref:", fileInputRef.current);
    fileInputRef.current?.click();
  }, []);

  return (
    <Ctx.Provider value={{
      sets, activeSetId, setActiveSetId,
      addSet, addSetFromFiles,
      removeSet, updateSet, clearSet,
      openFilePicker, fileInputRef,
    }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          console.debug("[context] file input onChange, files:", files.map(f => f.name));
          e.target.value = "";
          if (!files.length) return;
          const label = files[0].name.replace(/\.[^/.]+$/, "");
          await addSetFromFiles(files, label);
        }}
      />
      {children}
    </Ctx.Provider>
  );
}

export function useObservationSets() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useObservationSets must be used inside ObservationSetsProvider");
  return ctx;
}