import { Calendar } from "lucide-react";
import { TaskItem } from "./TaskItem";

export function TaskList({
  tasks,
  selectedProject,
  projects,
  onDeleteTask,
  onToggleTask,
  onEditTask,
  onMoveToToday,
  onMoveToThisWeek,
  specialProjectIds,
}) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No tasks yet. Add one above to get started!</p>
        </div>
      </div>
    );
  }

  // If viewing all projects, group tasks by project then by tag
  if (selectedProject.id === "all") {
    const tasksByProject = tasks.reduce((acc, task) => {
      const projectName = task.projectName || "Unknown Project";
      if (!acc[projectName]) {
        acc[projectName] = [];
      }
      acc[projectName].push(task);
      return acc;
    }, {});

    // Sort project names by their order_index from the projects array
    const sortedProjectNames = Object.keys(tasksByProject).sort((a, b) => {
      const projectA = projects.find((p) => p.name === a);
      const projectB = projects.find((p) => p.name === b);

      // Handle special projects first
      if (projectA?.is_special && !projectB?.is_special) return -1;
      if (!projectA?.is_special && projectB?.is_special) return 1;

      // Sort by order_index
      const orderA = projectA?.order_index || 999;
      const orderB = projectB?.order_index || 999;
      return orderA - orderB;
    });

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {sortedProjectNames.map((projectName) => {
            const projectTasks = tasksByProject[projectName];

            // Group tasks within each project by tag
            const tasksByTag = projectTasks.reduce((acc, task) => {
              if (task.tags && task.tags.length > 0) {
                task.tags.forEach((tag) => {
                  if (!acc[tag]) {
                    acc[tag] = [];
                  }
                  acc[tag].push(task);
                });
              } else {
                // Tasks without tags go to "No Tag" group
                if (!acc["No Tag"]) {
                  acc["No Tag"] = [];
                }
                acc["No Tag"].push(task);
              }
              return acc;
            }, {});

            // Sort tag names, putting "No Tag" at the end
            const sortedTagNames = Object.keys(tasksByTag).sort((a, b) => {
              if (a === "No Tag") return 1;
              if (b === "No Tag") return -1;
              return a.localeCompare(b);
            });

            return (
              <div key={projectName} className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                  📁 {projectName} ({projectTasks.length} tasks)
                </h3>
                <div className="space-y-4">
                  {sortedTagNames.map((tagName) => {
                    const tagTasks = tasksByTag[tagName];
                    return (
                      <div key={`${projectName}-${tagName}`}>
                        <ul className="space-y-2">
                          {tagTasks.map((task) => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              onDelete={onDeleteTask}
                              onToggle={() => onToggleTask(task.id)}
                              onEdit={onEditTask}
                              projectId={selectedProject.id}
                              showMoveButtons={true}
                              showProjectName={false}
                              showTagLabel={
                                tagName !== "No Tag" ? tagName : null
                              }
                              onMoveToToday={() => onMoveToToday(task)}
                              onMoveToThisWeek={() => onMoveToThisWeek(task)}
                              specialProjectIds={specialProjectIds}
                            />
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Regular project view - group by tags
  // First, group tasks by their tags
  const tasksByTag = tasks.reduce((acc, task) => {
    if (task.tags && task.tags.length > 0) {
      task.tags.forEach((tag) => {
        if (!acc[tag]) {
          acc[tag] = [];
        }
        acc[tag].push(task);
      });
    } else {
      // Tasks without tags go to "No Tag" group
      if (!acc["No Tag"]) {
        acc["No Tag"] = [];
      }
      acc["No Tag"].push(task);
    }
    return acc;
  }, {});

  // Sort tag names, putting "No Tag" at the end
  const sortedTagNames = Object.keys(tasksByTag).sort((a, b) => {
    if (a === "No Tag") return 1;
    if (b === "No Tag") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        {sortedTagNames.map((tagName) => {
          const tagTasks = tasksByTag[tagName];
          return (
            <div key={tagName} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                🏷️ {tagName} ({tagTasks.length} tasks)
              </h3>
              <ul className="space-y-2">
                {tagTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onDelete={onDeleteTask}
                    onToggle={() => onToggleTask(task.id)}
                    onEdit={onEditTask}
                    projectId={selectedProject.id}
                    showMoveButtons={!selectedProject.is_special}
                    showProjectName={false}
                    onMoveToToday={() => onMoveToToday(task)}
                    onMoveToThisWeek={() => onMoveToThisWeek(task)}
                    specialProjectIds={specialProjectIds}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
