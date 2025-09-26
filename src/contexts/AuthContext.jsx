"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { localAuthService } from "@/lib/localStorage";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Check for anonymous user first
        const anonymousUser = localAuthService.getUser();
        if (anonymousUser && anonymousUser.isAnonymous) {
          setUser(anonymousUser);
          setIsAnonymous(true);
          setLoading(false);
          return;
        }

        // If no anonymous user, check for Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setIsAnonymous(false);
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes (only for Supabase users)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isAnonymous) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isAnonymous]);

  const signOut = async () => {
    try {
      if (isAnonymous) {
        // Only clear user session, keep data for anonymous mode
        localAuthService.clearUser();
        setUser(null);
        setIsAnonymous(false);
      } else {
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const clearAllAnonymousData = () => {
    localAuthService.clearAllData();
    setUser(null);
    setIsAnonymous(false);
  };

  const setAnonymousMode = () => {
    const anonymousUser = localAuthService.setAnonymousUser();
    setUser(anonymousUser);
    setIsAnonymous(true);
    setLoading(false);
  };

  const value = {
    user,
    loading,
    isAnonymous,
    signOut,
    setAnonymousMode,
    clearAllAnonymousData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
