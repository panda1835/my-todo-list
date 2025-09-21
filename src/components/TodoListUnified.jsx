"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Edit2,
  Plus,
  X,
  Calendar,
  Clock,
  ArrowRight,
  GripVertical,
} from "lucide-react";
import Navigation from "./Navigation";
import Management from "./Management";
import { projectService, taskService, tagService } from "@/lib/supabase";
import {
  localProjectService,
  localTaskService,
  localTagService,
} from "@/lib/localStorage";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper functions to get special project IDs
const getSpecialProjectIds = (projects) => {
  const todayProject = projects.find((p) => p.is_special && p.name === "Today");
  const thisWeekProject = projects.find(
    (p) => p.is_special && p.name === "This Week Backlog"
  );

  return {
    TODAY: todayProject?.id,
    THIS_WEEK: thisWeekProject?.id,
  };
};

const priorityColors = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
};

const priorityOrder = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

// Task Item Component
function TaskItem({
  task,
  onDelete,
  onUpdate,
  onToggle,
  onEdit,
  projectId,
  showMoveButtons = false,
  onMoveToToday,
  onMoveToThisWeek,
  specialProjectIds,
  showProjectName = false,
}) {
  return (
    <li className="flex items-center bg-gray-50 p-3 rounded mb-2 group hover:bg-gray-100 transition-colors">
      <div className="flex items-center cursor-grab mr-2">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <Checkbox
        checked={task.completed}
        onCheckedChange={onToggle}
        className="mr-3"
      />
      <div className="flex-grow">
        <span
          className={`block ${
            task.completed ? "line-through text-gray-400" : "text-gray-800"
          }`}
        >
          {task.text}
        </span>
        <div className="flex items-center mt-1 gap-2">
          {showProjectName && task.projectName && (
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
              📁 {task.projectName}
            </span>
          )}
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              priorityColors[task.priority]
            }`}
          >
            {task.priority}
          </span>
          {task.tags &&
            task.tags.map((tag) => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          {task.due_date && (
            <span className="text-xs text-gray-500 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showMoveButtons && (
          <>
            {(projectId === "all" ? task.project_id : projectId) !==
              specialProjectIds.TODAY && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("=== TODAY BUTTON CLICKED ===");
                  console.log("Button clicked, calling onMoveToToday");
                  onMoveToToday();
                }}
                className="text-xs"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Today
              </Button>
            )}
            {(projectId === "all" ? task.project_id : projectId) !==
              specialProjectIds.THIS_WEEK && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("=== THIS WEEK BUTTON CLICKED ===");
                  console.log("Button clicked, calling onMoveToThisWeek");
                  onMoveToThisWeek();
                }}
                className="text-xs"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Week
              </Button>
            )}
          </>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(task)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

export function TodoListComponent() {
  const { isAnonymous } = useAuth();

  // Choose the appropriate service based on authentication mode
  const currentProjectService = isAnonymous
    ? localProjectService
    : projectService;
  const currentTaskService = isAnonymous ? localTaskService : taskService;
  const currentTagService = isAnonymous ? localTagService : tagService;

  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [newTaskTags, setNewTaskTags] = useState([]);
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState("MEDIUM");
  const [editTaskTags, setEditTaskTags] = useState([]);
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showManagement, setShowManagement] = useState(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
    loadTags();
  }, [isAnonymous]);

  // Load tasks when selected project changes
  useEffect(() => {
    if (selectedProject) {
      if (selectedProject.id === "all") {
        loadAllTasks();
      } else {
        loadTasks(selectedProject.id);
      }
    }
  }, [selectedProject, isAnonymous]);

  const loadProjects = async () => {
    try {
      let projectsData = [];

      if (isAnonymous) {
        const { data, error } = await currentProjectService.getAll();
        if (error) throw error;
        projectsData = data || [];
      } else {
        // Supabase returns data directly
        projectsData = (await currentProjectService.getAll()) || [];
      }

      console.log("=== PROJECTS LOADED ===");
      console.log("Total projects:", projectsData.length);
      console.log("Projects:", projectsData);

      const specialProjectIds = getSpecialProjectIds(projectsData);
      console.log("Special project IDs:", specialProjectIds);
      console.log("=== END PROJECTS DEBUG ===");

      setProjects(projectsData);

      // Select the first project by default
      if (
        projects.length === 0 &&
        projectsData.length > 0 &&
        !selectedProject
      ) {
        setSelectedProject(projectsData[0]);
      }
    } catch (err) {
      console.error("Error loading projects:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (projectId) => {
    try {
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

      // Sort tasks by priority and completion status
      const sortedTasks = tasksData.sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      console.log(
        `Loaded ${sortedTasks.length} tasks for project ${projectId}:`,
        sortedTasks
      );
      setTasks(sortedTasks);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError(err.message);
    }
  };

  const loadAllTasks = async () => {
    try {
      if (isAnonymous) {
        // Load all tasks from localStorage
        const allProjectTasks = [];
        for (const project of projects) {
          const { data, error } = await currentTaskService.getByProject(
            project.id
          );
          if (error) throw error;
          if (data) {
            // Add project name to each task for display
            const tasksWithProject = data.map((task) => ({
              ...task,
              projectName: project.name,
            }));
            allProjectTasks.push(...tasksWithProject);
          }
        }

        // Sort tasks by priority and completion status
        const sortedTasks = allProjectTasks.sort((a, b) => {
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        setTasks(sortedTasks);
      } else {
        // For Supabase, get all tasks
        const allTasks = await currentTaskService.getAll();

        // Add project names to tasks
        const tasksWithProjects = allTasks.map((task) => {
          const project = projects.find((p) => p.id === task.project_id);
          return {
            ...task,
            projectName: project?.name || "Unknown Project",
          };
        });

        // Sort tasks by priority and completion status
        const sortedTasks = tasksWithProjects.sort((a, b) => {
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        setTasks(sortedTasks);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const loadTags = async () => {
    try {
      if (isAnonymous) {
        const { data, error } = await currentTagService.getAll();
        if (error) throw error;
        setTags(data || []);
      } else {
        // For Supabase, we'll load project-specific tags
        // For now, just set empty array and handle in Management component
        setTags([]);
      }
    } catch (err) {
      console.error("Error loading tags:", err);
    }
  };

  const addTask = async () => {
    if (!newTaskText.trim() || !selectedProject) return;

    try {
      const taskData = {
        text: newTaskText.trim(),
        priority: newTaskPriority,
        project_id: selectedProject.id,
        tags: newTaskTags,
        due_date: newTaskDueDate || null,
      };

      if (isAnonymous) {
        const { data, error } = await currentTaskService.create(taskData);
        if (error) throw error;
        setTasks([...tasks, data]);
      } else {
        // For Supabase
        const newTask = await currentTaskService.create({
          ...taskData,
          projectId: selectedProject.id, // Supabase expects projectId
        });
        setTasks([...tasks, newTask]);
      }

      setNewTaskText("");
      setNewTaskPriority("MEDIUM");
      setNewTaskTags([]);
      setNewTaskDueDate("");
    } catch (err) {
      setError(err.message);
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

      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleTask = async (taskId) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (isAnonymous) {
        const { data, error } = await currentTaskService.update(taskId, {
          completed: !task.completed,
        });
        if (error) throw error;
      } else {
        await currentTaskService.update(taskId, {
          completed: !task.completed,
        });
      }

      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const editTask = (task) => {
    setEditingTask(task);
    setEditTaskText(task.text);
    setEditTaskPriority(task.priority);
    setEditTaskTags(task.tags || []);
    setEditTaskDueDate(task.due_date || "");
  };

  const updateTask = async () => {
    if (!editTaskText.trim() || !editingTask) return;

    try {
      const updates = {
        text: editTaskText.trim(),
        priority: editTaskPriority,
        tags: editTaskTags,
        due_date: editTaskDueDate || null,
      };

      if (isAnonymous) {
        const { data, error } = await currentTaskService.update(
          editingTask.id,
          updates
        );
        if (error) throw error;
      } else {
        await currentTaskService.update(editingTask.id, updates);
      }

      setTasks(
        tasks.map((t) => (t.id === editingTask.id ? { ...t, ...updates } : t))
      );

      setEditingTask(null);
      setEditTaskText("");
      setEditTaskPriority("MEDIUM");
      setEditTaskTags([]);
      setEditTaskDueDate("");
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditTaskText("");
    setEditTaskPriority("MEDIUM");
    setEditTaskTags([]);
    setEditTaskDueDate("");
  };

  const specialProjectIds = getSpecialProjectIds(projects);

  const moveTaskToProject = async (task, targetProjectId) => {
    try {
      console.log("=== MOVE TASK DEBUG ===");
      console.log("Moving task:", task);
      console.log("To project ID:", targetProjectId);
      console.log("Special project IDs:", specialProjectIds);
      console.log("All projects:", projects);
      console.log("Current selected project:", selectedProject);

      if (!targetProjectId) {
        console.error("Target project ID is undefined");
        setError("Target project not found");
        return;
      }

      // Add validation to ensure target project exists
      const targetProject = projects.find((p) => p.id === targetProjectId);
      if (!targetProject) {
        console.error("Target project not found in projects list");
        setError("Target project not found");
        return;
      }

      console.log("Target project found:", targetProject);

      if (isAnonymous) {
        const { data, error } = await currentTaskService.update(task.id, {
          project_id: targetProjectId,
        });
        if (error) {
          console.error("localStorage update error:", error);
          throw error;
        }
        console.log("Task moved successfully (localStorage):", data);
      } else {
        const updatedTask = await currentTaskService.update(task.id, {
          projectId: targetProjectId, // Note: Supabase expects projectId, not project_id
        });
        console.log("Task moved successfully (Supabase):", updatedTask);
      }

      // Reload tasks to reflect the change
      console.log("Reloading tasks for project:", selectedProject.id);
      if (selectedProject.id === "all") {
        await loadAllTasks();
      } else {
        await loadTasks(selectedProject.id);
      }
      console.log("Tasks reloaded successfully");
      console.log("=== END MOVE TASK DEBUG ===");
    } catch (err) {
      console.error("Error moving task:", err);
      setError(err.message);
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
        onProjectSelect={setSelectedProject}
        onProjectsUpdate={loadProjects}
        onManageClick={() => setShowManagement(true)}
      />

      <div className="flex-1 lg:ml-64">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {/* Add top padding for mobile menu button */}
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

              {/* Add new task */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex flex-col gap-4 mb-4 md:flex-row">
                  <Input
                    type="text"
                    placeholder="Add a new task..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTask()}
                    className="flex-grow"
                  />
                  <div className="flex gap-2 flex-row">
                    <Select
                      value={newTaskPriority}
                      onValueChange={setNewTaskPriority}
                    >
                      <SelectTrigger className="w-full md:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full md:w-40"
                    />
                  </div>

                  <Button className="w-full md:w-auto" onClick={addTask}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Task list */}
              <div className="bg-white rounded-lg shadow">
                {tasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No tasks yet. Add one above to get started!</p>
                  </div>
                ) : selectedProject.id === "all" ? (
                  // Group tasks by project for "View All Projects"
                  <div className="p-6">
                    {(() => {
                      // Group tasks by project
                      const tasksByProject = tasks.reduce((acc, task) => {
                        const projectName =
                          task.projectName || "Unknown Project";
                        if (!acc[projectName]) {
                          acc[projectName] = [];
                        }
                        acc[projectName].push(task);
                        return acc;
                      }, {});

                      return Object.entries(tasksByProject).map(
                        ([projectName, projectTasks]) => (
                          <div key={projectName} className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                              📁 {projectName} ({projectTasks.length} tasks)
                            </h3>
                            <ul className="space-y-2">
                              {projectTasks.map((task) => (
                                <TaskItem
                                  key={task.id}
                                  task={task}
                                  onDelete={deleteTask}
                                  onToggle={() => toggleTask(task.id)}
                                  onEdit={editTask}
                                  projectId={selectedProject.id}
                                  showMoveButtons={true}
                                  showProjectName={false} // Don't show project name as tag since it's in the heading
                                  onMoveToToday={() => {
                                    console.log(
                                      "Move to Today clicked for task:",
                                      task.id,
                                      "Target:",
                                      specialProjectIds.TODAY
                                    );
                                    moveTaskToProject(
                                      task,
                                      specialProjectIds.TODAY
                                    );
                                  }}
                                  onMoveToThisWeek={() => {
                                    console.log(
                                      "Move to This Week clicked for task:",
                                      task.id,
                                      "Target:",
                                      specialProjectIds.THIS_WEEK
                                    );
                                    moveTaskToProject(
                                      task,
                                      specialProjectIds.THIS_WEEK
                                    );
                                  }}
                                  specialProjectIds={specialProjectIds}
                                />
                              ))}
                            </ul>
                          </div>
                        )
                      );
                    })()}
                  </div>
                ) : (
                  <ul className="p-6">
                    {tasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onDelete={deleteTask}
                        onToggle={() => toggleTask(task.id)}
                        onEdit={editTask}
                        projectId={selectedProject.id}
                        showMoveButtons={!selectedProject.is_special}
                        showProjectName={false}
                        onMoveToToday={() => {
                          console.log(
                            "Move to Today clicked for task:",
                            task.id,
                            "Target:",
                            specialProjectIds.TODAY
                          );
                          moveTaskToProject(task, specialProjectIds.TODAY);
                        }}
                        onMoveToThisWeek={() => {
                          console.log(
                            "Move to This Week clicked for task:",
                            task.id,
                            "Target:",
                            specialProjectIds.THIS_WEEK
                          );
                          moveTaskToProject(task, specialProjectIds.THIS_WEEK);
                        }}
                        specialProjectIds={specialProjectIds}
                      />
                    ))}
                  </ul>
                )}
              </div>

              {/* Edit task modal */}
              {editingTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4">Edit Task</h3>
                    <div className="space-y-4">
                      <Input
                        type="text"
                        value={editTaskText}
                        onChange={(e) => setEditTaskText(e.target.value)}
                        placeholder="Task text"
                      />
                      <Select
                        value={editTaskPriority}
                        onValueChange={setEditTaskPriority}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        value={editTaskDueDate}
                        onChange={(e) => setEditTaskDueDate(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button onClick={updateTask} className="flex-1">
                        Update
                      </Button>
                      <Button
                        onClick={cancelEdit}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Management
        isAnonymous={isAnonymous}
        projects={projects}
        onProjectsUpdate={loadProjects}
        tags={tags}
        onTagsUpdate={loadTags}
        show={showManagement}
        onClose={() => setShowManagement(false)}
      />
    </div>
  );
}
