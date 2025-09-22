import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { useTagManagement } from "@/hooks/useManagement";

export function TagManagement({ projects, isAnonymous }) {
  const [newTagName, setNewTagName] = useState("");
  const [selectedProjectForTag, setSelectedProjectForTag] = useState("");

  const { projectTags, loadProjectTags, createTag, deleteTag } =
    useTagManagement(isAnonymous);

  // Load project tags when projects change or component mounts
  useEffect(() => {
    if (projects.length > 0) {
      loadProjectTags(projects);
    }
  }, [projects, loadProjectTags]);

  const handleAddTag = async () => {
    if (!newTagName.trim() || !selectedProjectForTag) return;

    try {
      await createTag(newTagName, selectedProjectForTag);
      setNewTagName("");
      // Reload tags for the affected project
      await loadProjectTags(projects);
    } catch (error) {
      console.error("Failed to add tag:", error);
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await deleteTag(tagId);
      // Reload all project tags
      await loadProjectTags(projects);
    } catch (error) {
      console.error("Failed to delete tag:", error);
    }
  };

  const regularProjects = projects.filter((project) => !project.is_special);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-green-800">Tags</h3>

      {/* Add Tag Section */}
      <div className="mb-4 p-3 bg-green-50 rounded-lg">
        <h4 className="font-medium mb-2">Add Tag to Project</h4>
        <div className="flex gap-2 mb-2">
          <Select
            value={selectedProjectForTag}
            onValueChange={setSelectedProjectForTag}
          >
            <SelectTrigger className="flex-grow">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {regularProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="flex-grow"
            onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
            disabled={!selectedProjectForTag}
          />
          <Button
            onClick={handleAddTag}
            size="sm"
            disabled={!newTagName.trim() || !selectedProjectForTag}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Project Tags Display */}
      <div className="space-y-4">
        {regularProjects.length > 0 ? (
          regularProjects.map((project) => {
            const tags = projectTags[project.id] || [];
            return (
              <ProjectTagsSection
                key={project.id}
                project={project}
                tags={tags}
                onDeleteTag={handleDeleteTag}
              />
            );
          })
        ) : (
          <div className="text-gray-400 italic text-sm text-center py-4">
            Create a project first to add tags
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectTagsSection({ project, tags, onDeleteTag }) {
  return (
    <div className="border rounded-lg p-3">
      <h4 className="font-medium text-gray-800 mb-2">
        {project.name} Tags
        <span className="ml-2 text-sm text-gray-500">({tags.length})</span>
      </h4>
      <div className="flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <TagChip
              key={tag.id}
              tag={tag}
              onDelete={() => onDeleteTag(tag.id)}
            />
          ))
        ) : (
          <span className="text-gray-400 italic text-sm">
            No tags for this project
          </span>
        )}
      </div>
    </div>
  );
}

function TagChip({ tag, onDelete }) {
  return (
    <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
      <span>{tag.name}</span>
      <Button
        onClick={onDelete}
        variant="ghost"
        size="sm"
        className="ml-1 h-4 w-4 p-0 text-green-600 hover:text-green-800"
        title={`Delete tag: ${tag.name}`}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
