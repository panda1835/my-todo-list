import { useState } from "react";
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
import { Plus } from "lucide-react";

export function AddTaskForm({ onAddTask, disabled = false, projectTags = [] }) {
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [newTaskTags, setNewTaskTags] = useState([]);
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!newTaskText.trim()) return;

    try {
      await onAddTask({
        text: newTaskText.trim(),
        description: newTaskDescription.trim() || null,
        priority: newTaskPriority,
        tags: newTaskTags,
        due_date: newTaskDueDate || null,
      });

      // Reset form
      setNewTaskText("");
      setNewTaskDescription("");
      setNewTaskPriority("MEDIUM");
      setNewTaskTags([]);
      setNewTaskDueDate("");
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const toggleTag = (tagName) => {
    setNewTaskTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 mb-4 md:flex-row">
          <Input
            type="text"
            placeholder="Add a new task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            className="flex-grow"
          />
          <div className="flex gap-2 flex-row">
            <Select
              value={newTaskPriority}
              onValueChange={setNewTaskPriority}
              disabled={disabled}
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
              disabled={disabled}
              className="w-full md:w-40"
            />
          </div>
          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={disabled || !newTaskText.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Description field */}
        <div className="mb-4">
          <Textarea
            placeholder="Add a description (optional)..."
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            disabled={disabled}
            className="w-full"
            rows={3}
          />
        </div>
      </form>

      {/* Tags selection */}
      {projectTags.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Tags:
          </label>
          <div className="flex flex-wrap gap-2">
            {projectTags.map((tag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={newTaskTags.includes(tag.name)}
                  onCheckedChange={() => toggleTag(tag.name)}
                  disabled={disabled}
                />
                <label
                  htmlFor={`tag-${tag.id}`}
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
  );
}
