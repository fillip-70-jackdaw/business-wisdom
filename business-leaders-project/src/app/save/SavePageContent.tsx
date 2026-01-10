"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/AuthModal";

type SaveStatus = "idle" | "saving" | "success" | "error" | "duplicate";

export function SavePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToSave = searchParams.get("url") || "";
  const titleParam = searchParams.get("title") || "";

  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Check auth on mount
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsCheckingAuth(false);

      if (!user) {
        setShowAuthModal(true);
      }
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowAuthModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Auto-save when user is authenticated and we have a URL
  useEffect(() => {
    if (user && urlToSave && status === "idle") {
      saveArticle();
    }
  }, [user, urlToSave, status]);

  const saveArticle = async () => {
    if (!urlToSave) return;

    setStatus("saving");
    setError(null);

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlToSave,
          title: titleParam || undefined
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        setStatus("duplicate");
      } else if (!response.ok) {
        throw new Error(data.error || "Failed to save");
      } else {
        setStatus("success");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save article");
    }
  };

  const goToArticles = () => {
    router.push("/articles");
  };

  const closeWindow = () => {
    // Try to close the window (works if opened by bookmarklet)
    window.close();
    // If that doesn't work (browser blocks it), redirect
    setTimeout(() => {
      router.push("/articles");
    }, 100);
  };

  // No URL provided
  if (!urlToSave) {
    return (
      <div className="min-h-screen bg-library flex items-center justify-center p-4">
        <div className="bg-[var(--card-surface)] border border-[var(--border)] rounded-2xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-semibold text-[var(--parchment)] mb-2">
            No URL provided
          </h1>
          <p className="text-[var(--text-muted)] text-sm mb-6">
            Use the bookmarklet to save articles from any page.
          </p>
          <button
            onClick={goToArticles}
            className="px-6 py-2 bg-[var(--tan)] text-[var(--bg)] rounded-lg text-sm font-medium hover:bg-[var(--brass)] transition"
          >
            Go to Articles
          </button>
        </div>
      </div>
    );
  }

  // Checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-library flex items-center justify-center p-4">
        <div className="bg-[var(--card-surface)] border border-[var(--border)] rounded-2xl p-8 max-w-md text-center">
          <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--tan)] rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-library flex items-center justify-center p-4">
      <div className="bg-[var(--card-surface)] border border-[var(--border)] rounded-2xl p-8 max-w-md w-full text-center">
        {/* Saving */}
        {status === "saving" && (
          <>
            <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--tan)] rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-[var(--parchment)]">Saving article...</p>
            <p className="mt-2 text-xs text-[var(--text-muted)] truncate px-4">
              {urlToSave}
            </p>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
            <div className="text-4xl mb-4">✓</div>
            <h1 className="text-xl font-semibold text-[var(--parchment)] mb-2">
              Saved!
            </h1>
            <p className="text-[var(--text-muted)] text-sm mb-6 truncate px-4">
              {urlToSave}
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeWindow}
                className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--text-muted)] rounded-lg text-sm font-medium hover:border-[var(--border-hover)] hover:text-[var(--text)] transition"
              >
                Close
              </button>
              <button
                onClick={goToArticles}
                className="flex-1 px-4 py-2 bg-[var(--tan)] text-[var(--bg)] rounded-lg text-sm font-medium hover:bg-[var(--brass)] transition"
              >
                View Articles
              </button>
            </div>
          </>
        )}

        {/* Duplicate */}
        {status === "duplicate" && (
          <>
            <div className="text-4xl mb-4">📌</div>
            <h1 className="text-xl font-semibold text-[var(--parchment)] mb-2">
              Already saved
            </h1>
            <p className="text-[var(--text-muted)] text-sm mb-6 truncate px-4">
              {urlToSave}
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeWindow}
                className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--text-muted)] rounded-lg text-sm font-medium hover:border-[var(--border-hover)] hover:text-[var(--text)] transition"
              >
                Close
              </button>
              <button
                onClick={goToArticles}
                className="flex-1 px-4 py-2 bg-[var(--tan)] text-[var(--bg)] rounded-lg text-sm font-medium hover:bg-[var(--brass)] transition"
              >
                View Articles
              </button>
            </div>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-[var(--parchment)] mb-2">
              Failed to save
            </h1>
            <p className="text-red-400 text-sm mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={closeWindow}
                className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--text-muted)] rounded-lg text-sm font-medium hover:border-[var(--border-hover)] hover:text-[var(--text)] transition"
              >
                Close
              </button>
              <button
                onClick={() => setStatus("idle")}
                className="flex-1 px-4 py-2 bg-[var(--tan)] text-[var(--bg)] rounded-lg text-sm font-medium hover:bg-[var(--brass)] transition"
              >
                Try Again
              </button>
            </div>
          </>
        )}

        {/* Not logged in */}
        {!user && status === "idle" && (
          <>
            <div className="text-4xl mb-4">🔐</div>
            <h1 className="text-xl font-semibold text-[var(--parchment)] mb-2">
              Sign in to save
            </h1>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              You need to be signed in to save articles.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2 bg-[var(--tan)] text-[var(--bg)] rounded-lg text-sm font-medium hover:bg-[var(--brass)] transition"
            >
              Sign In
            </button>
          </>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
