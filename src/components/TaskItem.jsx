import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Trash2,
  Edit2,
  Calendar,
  ArrowRight,
  GripVertical,
} from "lucide-react";
import { priorityColors } from "@/lib/todoUtils";

export function TaskItem({
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
  showTagLabel = null,
}) {
  return (
    <li className="flex flex-col sm:flex-row sm:items-center bg-gray-50 p-3 rounded mb-2 group hover:bg-gray-100 transition-colors gap-2 sm:gap-0">
      <div className="flex items-center flex-grow min-w-0">
        <div className="flex items-center cursor-grab mr-2">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <Checkbox
          checked={task.completed}
          onCheckedChange={onToggle}
          className="mr-3"
        />
        {/* Priority badge - show on desktop (sm+) */}
        <span
          className={`hidden sm:inline-block text-xs font-semibold px-2 py-1 rounded-full mr-3 flex-shrink-0 ${
            priorityColors[task.priority]
          }`}
        >
          {task.priority}
        </span>
        <div className="flex-grow min-w-0">
          <span
            className={`block ${
              task.completed ? "line-through text-gray-400" : "text-gray-800"
            }`}
          >
            {task.text}
          </span>
          <div className="flex items-center mt-1 gap-2 flex-wrap">
            {/* Priority badge - show on mobile (below task text) */}
            <span
              className={`sm:hidden text-xs font-semibold px-2 py-1 rounded-full ${
                priorityColors[task.priority]
              }`}
            >
              {task.priority}
            </span>
            {showProjectName && task.projectName && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                📁 {task.projectName}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
        <div className="">
          {showTagLabel && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
              🏷️ {showTagLabel}
            </span>
          )}

          {task.due_date && (
            <span className="text-xs text-gray-500 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-100 transition-opacity">
          {showMoveButtons && (
            <div className="flex items-center gap-1">
              {(projectId === "all" ? task.project_id : projectId) !==
                specialProjectIds.TODAY && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onMoveToToday();
                  }}
                  className="text-xs whitespace-nowrap"
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
                    onMoveToThisWeek();
                  }}
                  className="text-xs whitespace-nowrap"
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Week
                </Button>
              )}
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(task)}
            className="transition-opacity"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(task.id)}
            className="transition-opacity text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}
