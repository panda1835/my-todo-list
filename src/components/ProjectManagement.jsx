import React, { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProjectItem } from "./ProjectItem";
import { useProjectManagement } from "@/hooks/useManagement";

export function ProjectManagement({ projects, onProjectsUpdate, isAnonymous }) {
  const [newProjectName, setNewProjectName] = useState("");
  const [reorderedProjects, setReorderedProjects] = useState(projects);

  const {
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
  } = useProjectManagement(isAnonymous, onProjectsUpdate);

  // Update reorderedProjects when projects prop changes
  useEffect(() => {
    if (!isReordering && projects.length > 0) {
      setReorderedProjects(projects);
    }
  }, [projects, isReordering]);

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      await createProject(newProjectName);
      setNewProjectName("");
    } catch (error) {
      // Error handling could be improved with toast notifications
      console.error("Failed to add project:", error);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProjectValue.trim()) return;

    try {
      await updateProject(editingProject, editingProjectValue);
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this project? All associated tasks and tags will also be deleted."
      )
    ) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        console.error("Failed to delete project:", error);
      }
    }
  };

  const moveProject = useCallback(
    async (projectIndex, direction) => {
      if (!reorderedProjects || reorderedProjects.length === 0) return;

      const regularProjects = reorderedProjects.filter((p) => !p.is_special);
      const specialProjects = reorderedProjects.filter((p) => p.is_special);

      const newIndex = direction === "up" ? projectIndex - 1 : projectIndex + 1;

      if (newIndex < 0 || newIndex >= regularProjects.length) return;

      // Create new array with swapped positions
      const newRegularProjects = [...regularProjects];
      [newRegularProjects[projectIndex], newRegularProjects[newIndex]] = [
        newRegularProjects[newIndex],
        newRegularProjects[projectIndex],
      ];

      // Update order indices
      const projectsWithOrder = newRegularProjects.map((project, index) => ({
        ...project,
        order_index: index + 2, // Start from 2, since special projects are 0 and 1
      }));

      const specialProjectsWithOrder = specialProjects.map((project) => ({
        ...project,
        order_index: project.order_index ?? (project.name === "Today" ? 0 : 1),
      }));

      const newProjectsOrder = [
        ...specialProjectsWithOrder,
        ...projectsWithOrder,
      ];
      setReorderedProjects(newProjectsOrder);

      try {
        await reorderProjects(newProjectsOrder);
      } catch (error) {
        // Revert on error
        setReorderedProjects(reorderedProjects);
        console.error("Failed to reorder projects:", error);
      }
    },
    [reorderedProjects, reorderProjects]
  );

  const sortedProjects = [...reorderedProjects].sort((a, b) => {
    if (a.is_special && !b.is_special) return -1;
    if (!a.is_special && b.is_special) return 1;
    return (a.order_index || 0) - (b.order_index || 0);
  });

  const regularProjects = sortedProjects.filter(
    (project) => !project.is_special
  );
  const specialProjects = sortedProjects.filter(
    (project) => project.is_special
  );

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-blue-800">Projects</h3>
      </div>

      <div className="space-y-2 mb-4">
        {/* Special projects first (non-draggable) */}
        {specialProjects.map((project) => (
          <ProjectItem
            key={project.id}
            project={project}
            isEditing={editingProject === project.id}
            editValue={editingProjectValue}
            onStartEdit={() => startEditing(project)}
            onCancelEdit={cancelEditing}
            onSave={handleUpdateProject}
            onDelete={() => handleDeleteProject(project.id)}
            onEditChange={setEditingProjectValue}
            showReorderControls={false}
          />
        ))}

        {/* Regular projects with reorder controls */}
        {regularProjects.map((project, index) => (
          <ProjectItem
            key={project.id}
            project={project}
            isEditing={editingProject === project.id}
            editValue={editingProjectValue}
            onStartEdit={() => startEditing(project)}
            onCancelEdit={cancelEditing}
            onSave={handleUpdateProject}
            onDelete={() => handleDeleteProject(project.id)}
            onEditChange={setEditingProjectValue}
            onMoveUp={() => moveProject(index, "up")}
            onMoveDown={() => moveProject(index, "down")}
            canMoveUp={index > 0}
            canMoveDown={index < regularProjects.length - 1}
            showReorderControls={true}
          />
        ))}
      </div>

      {/* Add new project form */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="New project name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          className="flex-grow"
          onKeyPress={(e) => e.key === "Enter" && handleAddProject()}
        />
        <Button
          onClick={handleAddProject}
          size="sm"
          disabled={!newProjectName.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
