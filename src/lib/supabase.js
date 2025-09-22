// Supabase helper functions for the todo app
// First, install @supabase/supabase-js: npm install @supabase/supabase-js
// Then create a .env.local file with your Supabase credentials:
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get current user
const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  return user;
};

// Helper function to create default projects for new users
export const createDefaultProjectsForUser = async (userId) => {
  const defaultProjects = [
    { name: "Today", order_index: 0, is_special: true, user_id: userId },
    {
      name: "This Week Backlog",
      order_index: 1,
      is_special: true,
      user_id: userId,
    },
  ];

  const { data, error } = await supabase
    .from("projects")
    .insert(defaultProjects)
    .select();

  if (error) throw error;
  return data;
};

// Project functions
export const projectService = {
  async getAll() {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("order_index");

    if (error) throw error;

    // If no projects exist, create default ones
    if (!data || data.length === 0) {
      return await createDefaultProjectsForUser(user.id);
    }

    return data;
  },

  async create(project) {
    const user = await getCurrentUser();

    // Get the highest order_index for regular projects
    const { data: existingProjects } = await supabase
      .from("projects")
      .select("order_index")
      .eq("user_id", user.id)
      .eq("is_special", false)
      .order("order_index", { ascending: false })
      .limit(1);

    const maxOrderIndex =
      existingProjects && existingProjects.length > 0
        ? existingProjects[0].order_index
        : 1; // Start after special projects (0, 1)

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          ...project,
          user_id: user.id,
          order_index: maxOrderIndex + 1,
          is_special: false,
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  },

  async update(id, updates) {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select();

    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const user = await getCurrentUser();
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
  },

  async reorder(projects) {
    const user = await getCurrentUser();

    // Update each project individually to ensure proper updates
    for (const project of projects) {
      const { error } = await supabase
        .from("projects")
        .update({ order_index: project.order_index })
        .eq("id", project.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating project:", project.id, error);
        throw error;
      }
    }
  },
};

// Task functions
export const taskService = {
  async getAll() {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        task_tags (
          tags (
            id,
            name
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("order_index");

    if (error) throw error;

    // Transform the data to match your current structure
    return data.map((task) => ({
      ...task,
      tags: task.task_tags.map((tt) => tt.tags.name),
    }));
  },

  async getByProject(projectId) {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        task_tags (
          tags (
            id,
            name
          )
        )
      `
      )
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .order("order_index");

    if (error) throw error;

    // Transform the data to match your current structure
    return data.map((task) => ({
      ...task,
      tags: task.task_tags.map((tt) => tt.tags.name),
    }));
  },

  async create(task) {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          text: task.text,
          priority: task.priority,
          project_id: task.projectId,
          completed: task.completed || false,
          user_id: user.id,
        },
      ])
      .select();

    if (error) throw error;

    const newTask = data[0];

    // Add tags if any
    if (task.tags && task.tags.length > 0 && task.projectId) {
      await this.updateTaskTags(newTask.id, task.tags, task.projectId);
    }

    return newTask;
  },

  async update(id, updates) {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("tasks")
      .update({
        text: updates.text,
        priority: updates.priority,
        project_id: updates.projectId,
        completed: updates.completed,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select();

    if (error) throw error;

    // Update tags if provided
    if (updates.tags !== undefined && updates.projectId !== undefined) {
      await this.updateTaskTags(id, updates.tags, updates.projectId);
    }

    return data[0];
  },

  async delete(id) {
    const user = await getCurrentUser();
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
  },

  async updateTaskTags(taskId, tagNames, projectId) {
    const user = await getCurrentUser();
    // First, get or create tag IDs for this project
    const tagIds = await Promise.all(
      tagNames.map(async (tagName) => {
        const { data: existingTag } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tagName)
          .eq("project_id", projectId)
          .eq("user_id", user.id)
          .single();

        if (existingTag) {
          return existingTag.id;
        } else {
          const { data: newTag } = await supabase
            .from("tags")
            .insert([
              { name: tagName, project_id: projectId, user_id: user.id },
            ])
            .select("id")
            .single();
          return newTag.id;
        }
      })
    );

    // Delete existing task_tags
    await supabase.from("task_tags").delete().eq("task_id", taskId);

    // Insert new task_tags
    if (tagIds.length > 0) {
      const taskTags = tagIds.map((tagId) => ({
        task_id: taskId,
        tag_id: tagId,
      }));

      await supabase.from("task_tags").insert(taskTags);
    }
  },

  async moveToProject(taskId, projectId) {
    const user = await getCurrentUser();
    const { error } = await supabase
      .from("tasks")
      .update({ project_id: projectId })
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (error) throw error;
  },
};

// Tag functions (now project-specific)
export const tagService = {
  async getByProject(projectId) {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .order("name");

    if (error) throw error;
    return data;
  },

  async create(name, projectId) {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("tags")
      .insert([{ name, project_id: projectId, user_id: user.id }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async update(id, updates) {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("tags")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select();

    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const user = await getCurrentUser();
    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
  },
};

// Real-time subscriptions
export const subscribeToProjects = (callback) => {
  return supabase
    .channel("projects")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "projects" },
      callback
    )
    .subscribe();
};

export const subscribeToTasks = (callback) => {
  return supabase
    .channel("tasks")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tasks" },
      callback
    )
    .subscribe();
};

export const subscribeToTags = (callback) => {
  return supabase
    .channel("tags")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tags" },
      callback
    )
    .subscribe();
};
