"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProjectManagement } from "./ProjectManagement";
import { TagManagement } from "./TagManagement";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { useTags } from "@/hooks/useTags";

export function ManagePage() {
  const router = useRouter();
  const { isAnonymous } = useAuth();
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    loadProjects,
  } = useProjects(isAnonymous);
  const { tags, loadTags } = useTags(isAnonymous);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your projects and tags here
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projects Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <ProjectManagement
              projects={projects}
              onProjectsUpdate={loadProjects}
              isAnonymous={isAnonymous}
            />
          </div>

          {/* Tags Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <TagManagement projects={projects} isAnonymous={isAnonymous} />
          </div>
        </div>
      </div>
    </div>
  );
}
