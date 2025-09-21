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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Special project IDs (matching the ones in supabase-schema.sql)
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
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {showMoveButtons && projectId !== specialProjectIds?.THIS_WEEK && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveToThisWeek}
            title="Move to This Week"
            className="text-xs px-2 py-1 h-auto"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Week
          </Button>
        )}
        {showMoveButtons && projectId !== specialProjectIds?.TODAY && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveToToday}
            title="Move to Today"
            className="text-xs px-2 py-1 h-auto"
          >
            <Clock className="h-3 w-3 mr-1" />
            Today
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

export function TodoListComponent() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectTags, setProjectTags] = useState({}); // Store tags by project ID
  const [editingTask, setEditingTask] = useState(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [newTaskTags, setNewTaskTags] = useState([]);
  const [newTaskProject, setNewTaskProject] = useState("");
  const [draggedProject, setDraggedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get special project IDs dynamically
  const specialProjectIds = getSpecialProjectIds(projects);

  // Load data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load projects
      const projectsData = await projectService.getAll();
      setProjects(projectsData);

      // Load tasks
      const tasksData = await taskService.getAll();
      setTasks(tasksData);

      // Load tags for each project
      const tagsData = {};
      for (const project of projectsData) {
        if (!project.is_special) {
          tagsData[project.id] = await tagService.getByProject(project.id);
        }
      }
      setProjectTags(tagsData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data. Using local storage as fallback.");
      loadLocalData();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalData = () => {
    // Fallback to localStorage if Supabase fails
    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) setTasks(JSON.parse(storedTasks));

    const storedProjects = localStorage.getItem("projects");
    if (storedProjects) {
      setProjects(JSON.parse(storedProjects));
    } else {
      const defaultProjects = [
        {
          id: SPECIAL_PROJECT_IDS_LOCAL.TODAY,
          name: "Today",
          order_index: 0,
          is_special: true,
        },
        {
          id: SPECIAL_PROJECT_IDS_LOCAL.THIS_WEEK,
          name: "This Week Backlog",
          order_index: 1,
          is_special: true,
        },
      ];
      setProjects(defaultProjects);
    }

    const storedTags = localStorage.getItem("projectTags");
    if (storedTags) setProjectTags(JSON.parse(storedTags));
  };

  // Save to localStorage as backup
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("projects", JSON.stringify(projects));
    localStorage.setItem("projectTags", JSON.stringify(projectTags));
  }, [tasks, projects, projectTags]);

  // Project management functions
  const addNewProject = async (projectName) => {
    try {
      const newProject = await projectService.create({
        name: projectName,
        order_index: projects.length,
        is_special: false,
      });
      setProjects([...projects, newProject]);
      setProjectTags({ ...projectTags, [newProject.id]: [] });
    } catch (err) {
      console.error("Error adding project:", err);
      // Fallback to local
      const newProject = {
        id: Date.now().toString(),
        name: projectName,
        order_index: projects.length,
        is_special: false,
      };
      setProjects([...projects, newProject]);
      setProjectTags({ ...projectTags, [newProject.id]: [] });
    }
  };

  const updateProject = async (projectId, newName) => {
    try {
      await projectService.update(projectId, { name: newName });
      setProjects(
        projects.map((project) =>
          project.id === projectId ? { ...project, name: newName } : project
        )
      );
    } catch (err) {
      console.error("Error updating project:", err);
      // Fallback to local
      setProjects(
        projects.map((project) =>
          project.id === projectId ? { ...project, name: newName } : project
        )
      );
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await projectService.delete(projectId);
      setTasks(
        tasks.map((task) =>
          task.project_id === projectId ? { ...task, project_id: null } : task
        )
      );
      setProjects(projects.filter((project) => project.id !== projectId));
      const newProjectTags = { ...projectTags };
      delete newProjectTags[projectId];
      setProjectTags(newProjectTags);
    } catch (err) {
      console.error("Error deleting project:", err);
      // Fallback to local
      setTasks(
        tasks.map((task) =>
          task.project_id === projectId ? { ...task, project_id: null } : task
        )
      );
      setProjects(projects.filter((project) => project.id !== projectId));
    }
  };

  // Tag management functions
  const addTag = async (tagName, projectId) => {
    try {
      const newTag = await tagService.create(tagName, projectId);
      setProjectTags({
        ...projectTags,
        [projectId]: [...(projectTags[projectId] || []), newTag],
      });
    } catch (err) {
      console.error("Error adding tag:", err);
      // Fallback to local
      const newTag = { id: Date.now().toString(), name: tagName };
      setProjectTags({
        ...projectTags,
        [projectId]: [...(projectTags[projectId] || []), newTag],
      });
    }
  };

  const deleteTag = async (tagId, projectId) => {
    try {
      await tagService.delete(tagId);
      setProjectTags({
        ...projectTags,
        [projectId]: projectTags[projectId].filter((tag) => tag.id !== tagId),
      });
      // Remove tag from tasks
      setTasks(
        tasks.map((task) => ({
          ...task,
          tags: task.tags ? task.tags.filter((tag) => tag !== tagId) : [],
        }))
      );
    } catch (err) {
      console.error("Error deleting tag:", err);
      // Fallback to local
      setProjectTags({
        ...projectTags,
        [projectId]: projectTags[projectId].filter((tag) => tag.id !== tagId),
      });
    }
  };

  // Task management functions
  const addNewTask = async () => {
    if (newTaskText.trim() !== "") {
      try {
        const newTask = await taskService.create({
          text: newTaskText,
          priority: newTaskPriority,
          projectId: newTaskProject || null,
          tags: newTaskTags,
          completed: false,
        });
        setTasks([...tasks, newTask]);
      } catch (err) {
        console.error("Error adding task:", err);
        // Fallback to local
        const newTask = {
          id: Date.now(),
          text: newTaskText,
          completed: false,
          priority: newTaskPriority,
          tags: newTaskTags,
          project_id: newTaskProject || null,
        };
        setTasks([...tasks, newTask]);
      }

      setNewTaskText("");
      setNewTaskPriority("MEDIUM");
      setNewTaskTags([]);
      setNewTaskProject("");
    }
  };

  const updateTask = async () => {
    if (editingTask && editingTask.text.trim() !== "") {
      try {
        await taskService.update(editingTask.id, {
          text: editingTask.text,
          priority: editingTask.priority,
          projectId: editingTask.project_id,
          completed: editingTask.completed,
          tags: editingTask.tags,
        });
        setTasks(
          tasks.map((task) => (task.id === editingTask.id ? editingTask : task))
        );
      } catch (err) {
        console.error("Error updating task:", err);
        // Fallback to local
        setTasks(
          tasks.map((task) => (task.id === editingTask.id ? editingTask : task))
        );
      }
      setEditingTask(null);
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      try {
        await taskService.update(id, { completed: !task.completed });
        setTasks(
          tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          )
        );
      } catch (err) {
        console.error("Error toggling task:", err);
        // Fallback to local
        setTasks(
          tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          )
        );
      }
    }
  };

  const removeTask = async (id) => {
    try {
      await taskService.delete(id);
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (err) {
      console.error("Error deleting task:", err);
      // Fallback to local
      setTasks(tasks.filter((task) => task.id !== id));
    }
  };

  const moveTaskToProject = async (taskId, projectId) => {
    try {
      await taskService.moveToProject(taskId, projectId);
      setTasks(
        tasks.map((task) =>
          task.id === taskId ? { ...task, project_id: projectId } : task
        )
      );
    } catch (err) {
      console.error("Error moving task:", err);
      // Fallback to local
      setTasks(
        tasks.map((task) =>
          task.id === taskId ? { ...task, project_id: projectId } : task
        )
      );
    }
  };

  // Drag and drop functions
  const handleProjectDragStart = (e, projectId) => {
    setDraggedProject(projectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleProjectDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleProjectDrop = async (e, targetProjectId) => {
    e.preventDefault();

    if (draggedProject && draggedProject !== targetProjectId) {
      const draggedIndex = projects.findIndex((p) => p.id === draggedProject);
      const targetIndex = projects.findIndex((p) => p.id === targetProjectId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newProjects = [...projects];
        const draggedItem = newProjects.splice(draggedIndex, 1)[0];
        newProjects.splice(targetIndex, 0, draggedItem);

        const updatedProjects = newProjects.map((project, index) => ({
          ...project,
          order_index: index,
        }));

        try {
          await projectService.reorder(updatedProjects);
        } catch (err) {
          console.error("Error reordering projects:", err);
        }

        setProjects(updatedProjects);
      }
    }
    setDraggedProject(null);
  };

  const getTasksForProject = (projectId) => {
    return tasks
      .filter((task) => task.project_id === projectId)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  const getUnassignedTasks = () => {
    return tasks
      .filter((task) => !task.project_id)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  const getTagsForProject = (projectId) => {
    return projectTags[projectId] || [];
  };

  const sortedProjects = [...projects].sort(
    (a, b) => a.order_index - b.order_index
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="max-w-6xl mx-auto px-6 mb-4">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700 mb-2">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>
      {error && (
        <div className="max-w-6xl mx-auto px-6 mb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {activeTab === "management" ? (
        <Management
          projects={projects}
          onAddProject={addNewProject}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
          onProjectDragStart={handleProjectDragStart}
          onProjectDragOver={handleProjectDragOver}
          onProjectDrop={handleProjectDrop}
          onAddTag={addTag}
          onDeleteTag={deleteTag}
          getTagsForProject={getTagsForProject}
        />
      ) : (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
          {/* Task Creation */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">
              {editingTask ? "Edit Task" : "Add New Task"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                value={editingTask ? editingTask.text : newTaskText}
                onChange={(e) =>
                  editingTask
                    ? setEditingTask({ ...editingTask, text: e.target.value })
                    : setNewTaskText(e.target.value)
                }
                placeholder="Task description"
                className="col-span-full"
              />

              <Select
                value={editingTask ? editingTask.priority : newTaskPriority}
                onValueChange={(value) =>
                  editingTask
                    ? setEditingTask({ ...editingTask, priority: value })
                    : setNewTaskPriority(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={
                  editingTask
                    ? editingTask.project_id || "no-project"
                    : newTaskProject || "no-project"
                }
                onValueChange={(value) => {
                  const projectId = value === "no-project" ? null : value;
                  if (editingTask) {
                    setEditingTask({ ...editingTask, project_id: projectId });
                  } else {
                    setNewTaskProject(projectId);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-project">No Project</SelectItem>
                  {sortedProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project-specific tags */}
            {(editingTask?.project_id || newTaskProject) && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">
                  Tags for this project:
                </h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {getTagsForProject(
                    editingTask?.project_id || newTaskProject
                  ).map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border"
                    >
                      <Checkbox
                        checked={
                          editingTask
                            ? (editingTask.tags || []).includes(tag.name)
                            : newTaskTags.includes(tag.name)
                        }
                        onCheckedChange={(checked) => {
                          if (editingTask) {
                            const newTags = checked
                              ? [...(editingTask.tags || []), tag.name]
                              : (editingTask.tags || []).filter(
                                  (t) => t !== tag.name
                                );
                            setEditingTask((prev) => ({
                              ...prev,
                              tags: newTags,
                            }));
                          } else {
                            setNewTaskTags((prev) =>
                              checked
                                ? [...prev, tag.name]
                                : prev.filter((t) => t !== tag.name)
                            );
                          }
                        }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button onClick={editingTask ? updateTask : addNewTask}>
                {editingTask ? "Update Task" : "Add Task"}
              </Button>
              {editingTask && (
                <Button onClick={() => setEditingTask(null)} variant="outline">
                  Cancel
                </Button>
              )}
            </div>
          </div>

          <Separator className="my-8" />

          {/* Tasks by Project */}
          <div className="space-y-8">
            {/* Today's Tasks */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-red-800 flex items-center">
                <Clock className="h-6 w-6 mr-2" />
                Today ({getTasksForProject(specialProjectIds.TODAY).length})
              </h2>
              <ul className="space-y-2">
                {getTasksForProject(specialProjectIds.TODAY).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    projectId={specialProjectIds.TODAY}
                    onToggle={() => toggleTask(task.id)}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => removeTask(task.id)}
                    onMoveToThisWeek={() =>
                      moveTaskToProject(task.id, specialProjectIds.THIS_WEEK)
                    }
                    onMoveToToday={() => {}}
                    showMoveButtons={false}
                    specialProjectIds={specialProjectIds}
                  />
                ))}
                {getTasksForProject(specialProjectIds.TODAY).length === 0 && (
                  <p className="text-gray-500 italic">No tasks for today</p>
                )}
              </ul>
            </div>

            {/* This Week Backlog */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-yellow-800 flex items-center">
                <Calendar className="h-6 w-6 mr-2" />
                This Week Backlog (
                {getTasksForProject(specialProjectIds.THIS_WEEK).length})
              </h2>
              <ul className="space-y-2">
                {getTasksForProject(specialProjectIds.THIS_WEEK).map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    projectId={specialProjectIds.THIS_WEEK}
                    onToggle={() => toggleTask(task.id)}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => removeTask(task.id)}
                    onMoveToThisWeek={() => {}}
                    onMoveToToday={() =>
                      moveTaskToProject(task.id, specialProjectIds.TODAY)
                    }
                    specialProjectIds={specialProjectIds}
                  />
                ))}
                {getTasksForProject(specialProjectIds.THIS_WEEK).length ===
                  0 && (
                  <p className="text-gray-500 italic">
                    No tasks in this week's backlog
                  </p>
                )}
              </ul>
            </div>

            {/* Regular Projects */}
            {sortedProjects
              .filter((project) => !project.is_special)
              .map((project) => (
                <div key={project.id} className="bg-blue-50 p-4 rounded-lg">
                  <h2 className="text-2xl font-bold mb-4 text-blue-800 flex items-center">
                    {project.name} ({getTasksForProject(project.id).length})
                  </h2>
                  <ul className="space-y-2">
                    {getTasksForProject(project.id).map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        projectId={project.id}
                        onToggle={() => toggleTask(task.id)}
                        onEdit={() => setEditingTask(task)}
                        onDelete={() => removeTask(task.id)}
                        onMoveToThisWeek={() =>
                          moveTaskToProject(
                            task.id,
                            specialProjectIds.THIS_WEEK
                          )
                        }
                        onMoveToToday={() =>
                          moveTaskToProject(task.id, specialProjectIds.TODAY)
                        }
                        specialProjectIds={specialProjectIds}
                      />
                    ))}
                    {getTasksForProject(project.id).length === 0 && (
                      <p className="text-gray-500 italic">
                        No tasks in this project
                      </p>
                    )}
                  </ul>
                </div>
              ))}

            {/* Unassigned Tasks */}
            {getUnassignedTasks().length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  No Project ({getUnassignedTasks().length})
                </h2>
                <ul className="space-y-2">
                  {getUnassignedTasks().map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      projectId={null}
                      onToggle={() => toggleTask(task.id)}
                      onEdit={() => setEditingTask(task)}
                      onDelete={() => removeTask(task.id)}
                      onMoveToThisWeek={() =>
                        moveTaskToProject(task.id, specialProjectIds.THIS_WEEK)
                      }
                      onMoveToToday={() =>
                        moveTaskToProject(task.id, specialProjectIds.TODAY)
                      }
                      specialProjectIds={specialProjectIds}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
