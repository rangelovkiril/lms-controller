import { useState }        from "react";
import { useTranslations } from "next-intl";
import { API_BASE }        from "@/types";

export function useImport() {
  const t = useTranslations("errors");

  const [state, setState] = useState({
    status:     "idle" as "idle" | "uploading",
    error:      "",
    lastUpload: null as { label: string; time: string } | null,
  });

  const patch = (v: Partial<typeof state>) => setState(s => ({ ...s, ...v }));

  const tImport = useTranslations("import");

  async function upload(files: File[], observationSet: string) {
    patch({ status: "uploading", error: "" });

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("observationSet", observationSet);

    try {
      const res = await fetch(`${API_BASE}/observations/upload`, {
        method: "POST",
        body:   formData,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || t("httpError", { status: res.status, statusText: res.statusText }));
      }

      patch({
        status:     "idle",
        lastUpload: {
          label: tImport("successLabel", { count: files.length, set: observationSet }),
          time:  new Date().toLocaleTimeString(),
        },
      });
    } catch (e: any) {
      const message = e instanceof Error ? e.message : String(e);
      patch({ status: "idle", error: message });
      throw e;
    }
  }

  return { ...state, upload, patch };
}