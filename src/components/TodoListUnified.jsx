"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navigation from "./Navigation";
import { TaskList } from "./TaskList";
import { AddTaskForm } from "./AddTaskForm";
import { EditTaskModal } from "./EditTaskModal";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useTags } from "@/hooks/useTags";
import { useTagManagement } from "@/hooks/useManagement";
import { getSpecialProjectIds } from "@/lib/todoUtils";

export function TodoListComponent() {
  const { isAnonymous } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // Custom hooks for data management
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    loadProjects,
  } = useProjects(isAnonymous);
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    moveTaskToProject,
  } = useTasks(isAnonymous, selectedProject, projects);
  const { tags, loadTags } = useTags(isAnonymous);
  const { projectTags, loadProjectTags } = useTagManagement(isAnonymous);

  // Handle project selection with URL updates
  const handleProjectSelect = (project) => {
    setSelectedProject(project);

    // Update URL with project parameter
    const params = new URLSearchParams(searchParams);
    if (project?.id) {
      params.set("project", project.id);
    } else {
      params.delete("project");
    }

    // Replace the current URL without adding to history
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Set selected project from URL parameter or default when projects load
  useEffect(() => {
    if (projects.length > 0) {
      const projectParam = searchParams.get("project");

      if (projectParam) {
        // Find project by ID from URL parameter
        const projectFromUrl =
          projects.find((p) => p.id === projectParam) ||
          (projectParam === "all"
            ? { id: "all", name: "All Projects", is_special: true }
            : null);

        if (
          projectFromUrl &&
          (!selectedProject || selectedProject.id !== projectFromUrl.id)
        ) {
          setSelectedProject(projectFromUrl);
        }
      } else if (!selectedProject) {
        // Set default project if no URL parameter and no selected project
        setSelectedProject(projects[0]);
      }
    }
  }, [projects, searchParams, selectedProject, router]);

  // Load project tags when projects change
  useEffect(() => {
    if (projects.length > 0) {
      loadProjectTags(projects);
    }
  }, [projects, loadProjectTags]);

  const specialProjectIds = getSpecialProjectIds(projects);
  const loading = projectsLoading || tasksLoading;
  const error = projectsError || tasksError;

  const handleAddTask = async (taskData) => {
    if (!selectedProject) return;

    await addTask({
      ...taskData,
      project_id: selectedProject.id,
    });
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
  };

  const handleUpdateTask = async (taskId, updates) => {
    // For Supabase, we need to include the projectId for tag updates
    const taskUpdates = isAnonymous
      ? updates
      : {
          ...updates,
          projectId: selectedProject?.id,
        };

    await updateTask(taskId, taskUpdates);
    setEditingTask(null);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  const handleMoveToToday = async (task) => {
    if (specialProjectIds.TODAY) {
      await moveTaskToProject(task, specialProjectIds.TODAY);
    }
  };

  const handleMoveToThisWeek = async (task) => {
    if (specialProjectIds.THIS_WEEK) {
      await moveTaskToProject(task, specialProjectIds.THIS_WEEK);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        isAnonymous={isAnonymous}
        projects={projects}
        selectedProject={selectedProject}
        onProjectSelect={handleProjectSelect}
        onProjectsUpdate={loadProjects}
      />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {selectedProject && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedProject.name}
                </h1>
                {isAnonymous && (
                  <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    Anonymous Mode: Your data is stored locally on this device
                  </p>
                )}
              </div>

              <AddTaskForm
                onAddTask={handleAddTask}
                disabled={loading}
                projectTags={
                  selectedProject ? projectTags[selectedProject.id] || [] : []
                }
              />

              <TaskList
                tasks={tasks}
                selectedProject={selectedProject}
                projects={projects}
                onDeleteTask={deleteTask}
                onToggleTask={toggleTask}
                onEditTask={handleEditTask}
                onMoveToToday={handleMoveToToday}
                onMoveToThisWeek={handleMoveToThisWeek}
                specialProjectIds={specialProjectIds}
              />

              <EditTaskModal
                task={editingTask}
                onUpdate={handleUpdateTask}
                onCancel={handleCancelEdit}
                isOpen={!!editingTask}
                projectTags={
                  selectedProject ? projectTags[selectedProject.id] || [] : []
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
