import { useState, useEffect } from "react";
import type { Project } from "../types";
let cached: Project[] | undefined;
let pending: Promise<Project[]> | undefined;
function load() {
  if (!pending)
    pending = fetch("/projects.json", { cache: "default" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid project data");
        cached = data;
        return data as Project[];
      })
      .finally(() => {
        pending = undefined;
      });
  return pending;
}
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => load().then(data => { if(active) {setProjects(data);setError(null)} }).catch(error => {if(active)setError(error)}).finally(() => {if(active)setLoading(false)});
    void refresh();
    window.addEventListener('online', refresh);
    return () => {active=false;window.removeEventListener('online', refresh)};
  }, []);
  return {projects, loading, error};
}
