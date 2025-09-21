import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Edit2, Plus, X, GripVertical, Settings } from "lucide-react";
import { localProjectService, localTagService } from "@/lib/localStorage";
import { projectService, tagService } from "@/lib/supabase";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const ItemTypes = {
  PROJECT: "project",
};

const DraggableProjectItem = ({
  project,
  index,
  onEdit,
  onDelete,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  editValue,
  onEditChange,
  moveProject,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PROJECT,
    item: () => {
      console.log("=== DRAG STARTED ===");
      console.log(
        "Started dragging project:",
        project.name,
        "at index:",
        index
      );
      return { index, id: project.id, name: project.name };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      console.log("=== DRAG END ===");
      console.log("Finished dragging project:", project.name);
    },
  });

  const [, drop] = useDrop({
    accept: ItemTypes.PROJECT,
    hover: (draggedItem, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;

      console.log("=== DROP HOVER ===");
      console.log(
        "Dragged item index:",
        draggedItem.index,
        "Current index:",
        index
      );

      if (draggedItem.index !== index) {
        console.log("Moving project from", draggedItem.index, "to", index);
        moveProject(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => {
        if (node) {
          drag(node);
          drop(node);
        }
      }}
      className={`flex items-center bg-blue-50 p-3 rounded-lg mb-2 group hover:bg-blue-100 transition-colors select-none ${
        isDragging ? "opacity-50 cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      draggable={false}
    >
      <div className="flex items-center mr-3 pointer-events-none">
        <GripVertical className="h-4 w-4 text-blue-400" />
      </div>
      <div className="flex-grow">
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              className="flex-grow"
              onKeyPress={(e) => e.key === "Enter" && onSave()}
            />
            <Button onClick={onSave} size="sm">
              Save
            </Button>
            <Button onClick={onCancelEdit} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        ) : (
          <h3 className="text-lg font-semibold text-blue-800">
            {project.name}
          </h3>
        )}
      </div>
      {!isEditing && !project.is_special && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={onStartEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

const ProjectItem = ({
  project,
  onEdit,
  onDelete,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  editValue,
  onEditChange,
}) => (
  <div className="flex items-center bg-blue-50 p-3 rounded-lg mb-2 group hover:bg-blue-100 transition-colors">
    {!project.is_special && (
      <div className="flex items-center cursor-grab mr-3">
        <GripVertical className="h-4 w-4 text-blue-400" />
      </div>
    )}
    <div className="flex-grow">
      {isEditing ? (
        <div className="flex gap-2">
          <Input
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            className="flex-grow"
            onKeyPress={(e) => e.key === "Enter" && onSave()}
          />
          <Button onClick={onSave} size="sm">
            Save
          </Button>
          <Button onClick={onCancelEdit} variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      ) : (
        <h3 className="text-lg font-semibold text-blue-800">{project.name}</h3>
      )}
    </div>
    {!isEditing && !project.is_special && (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={onStartEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )}
  </div>
);

const Management = ({
  projects,
  onProjectsUpdate,
  tags,
  onTagsUpdate,
  isAnonymous,
  show = false,
  onClose,
}) => {
  const [newProjectName, setNewProjectName] = useState("");
  const [editingProject, setEditingProject] = useState(null);
  const [editingProjectValue, setEditingProjectValue] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [selectedProjectForTag, setSelectedProjectForTag] = useState("");
  const [projectTags, setProjectTags] = useState({});
  const [reorderedProjects, setReorderedProjects] = useState(projects);
  const saveTimeoutRef = React.useRef(null);

  // Update reorderedProjects when projects prop changes
  React.useEffect(() => {
    setReorderedProjects(projects);
  }, [projects]);

  // Choose the appropriate service based on authentication mode
  const currentProjectService = isAnonymous
    ? localProjectService
    : projectService;
  const currentTagService = isAnonymous ? localTagService : tagService;

  const moveProject = useCallback(
    (fromIndex, toIndex) => {
      console.log("=== MOVE PROJECT DEBUG ===");
      console.log("Moving project from index", fromIndex, "to index", toIndex);
      console.log("Current reorderedProjects:", reorderedProjects?.length || 0);

      if (!reorderedProjects || reorderedProjects.length === 0) {
        console.log("No projects to reorder");
        return;
      }

      const regularProjects = reorderedProjects.filter((p) => !p.is_special);
      const specialProjects = reorderedProjects.filter((p) => p.is_special);

      console.log(
        "Regular projects before move:",
        regularProjects.map((p) => p.name)
      );

      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= regularProjects.length ||
        toIndex >= regularProjects.length
      ) {
        console.log(
          "Invalid indices, skipping move. FromIndex:",
          fromIndex,
          "ToIndex:",
          toIndex,
          "Length:",
          regularProjects.length
        );
        return;
      }

      if (fromIndex === toIndex) {
        console.log("Same index, no move needed");
        return;
      }

      const draggedProject = regularProjects[fromIndex];
      console.log("Dragged project:", draggedProject?.name);

      const newRegularProjects = [...regularProjects];
      newRegularProjects.splice(fromIndex, 1);
      newRegularProjects.splice(toIndex, 0, draggedProject);

      console.log(
        "Regular projects after move:",
        newRegularProjects.map((p) => p.name)
      );

      // Update the order_index immediately for UI consistency
      const projectsWithOrder = newRegularProjects.map((project, index) => ({
        ...project,
        order_index: index + 2, // Start from 2, since special projects are 0 and 1
      }));

      // Ensure special projects maintain their order indices
      const specialProjectsWithOrder = specialProjects.map((project) => ({
        ...project,
        order_index: project.order_index ?? (project.name === "Today" ? 0 : 1),
      }));

      const newProjectsOrder = [
        ...specialProjectsWithOrder,
        ...projectsWithOrder,
      ];
      setReorderedProjects(newProjectsOrder);

      // Clear existing timeout and set a new one for debounced saving
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          console.log(
            "Saving project order:",
            newProjectsOrder.map((p) => ({
              name: p.name,
              order_index: p.order_index,
            }))
          );

          if (isAnonymous) {
            await currentProjectService.reorder(newProjectsOrder);
          } else {
            await currentProjectService.reorder(newProjectsOrder);
          }

          // Update the parent component
          onProjectsUpdate();
          console.log("Project order saved automatically");
        } catch (error) {
          console.error("Error saving project order:", error);
        }
      }, 200); // Debounce for 200ms

      console.log("=== END MOVE PROJECT DEBUG ===");
    },
    [reorderedProjects, isAnonymous, currentProjectService, onProjectsUpdate]
  );

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Load tags for all projects when component opens
  const loadAllProjectTags = async () => {
    const tagsByProject = {};
    for (const project of projects) {
      if (!project.is_special) {
        try {
          if (isAnonymous) {
            const { data, error } = await currentTagService.getByProject(
              project.id
            );
            if (!error) {
              tagsByProject[project.id] = data || [];
            }
          } else {
            const data = await currentTagService.getByProject(project.id);
            tagsByProject[project.id] = data || [];
          }
        } catch (err) {
          console.error(`Error loading tags for project ${project.id}:`, err);
          tagsByProject[project.id] = [];
        }
      }
    }
    setProjectTags(tagsByProject);
  };

  // Load project tags when opening modal or projects change
  React.useEffect(() => {
    if (show && projects.length > 0) {
      loadAllProjectTags();
    }
  }, [show, projects, isAnonymous]);

  const handleAddProject = async () => {
    if (newProjectName.trim()) {
      try {
        console.log("Adding project:", newProjectName.trim());
        if (isAnonymous) {
          const { data, error } = await currentProjectService.create({
            name: newProjectName.trim(),
          });
          console.log("Project creation result:", { data, error });
          if (error) throw error;
        } else {
          await currentProjectService.create({
            name: newProjectName.trim(),
          });
        }

        setNewProjectName("");
        await onProjectsUpdate();
      } catch (err) {
        console.error("Error adding project:", err);
      }
    }
  };

  const handleUpdateProject = async (projectId, newName) => {
    try {
      console.log("Updating project:", projectId, newName);
      if (isAnonymous) {
        const { data, error } = await currentProjectService.update(projectId, {
          name: newName,
        });
        console.log("Project update result:", { data, error });
        if (error) throw error;
      } else {
        await currentProjectService.update(projectId, {
          name: newName,
        });
      }

      setEditingProject(null);
      setEditingProjectValue("");
      await onProjectsUpdate();
    } catch (err) {
      console.error("Error updating project:", err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      console.log("Deleting project:", projectId);
      if (isAnonymous) {
        const { error } = await currentProjectService.delete(projectId);
        console.log("Project deletion result:", { error });
        if (error) throw error;
      } else {
        await currentProjectService.delete(projectId);
      }

      await onProjectsUpdate();
      // Refresh project tags
      await loadAllProjectTags();
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  const handleAddTag = async () => {
    if (newTagName.trim() && selectedProjectForTag) {
      try {
        console.log(
          "Adding tag:",
          newTagName.trim(),
          "to project:",
          selectedProjectForTag
        );
        if (isAnonymous) {
          const { data, error } = await currentTagService.create({
            name: newTagName.trim(),
            project_id: selectedProjectForTag,
          });
          console.log("Tag creation result:", { data, error });
          if (error) throw error;
        } else {
          await currentTagService.create(
            newTagName.trim(),
            selectedProjectForTag
          );
        }

        setNewTagName("");
        await loadAllProjectTags(); // Refresh project tags
      } catch (err) {
        console.error("Error adding tag:", err);
      }
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      console.log("Deleting tag:", tagId);
      if (isAnonymous) {
        const { error } = await currentTagService.delete(tagId);
        console.log("Tag deletion result:", { error });
        if (error) throw error;
      } else {
        await currentTagService.delete(tagId);
      }

      await loadAllProjectTags(); // Refresh project tags
    } catch (err) {
      console.error("Error deleting tag:", err);
    }
  };

  const sortedProjects = [...reorderedProjects].sort((a, b) => {
    if (a.is_special && !b.is_special) return -1;
    if (!a.is_special && b.is_special) return 1;
    return (a.order_index || 0) - (b.order_index || 0);
  });

  const regularProjects = sortedProjects.filter(
    (project) => !project.is_special
  );
  const specialProjects = sortedProjects.filter(
    (project) => project.is_special
  );

  return (
    <DndProvider backend={HTML5Backend}>
      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Management</h2>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Project Management */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-blue-800">
                  Projects
                </h3>
              </div>
              <div className="space-y-2 mb-4">
                {/* Special projects first (non-draggable) */}
                {specialProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    isEditing={editingProject === project.id}
                    onStartEdit={() => {
                      setEditingProject(project.id);
                      setEditingProjectValue(project.name);
                    }}
                    onCancelEdit={() => {
                      setEditingProject(null);
                      setEditingProjectValue("");
                    }}
                    onSave={() =>
                      handleUpdateProject(project.id, editingProjectValue)
                    }
                    onDelete={() =>
                      !project.is_special && handleDeleteProject(project.id)
                    }
                    editValue={editingProjectValue}
                    onEditChange={setEditingProjectValue}
                  />
                ))}

                {/* Regular projects (draggable) */}
                {regularProjects.map((project, index) => (
                  <DraggableProjectItem
                    key={project.id}
                    project={project}
                    index={index}
                    moveProject={moveProject}
                    isEditing={editingProject === project.id}
                    onStartEdit={() => {
                      setEditingProject(project.id);
                      setEditingProjectValue(project.name);
                    }}
                    onCancelEdit={() => {
                      setEditingProject(null);
                      setEditingProjectValue("");
                    }}
                    onSave={() =>
                      handleUpdateProject(project.id, editingProjectValue)
                    }
                    onDelete={() =>
                      !project.is_special && handleDeleteProject(project.id)
                    }
                    editValue={editingProjectValue}
                    onEditChange={setEditingProjectValue}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="New project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-grow"
                  onKeyPress={(e) => e.key === "Enter" && handleAddProject()}
                />
                <Button onClick={handleAddProject} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tag Management */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-800">
                Tags
              </h3>

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
                {regularProjects.map((project) => {
                  const tags = projectTags[project.id] || [];
                  return (
                    <div key={project.id} className="border rounded-lg p-3">
                      <h4 className="font-medium text-gray-800 mb-2">
                        {project.name} Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {tags.length > 0 ? (
                          tags.map((tag) => (
                            <div
                              key={tag.id}
                              className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                            >
                              <span>{tag.name}</span>
                              <Button
                                onClick={() => handleDeleteTag(tag.id)}
                                variant="ghost"
                                size="sm"
                                className="ml-1 h-4 w-4 p-0 text-green-600 hover:text-green-800"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-sm">
                            No tags for this project
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {regularProjects.length === 0 && (
                  <span className="text-gray-400 italic text-sm">
                    Create a project first to add tags
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DndProvider>
  );
};

export default Management;
