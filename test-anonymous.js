// Simple test for localStorage functionality
// This can be run in the browser console to test the anonymous mode

// Test localStorage service
import {
  localProjectService,
  localTaskService,
  localTagService,
  localAuthService,
} from "/src/lib/localStorage.js";

async function testAnonymousMode() {
  console.log("Testing Anonymous Mode...");

  // 1. Test anonymous user creation
  const user = localAuthService.setAnonymousUser();
  console.log("Created anonymous user:", user);

  // 2. Test project creation
  const projects = await localProjectService.getAll();
  console.log("Default projects:", projects.data);

  // 3. Test custom project creation
  const newProject = await localProjectService.create({
    name: "Test Project",
  });
  console.log("Created project:", newProject.data);

  // 4. Test task creation
  const newTask = await localTaskService.create({
    text: "Test task",
    priority: "HIGH",
    project_id: newProject.data.id,
    tags: ["test"],
  });
  console.log("Created task:", newTask.data);

  // 5. Test task retrieval
  const tasks = await localTaskService.getByProject(newProject.data.id);
  console.log("Project tasks:", tasks.data);

  // 6. Test tag creation
  const newTag = await localTagService.create({
    name: "Test Tag",
  });
  console.log("Created tag:", newTag.data);

  // 7. Test data persistence
  console.log("localStorage contents:");
  console.log(
    "Projects:",
    JSON.parse(localStorage.getItem("todo_projects") || "[]")
  );
  console.log("Tasks:", JSON.parse(localStorage.getItem("todo_tasks") || "[]"));
  console.log("Tags:", JSON.parse(localStorage.getItem("todo_tags") || "[]"));
  console.log(
    "User:",
    JSON.parse(localStorage.getItem("todo_anonymous_user") || "null")
  );

  console.log("✅ Anonymous mode test completed successfully!");
}

// Export for console testing
window.testAnonymousMode = testAnonymousMode;
