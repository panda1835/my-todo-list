import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ProjectManagement } from "./ProjectManagement";
import { TagManagement } from "./TagManagement";

const Management = ({
  projects,
  onProjectsUpdate,
  tags,
  onTagsUpdate,
  isAnonymous,
  show = false,
  onClose,
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-6 w-[500px] max-w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Management</h2>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Project Management Section */}
        <ProjectManagement
          projects={projects}
          onProjectsUpdate={onProjectsUpdate}
          isAnonymous={isAnonymous}
        />

        {/* Tag Management Section */}
        <TagManagement projects={projects} isAnonymous={isAnonymous} />
      </div>
    </div>
  );
};

export default Management;
