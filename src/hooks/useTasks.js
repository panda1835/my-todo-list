import { useState, useEffect } from "react";
import { taskService } from "@/lib/supabase";
import { localTaskService } from "@/lib/localStorage";

const priorityOrder = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

const sortTasks = (tasks) => {
  return tasks.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

export function useTasks(isAnonymous, selectedProject, projects) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentTaskService = isAnonymous ? localTaskService : taskService;

  const loadTasks = async (projectId) => {
    try {
      setLoading(true);
      let tasksData;

      if (isAnonymous) {
        const { data, error } = await currentTaskService.getByProject(
          projectId
        );
        if (error) throw error;
        tasksData = data || [];
      } else {
        tasksData = await currentTaskService.getByProject(projectId);
      }

      const sortedTasks = sortTasks(tasksData);
      setTasks(sortedTasks);
      setError(null);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTasks = async () => {
    try {
      setLoading(true);

      if (isAnonymous) {
        const allProjectTasks = [];
        for (const project of projects) {
          const { data, error } = await currentTaskService.getByProject(
            project.id
          );
          if (error) throw error;
          if (data) {
            const tasksWithProject = data.map((task) => ({
              ...task,
              projectName: project.name,
            }));
            allProjectTasks.push(...tasksWithProject);
          }
        }
        const sortedTasks = sortTasks(allProjectTasks);
        setTasks(sortedTasks);
      } else {
        const allTasks = await currentTaskService.getAll();
        const tasksWithProjects = allTasks.map((task) => {
          const project = projects.find((p) => p.id === task.project_id);
          return {
            ...task,
            projectName: project?.name || "Unknown Project",
          };
        });
        const sortedTasks = sortTasks(tasksWithProjects);
        setTasks(sortedTasks);
      }
      setError(null);
    } catch (err) {
      console.error("Error loading all tasks:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData) => {
    try {
      if (isAnonymous) {
        const { data, error } = await currentTaskService.create(taskData);
        if (error) throw error;
        setTasks((prevTasks) => sortTasks([...prevTasks, data]));
        return data;
      } else {
        const newTask = await currentTaskService.create({
          ...taskData,
          projectId: taskData.project_id,
        });
        setTasks((prevTasks) => sortTasks([...prevTasks, newTask]));
        return newTask;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      if (isAnonymous) {
        const { data, error } = await currentTaskService.update(
          taskId,
          updates
        );
        if (error) throw error;
      } else {
        await currentTaskService.update(taskId, updates);
      }

      setTasks((prevTasks) =>
        sortTasks(
          prevTasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      if (isAnonymous) {
        const { error } = await currentTaskService.delete(taskId);
        if (error) throw error;
      } else {
        await currentTaskService.delete(taskId);
      }

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const toggleTask = async (taskId) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const updates = { completed: !task.completed };
      await updateTask(taskId, updates);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const moveTaskToProject = async (task, targetProjectId) => {
    try {
      const targetProject = projects.find((p) => p.id === targetProjectId);
      if (!targetProject) {
        throw new Error("Target project not found");
      }

      const updates = isAnonymous
        ? { project_id: targetProjectId }
        : { projectId: targetProjectId };

      await updateTask(task.id, updates);

      // Reload tasks to reflect the change
      if (selectedProject?.id === "all") {
        await loadAllTasks();
      } else if (selectedProject?.id) {
        await loadTasks(selectedProject.id);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (selectedProject) {
      if (selectedProject.id === "all") {
        loadAllTasks();
      } else {
        loadTasks(selectedProject.id);
      }
    }
  }, [selectedProject, isAnonymous]);

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    moveTaskToProject,
    loadTasks,
    loadAllTasks,
  };
}
