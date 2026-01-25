"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const handleCallback = async () => {
      if (!supabase) {
        setError("Authentication service is not configured.");
        setStatus("error");
        return;
      }

      // Check for OAuth error parameters
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        console.error("[AuthCallback] OAuth error:", errorParam, errorDescription);
        setError(errorDescription ?? `Authentication failed: ${errorParam}`);
        setStatus("error");
        return;
      }

      // Get the authorization code
      const code = searchParams.get("code");

      if (!code) {
        // No code and no error - check if we have hash fragment (implicit flow)
        // Supabase handles this automatically through onAuthStateChange
        // Just redirect to home
        router.replace("/");
        return;
      }

      try {
        // Exchange the code for a session
        // Supabase's PKCE flow handles state verification internally
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
          console.error("[AuthCallback] Session exchange error:", sessionError.message);
          setError(sessionError.message);
          setStatus("error");
          return;
        }

        if (!data.session) {
          setError("No session was created. Please try again.");
          setStatus("error");
          return;
        }

        // Success - redirect to home
        setStatus("success");
        router.replace("/");
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        setError("An unexpected error occurred during sign in.");
        setStatus("error");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-[var(--card)] rounded-xl p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">!</div>
          <h1 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Sign In Failed
          </h1>
          <p className="text-sm text-[var(--muted)] mb-4">
            {error ?? "An unknown error occurred."}
          </p>
          <button
            onClick={() => router.replace("/")}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-pulse">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="text-sm text-[var(--muted)]">
          {status === "success" ? "Success! Redirecting..." : "Signing you in..."}
        </p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="animate-pulse">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
            <p className="text-sm text-[var(--muted)]">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
