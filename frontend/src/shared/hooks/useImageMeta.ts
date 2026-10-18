import { useState, useEffect } from "react";
import type { Photo } from "../types";
export type ImageMetaData = Record<
  string,
  Partial<Photo> & { ratio: number; placeholder: string; isBest?: boolean }
>;
let cached: ImageMetaData | undefined;
let pending: Promise<ImageMetaData> | undefined;
function load() {
  if (!pending)
    pending = fetch("/imageMeta.json", { cache: "default" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data || typeof data !== "object" || Array.isArray(data))
          throw new Error("Invalid image metadata");
        cached = data;
        return data as ImageMetaData;
      })
      .finally(() => {
        pending = undefined;
      });
  return pending;
}
export function useImageMeta() {
  const [imageMeta, setImageMeta] = useState<ImageMetaData>(cached ?? {});
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () =>
      load()
        .then((data) => {
          if (active) {
            setImageMeta(data);
            setError(null);
          }
        })
        .catch((error) => {
          if (active) setError(error);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    void refresh();
    window.addEventListener("online", refresh);
    return () => {
      active = false;
      window.removeEventListener("online", refresh);
    };
  }, []);
  return { imageMeta, loading, error };
}
