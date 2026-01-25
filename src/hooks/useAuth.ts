import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";
import { fetchProfile, upsertProfile } from "@/services/supabase/profiles";
import { signUpSchema, signInSchema, validateInput } from "@/lib/validations";
import { captureException, setUser, addBreadcrumb } from "@/lib/errorTracking";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      setInitializing(false);
      return;
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        captureException(error, { tags: { action: "getSession" } });
      }
      setSession(data.session);
      setInitializing(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        addBreadcrumb(`Auth state changed: ${event}`, "auth");
        setSession(nextSession);

        // Update error tracking user
        if (nextSession?.user) {
          setUser({
            id: nextSession.user.id,
            email: nextSession.user.email,
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sync profile when session changes
  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }

    const syncProfile = async () => {
      try {
        await upsertProfile(session.user);
        const data = await fetchProfile(session.user.id);
        if (data) {
          setProfile(data);
          setUser({
            id: data.id,
            name: data.full_name ?? undefined,
            email: session.user.email,
          });
        }
      } catch (error) {
        captureException(error, {
          tags: { action: "syncProfile" },
          extra: { userId: session.user.id },
        });
      }
    };

    void syncProfile();
  }, [session?.user?.id, session?.user]);

  const signUp = useCallback(
    async (fullName: string, email: string, password: string) => {
      if (!supabase) {
        setAuthError("Supabase is not configured.");
        return { success: false };
      }

      // Validate input
      const validation = validateInput(signUpSchema, { fullName, email, password });
      if (!validation.success) {
        setAuthError(validation.error);
        return { success: false };
      }

      setAuthLoading(true);
      setAuthError(null);
      setAuthStatus(null);
      addBreadcrumb("Sign up attempt", "auth", { email });

      try {
        const { data, error } = await supabase.auth.signUp({
          email: validation.data.email,
          password: validation.data.password,
          options: { data: { full_name: validation.data.fullName } },
        });

        if (error) {
          captureException(error, {
            tags: { action: "signUp" },
            extra: { email },
          });
          setAuthError(error.message);
          return { success: false };
        }

        if (data.session?.user) {
          await upsertProfile(data.session.user, validation.data.fullName);
          const profileData = await fetchProfile(data.session.user.id);
          if (profileData) setProfile(profileData);
        }

        setAuthStatus("Check your email to confirm your account.");
        return { success: true };
      } catch (error) {
        captureException(error, { tags: { action: "signUp" } });
        setAuthError("An unexpected error occurred. Please try again.");
        return { success: false };
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        setAuthError("Supabase is not configured.");
        return { success: false };
      }

      // Validate input
      const validation = validateInput(signInSchema, { email, password });
      if (!validation.success) {
        setAuthError(validation.error);
        return { success: false };
      }

      setAuthLoading(true);
      setAuthError(null);
      setAuthStatus(null);
      addBreadcrumb("Sign in attempt", "auth", { email });

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password,
        });

        if (error) {
          // Don't capture invalid credentials as errors (expected behavior)
          if (error.message !== "Invalid login credentials") {
            captureException(error, {
              tags: { action: "signInWithPassword" },
              extra: { email },
            });
          }
          setAuthError(error.message);
          return { success: false };
        }

        if (data.session?.user) {
          await upsertProfile(data.session.user);
          const profileData = await fetchProfile(data.session.user.id);
          if (profileData) setProfile(profileData);
        }

        return { success: true };
      } catch (error) {
        captureException(error, { tags: { action: "signInWithPassword" } });
        setAuthError("An unexpected error occurred. Please try again.");
        return { success: false };
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async (redirectTo: string) => {
    if (!supabase) {
      setAuthError("Supabase is not configured.");
      return { success: false };
    }

    setAuthError(null);
    addBreadcrumb("Google sign in attempt", "auth");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        captureException(error, { tags: { action: "signInWithGoogle" } });
        setAuthError(error.message);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      captureException(error, { tags: { action: "signInWithGoogle" } });
      setAuthError("Failed to initiate Google sign in.");
      return { success: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;

    addBreadcrumb("Sign out", "auth");

    try {
      await supabase.auth.signOut();
      setProfile(null);
      setUser(null);
    } catch (error) {
      captureException(error, { tags: { action: "signOut" } });
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) {
      return { success: false, error: "Supabase is not configured." };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        captureException(error, { tags: { action: "resetPassword" } });
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      captureException(error, { tags: { action: "resetPassword" } });
      return { success: false, error: "An unexpected error occurred." };
    }
  }, []);

  return {
    session,
    profile,
    authLoading,
    authError,
    authStatus,
    initializing,
    setAuthError,
    setAuthStatus,
    signUp,
    signInWithPassword,
    signInWithGoogle,
    signOut,
    resetPassword,
  };
}
