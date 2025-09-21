"use client";

import { useAuth } from "@/contexts/AuthContext";
import { TodoListComponent } from "@/components/TodoListUnified";
import AuthForm from "@/components/AuthForm";

export function AppContainer() {
  const { user, loading, setAnonymousMode } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAnonymousMode={setAnonymousMode} />;
  }

  return <TodoListComponent />;
}
