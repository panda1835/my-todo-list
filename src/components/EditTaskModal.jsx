import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function EditTaskModal({
  task,
  onUpdate,
  onCancel,
  isOpen,
  projectTags = [],
}) {
  const [editTaskText, setEditTaskText] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState("MEDIUM");
  const [editTaskTags, setEditTaskTags] = useState([]);
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [isFormReady, setIsFormReady] = useState(false);

  // Reset form whenever task changes or modal opens/closes
  useEffect(() => {
    if (task && isOpen) {
      setEditTaskText(task.text || "");
      setEditTaskDescription(task.description || "");
      setEditTaskPriority(task.priority || "MEDIUM");
      setEditTaskTags(task.tags || []);
      setEditTaskDueDate(task.due_date || "");
      // Mark form as ready after setting values
      setTimeout(() => setIsFormReady(true), 0);
    } else if (!isOpen) {
      // Reset form when modal is closed
      setIsFormReady(false);
      setEditTaskText("");
      setEditTaskDescription("");
      setEditTaskPriority("MEDIUM");
      setEditTaskTags([]);
      setEditTaskDueDate("");
    }
  }, [task, isOpen]);

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!editTaskText.trim() || !task) return;

    try {
      await onUpdate(task.id, {
        text: editTaskText.trim(),
        description: editTaskDescription.trim() || null,
        priority: editTaskPriority,
        tags: editTaskTags,
        due_date: editTaskDueDate || null,
      });
      onCancel();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const toggleTag = (tagName) => {
    setEditTaskTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Edit Task</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="text"
              value={editTaskText}
              onChange={(e) => setEditTaskText(e.target.value)}
              placeholder="Task text"
            />
            <Textarea
              value={editTaskDescription}
              onChange={(e) => setEditTaskDescription(e.target.value)}
              placeholder="Task description (optional)"
              rows={3}
            />
            {/* Priority Selection */}
            <div className="space-y-2">
              {isFormReady ? (
                <Select
                  value={editTaskPriority}
                  onValueChange={setEditTaskPriority}
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
              ) : (
                <div className="h-10 bg-gray-100 rounded-md flex items-center px-3 text-gray-500">
                  Loading...
                </div>
              )}
            </div>
            <Input
              type="date"
              value={editTaskDueDate}
              onChange={(e) => setEditTaskDueDate(e.target.value)}
            />

            {/* Tags selection */}
            {projectTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Tags:
                </label>
                <div className="flex flex-wrap gap-2">
                  {projectTags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-tag-${tag.id}`}
                        checked={editTaskTags.includes(tag.name)}
                        onCheckedChange={() => toggleTag(tag.name)}
                      />
                      <label
                        htmlFor={`edit-tag-${tag.id}`}
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        {tag.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-6">
            <Button type="submit" className="flex-1">
              Update
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
