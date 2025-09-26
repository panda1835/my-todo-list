import { useState, useCallback } from "react";
import { localProjectService, localTagService } from "@/lib/localStorage";
import { projectService, tagService } from "@/lib/supabase";

export function useProjectManagement(isAnonymous, onProjectsUpdate) {
  const [editingProject, setEditingProject] = useState(null);
  const [editingProjectValue, setEditingProjectValue] = useState("");
  const [isReordering, setIsReordering] = useState(false);

  const currentProjectService = isAnonymous
    ? localProjectService
    : projectService;

  const startEditing = useCallback((project) => {
    setEditingProject(project.id);
    setEditingProjectValue(project.name);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingProject(null);
    setEditingProjectValue("");
  }, []);

  const createProject = useCallback(
    async (name) => {
      if (!name.trim()) return;

      try {
        if (isAnonymous) {
          const { data, error } = await currentProjectService.create({
            name: name.trim(),
          });
          if (error) throw error;
        } else {
          await currentProjectService.create({
            name: name.trim(),
          });
        }
        await onProjectsUpdate();
      } catch (error) {
        console.error("Error adding project:", error);
        throw error;
      }
    },
    [isAnonymous, currentProjectService, onProjectsUpdate]
  );

  const updateProject = useCallback(
    async (projectId, newName) => {
      if (!newName.trim()) return;

      try {
        if (isAnonymous) {
          const { data, error } = await currentProjectService.update(
            projectId,
            {
              name: newName.trim(),
            }
          );
          if (error) throw error;
        } else {
          await currentProjectService.update(projectId, {
            name: newName.trim(),
          });
        }

        setEditingProject(null);
        setEditingProjectValue("");
        await onProjectsUpdate();
      } catch (error) {
        console.error("Error updating project:", error);
        throw error;
      }
    },
    [isAnonymous, currentProjectService, onProjectsUpdate]
  );

  const deleteProject = useCallback(
    async (projectId) => {
      try {
        if (isAnonymous) {
          const { error } = await currentProjectService.delete(projectId);
          if (error) throw error;
        } else {
          await currentProjectService.delete(projectId);
        }
        await onProjectsUpdate();
      } catch (error) {
        console.error("Error deleting project:", error);
        throw error;
      }
    },
    [isAnonymous, currentProjectService, onProjectsUpdate]
  );

  const reorderProjects = useCallback(
    async (newProjectsOrder) => {
      try {
        setIsReordering(true);
        await currentProjectService.reorder(newProjectsOrder);
        await onProjectsUpdate();
      } catch (error) {
        console.error("Error saving project order:", error);
        throw error;
      } finally {
        setIsReordering(false);
      }
    },
    [currentProjectService, onProjectsUpdate]
  );

  return {
    editingProject,
    editingProjectValue,
    setEditingProjectValue,
    isReordering,
    startEditing,
    cancelEditing,
    createProject,
    updateProject,
    deleteProject,
    reorderProjects,
  };
}

export function useTagManagement(isAnonymous) {
  const [projectTags, setProjectTags] = useState({});

  const currentTagService = isAnonymous ? localTagService : tagService;

  const loadProjectTags = useCallback(
    async (projects) => {
      const tagsByProject = {};

      for (const project of projects) {
        if (!project.is_special) {
          try {
            if (isAnonymous) {
              const { data, error } = await currentTagService.getByProject(
                project.id
              );
              if (!error) {
                tagsByProject[project.id] = data || [];
              }
            } else {
              const data = await currentTagService.getByProject(project.id);
              tagsByProject[project.id] = data || [];
            }
          } catch (error) {
            console.error(
              `Error loading tags for project ${project.id}:`,
              error
            );
            tagsByProject[project.id] = [];
          }
        }
      }

      setProjectTags(tagsByProject);
    },
    [isAnonymous, currentTagService]
  );

  const createTag = useCallback(
    async (name, projectId) => {
      if (!name.trim() || !projectId) return;

      try {
        if (isAnonymous) {
          const { data, error } = await currentTagService.create({
            name: name.trim(),
            project_id: projectId,
          });
          if (error) throw error;
        } else {
          await currentTagService.create(name.trim(), projectId);
        }
      } catch (error) {
        console.error("Error adding tag:", error);
        throw error;
      }
    },
    [isAnonymous, currentTagService]
  );

  const deleteTag = useCallback(
    async (tagId) => {
      try {
        if (isAnonymous) {
          const { error } = await currentTagService.delete(tagId);
          if (error) throw error;
        } else {
          await currentTagService.delete(tagId);
        }
      } catch (error) {
        console.error("Error deleting tag:", error);
        throw error;
      }
    },
    [isAnonymous, currentTagService]
  );

  return {
    projectTags,
    loadProjectTags,
    createTag,
    deleteTag,
  };
}
