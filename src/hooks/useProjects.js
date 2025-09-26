import { useState, useEffect } from "react";
import { projectService } from "@/lib/supabase";
import { localProjectService } from "@/lib/localStorage";

export function useProjects(isAnonymous) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentProjectService = isAnonymous
    ? localProjectService
    : projectService;

  const loadProjects = async () => {
    try {
      setLoading(true);
      let projectsData = [];

      if (isAnonymous) {
        const { data, error } = await currentProjectService.getAll();
        if (error) throw error;
        projectsData = data || [];
      } else {
        projectsData = (await currentProjectService.getAll()) || [];
      }

      setProjects(projectsData);
      setError(null);
    } catch (err) {
      console.error("Error loading projects:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [isAnonymous]);

  return {
    projects,
    loading,
    error,
    loadProjects,
  };
}
