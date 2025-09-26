import { useState, useEffect } from "react";
import { tagService } from "@/lib/supabase";
import { localTagService } from "@/lib/localStorage";

export function useTags(isAnonymous) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentTagService = isAnonymous ? localTagService : tagService;

  const loadTags = async () => {
    try {
      setLoading(true);

      if (isAnonymous) {
        const { data, error } = await currentTagService.getAll();
        if (error) throw error;
        setTags(data || []);
      } else {
        // For Supabase, we'll load project-specific tags
        // For now, just set empty array and handle in Management component
        setTags([]);
      }
      setError(null);
    } catch (err) {
      console.error("Error loading tags:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, [isAnonymous]);

  return {
    tags,
    loading,
    error,
    loadTags,
  };
}
