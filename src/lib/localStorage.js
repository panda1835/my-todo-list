"use client";

// Keys for localStorage
const STORAGE_KEYS = {
  PROJECTS: "todo_projects",
  TASKS: "todo_tasks",
  TAGS: "todo_tags",
  USER: "todo_anonymous_user",
};

// Helper function to generate unique IDs
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Helper function to get current date/time
const getCurrentTimestamp = () => new Date().toISOString();

// Get data from localStorage
const getFromStorage = (key, defaultValue = []) => {
  if (typeof window === "undefined") return defaultValue;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key ${key}:`, error);
    return defaultValue;
  }
};

// Save data to localStorage
const saveToStorage = (key, data) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage key ${key}:`, error);
  }
};

// Initialize default projects if none exist
const initializeDefaultProjects = () => {
  const projects = getFromStorage(STORAGE_KEYS.PROJECTS);

  if (projects.length === 0) {
    const defaultProjects = [
      {
        id: "today-" + generateId(),
        name: "Today",
        is_special: true,
        order_index: 0,
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      },
      {
        id: "thisweek-" + generateId(),
        name: "This Week Backlog",
        is_special: true,
        order_index: 1,
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      },
      {
        id: "general-" + generateId(),
        name: "General Tasks",
        is_special: false,
        order_index: 2,
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      },
    ];

    saveToStorage(STORAGE_KEYS.PROJECTS, defaultProjects);
    return defaultProjects;
  }

  return projects;
};

// Create anonymous user
const createAnonymousUser = () => {
  const user = {
    id: "anonymous-" + generateId(),
    email: "anonymous@local.com",
    name: "Anonymous User",
    isAnonymous: true,
    created_at: getCurrentTimestamp(),
  };

  saveToStorage(STORAGE_KEYS.USER, user);
  return user;
};

// Project service
export const localProjectService = {
  getAll: async () => {
    const projects = initializeDefaultProjects();
    return { data: projects, error: null };
  },

  create: async (projectData) => {
    try {
      const projects = getFromStorage(STORAGE_KEYS.PROJECTS);

      // Find the highest order_index for regular projects
      const regularProjects = projects.filter((p) => !p.is_special);
      const maxOrderIndex =
        regularProjects.length > 0
          ? Math.max(...regularProjects.map((p) => p.order_index || 0))
          : 1; // Start after special projects (0, 1)

      const newProject = {
        id: generateId(),
        ...projectData,
        is_special: false,
        order_index: maxOrderIndex + 1,
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      };

      projects.push(newProject);
      saveToStorage(STORAGE_KEYS.PROJECTS, projects);

      return { data: newProject, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  update: async (id, updates) => {
    try {
      const projects = getFromStorage(STORAGE_KEYS.PROJECTS);
      const index = projects.findIndex((p) => p.id === id);

      if (index === -1) {
        return { data: null, error: new Error("Project not found") };
      }

      projects[index] = {
        ...projects[index],
        ...updates,
        updated_at: getCurrentTimestamp(),
      };

      saveToStorage(STORAGE_KEYS.PROJECTS, projects);
      return { data: projects[index], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  delete: async (id) => {
    try {
      const projects = getFromStorage(STORAGE_KEYS.PROJECTS);
      const filteredProjects = projects.filter((p) => p.id !== id);

      saveToStorage(STORAGE_KEYS.PROJECTS, filteredProjects);

      // Also delete associated tasks
      const tasks = getFromStorage(STORAGE_KEYS.TASKS);
      const filteredTasks = tasks.filter((t) => t.project_id !== id);
      saveToStorage(STORAGE_KEYS.TASKS, filteredTasks);

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  reorder: async (projectsArray) => {
    try {
      const projects = getFromStorage(STORAGE_KEYS.PROJECTS);

      // Update order_index for each project based on the provided order
      const updatedProjects = projects.map((project) => {
        const matchingProject = projectsArray.find((p) => p.id === project.id);
        return {
          ...project,
          order_index: matchingProject
            ? matchingProject.order_index
            : project.order_index || 0,
          updated_at: getCurrentTimestamp(),
        };
      });

      saveToStorage(STORAGE_KEYS.PROJECTS, updatedProjects);
      return { data: updatedProjects, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

// Task service
export const localTaskService = {
  getByProject: async (projectId) => {
    try {
      const tasks = getFromStorage(STORAGE_KEYS.TASKS);
      const projectTasks = tasks.filter((t) => t.project_id === projectId);
      return { data: projectTasks, error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  create: async (taskData) => {
    try {
      const tasks = getFromStorage(STORAGE_KEYS.TASKS);
      const newTask = {
        id: generateId(),
        ...taskData,
        completed: false,
        created_at: getCurrentTimestamp(),
        updated_at: getCurrentTimestamp(),
      };

      tasks.push(newTask);
      saveToStorage(STORAGE_KEYS.TASKS, tasks);

      return { data: newTask, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  update: async (id, updates) => {
    try {
      const tasks = getFromStorage(STORAGE_KEYS.TASKS);
      const index = tasks.findIndex((t) => t.id === id);

      if (index === -1) {
        return { data: null, error: new Error("Task not found") };
      }

      tasks[index] = {
        ...tasks[index],
        ...updates,
        updated_at: getCurrentTimestamp(),
      };

      saveToStorage(STORAGE_KEYS.TASKS, tasks);
      return { data: tasks[index], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  delete: async (id) => {
    try {
      const tasks = getFromStorage(STORAGE_KEYS.TASKS);
      const filteredTasks = tasks.filter((t) => t.id !== id);

      saveToStorage(STORAGE_KEYS.TASKS, filteredTasks);
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  reorder: async (projectId, taskIds) => {
    try {
      const tasks = getFromStorage(STORAGE_KEYS.TASKS);

      // Update order for tasks in the project
      taskIds.forEach((taskId, index) => {
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
          task.order = index;
          task.updated_at = getCurrentTimestamp();
        }
      });

      saveToStorage(STORAGE_KEYS.TASKS, tasks);
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

// Tag service
export const localTagService = {
  getAll: async () => {
    try {
      const tags = getFromStorage(STORAGE_KEYS.TAGS);
      return { data: tags, error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  getByProject: async (projectId) => {
    try {
      const tags = getFromStorage(STORAGE_KEYS.TAGS);
      const projectTags = tags.filter((tag) => tag.project_id === projectId);
      return { data: projectTags, error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  create: async (tagData) => {
    try {
      const tags = getFromStorage(STORAGE_KEYS.TAGS);
      const newTag = {
        id: generateId(),
        ...tagData,
        created_at: getCurrentTimestamp(),
      };

      tags.push(newTag);
      saveToStorage(STORAGE_KEYS.TAGS, tags);

      return { data: newTag, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  delete: async (id) => {
    try {
      const tags = getFromStorage(STORAGE_KEYS.TAGS);
      const filteredTags = tags.filter((t) => t.id !== id);

      saveToStorage(STORAGE_KEYS.TAGS, filteredTags);
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

// Auth service for anonymous mode
export const localAuthService = {
  getUser: () => {
    return getFromStorage(STORAGE_KEYS.USER, null);
  },

  setAnonymousUser: () => {
    return createAnonymousUser();
  },

  clearUser: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.USER);
      // Don't remove projects, tasks, and tags to preserve data
      // localStorage.removeItem(STORAGE_KEYS.PROJECTS);
      // localStorage.removeItem(STORAGE_KEYS.TASKS);
      // localStorage.removeItem(STORAGE_KEYS.TAGS);
    }
  },

  clearAllData: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.PROJECTS);
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.TAGS);
    }
  },
};
