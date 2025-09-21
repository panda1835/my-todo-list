import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  Settings,
  LogOut,
  User,
  UserX,
  Trash2,
  Calendar,
  FolderOpen,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = ({
  projects,
  selectedProject,
  onProjectSelect,
  onProjectsUpdate,
  isAnonymous,
  onManageClick,
}) => {
  const { user, signOut, clearAllAnonymousData } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getUserDisplayName = () => {
    if (isAnonymous) {
      return "Anonymous User";
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  const getCurrentDate = () => {
    const today = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return today.toLocaleDateString("en-US", options);
  };

  // Sort projects the same way as Management component
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.is_special && !b.is_special) return -1;
    if (!a.is_special && b.is_special) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleViewAllProjects = () => {
    // Create a special "all projects" selection
    onProjectSelect({ id: "all", name: "All Projects", is_special: true });
    // Close mobile menu when project is selected
    setIsMobileMenuOpen(false);
  };

  const handleProjectSelect = (project) => {
    onProjectSelect(project);
    // Close mobile menu when project is selected
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border border-gray-200"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-gray-600" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 overflow-y-auto flex flex-col z-40 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 flex-grow">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              Personal To Do List
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              {isAnonymous ? (
                <UserX className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span>{getUserDisplayName()}</span>
            </div>

            {/* Today's date */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <Calendar className="h-3 w-3" />
              <span>{getCurrentDate()}</span>
            </div>

            {isAnonymous && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mb-4">
                Data stored locally on this device
              </div>
            )}

            {/* Manage Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onManageClick}
              className="w-full flex items-center gap-2 mb-2"
            >
              <Settings className="h-4 w-4" />
              Manage
            </Button>
          </div>

          {/* Projects List */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Projects
            </h2>
            <div className="space-y-1">
              {/* View All Projects Option */}
              <button
                onClick={handleViewAllProjects}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedProject?.id === "all"
                    ? "bg-purple-100 text-purple-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  View All Projects
                </div>
              </button>

              {sortedProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedProject?.id === project.id
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {project.name}
                  {project.is_special && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Built-in)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom section with sign out buttons */}
        <div className="p-6 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 mb-2"
          >
            <LogOut className="h-4 w-4" />
            {isAnonymous ? "Exit Anonymous Mode" : "Sign Out"}
          </Button>

          {isAnonymous && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (
                  confirm("This will delete all your local data. Are you sure?")
                ) {
                  clearAllAnonymousData();
                }
              }}
              className="w-full flex items-center gap-2 text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default Navigation;
