import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, ChevronUp, ChevronDown } from "lucide-react";

export function ProjectItem({
  project,
  isEditing,
  editValue = "",
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onEditChange,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  showReorderControls = true,
}) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      onSave();
    }
    if (e.key === "Escape") {
      onCancelEdit();
    }
  };

  const isSpecialProject = project.is_special;
  const showActionButtons = !isEditing && !isSpecialProject;

  return (
    <div className="flex items-center bg-blue-50 p-3 rounded-lg mb-2 group hover:bg-blue-100 transition-colors">
      <div className="flex-grow">
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              className="flex-grow"
              onKeyDown={handleKeyPress}
              autoFocus
              placeholder="Project name"
            />
            <Button onClick={onSave} size="sm" disabled={!editValue.trim()}>
              Save
            </Button>
            <Button onClick={onCancelEdit} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        ) : (
          <h3 className="text-lg font-semibold text-blue-800">
            {project.name}
            {isSpecialProject && (
              <span className="ml-2 text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded-full">
                Built-in
              </span>
            )}
          </h3>
        )}
      </div>

      {showActionButtons && (
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {showReorderControls && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                title="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                title="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onStartEdit}
            title="Edit project"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            title="Delete project"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
