"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { SavedArticle } from "@/lib/supabase/types";
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/AuthModal";
import { SaveArticleModal } from "@/components/SaveArticleModal";

type FilterType = "all" | "unread" | "read";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ArticlesContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<SavedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const supabase = createClient();

  // Fetch user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        setIsLoading(false);
      }
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setArticles([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const filterParam = filter === "all" ? "" : `?filter=${filter}`;
      const response = await fetch(`/api/articles${filterParam}`);
      const data = await response.json();

      if (response.ok) {
        setArticles(data.articles || []);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    if (user) {
      fetchArticles();
    }
  }, [user, fetchArticles]);

  // Save article
  const handleSaveArticle = async (url: string, title?: string) => {
    const response = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, title }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to save article");
    }

    // Add to local state
    setArticles((prev) => [data.article, ...prev]);
  };

  // Toggle read status
  const handleToggleRead = async (article: SavedArticle) => {
    const newIsRead = !article.is_read;

    // Optimistic update
    setArticles((prev) =>
      prev.map((a) =>
        a.id === article.id ? { ...a, is_read: newIsRead } : a
      )
    );

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: newIsRead }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error("Error toggling read status:", error);
      // Revert on error
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id ? { ...a, is_read: !newIsRead } : a
        )
      );
    }
  };

  // Delete article
  const handleDelete = async (articleId: string) => {
    // Optimistic update
    setArticles((prev) => prev.filter((a) => a.id !== articleId));

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      // Refetch on error
      fetchArticles();
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Count unread
  const unreadCount = articles.filter((a) => !a.is_read).length;

  // Filter articles for display
  const displayedArticles =
    filter === "all"
      ? articles
      : articles.filter((a) => (filter === "read" ? a.is_read : !a.is_read));

  return (
    <div className="min-h-screen bg-library">
      <Header
        user={user}
        onSignIn={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
        showFavoritesOnly={false}
        isArticlesPage={true}
        articlesCount={unreadCount}
      />

      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--parchment)] mb-2">
                My Articles
              </h1>
              <p className="text-[var(--text-muted)]">Your reading list</p>
            </div>
            {user && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-4 py-2 bg-[var(--tan)] text-[var(--bg)] rounded-lg text-sm font-medium hover:bg-[var(--brass)] transition flex items-center gap-2"
              >
                <span>+</span>
                <span>Save URL</span>
              </button>
            )}
          </div>

          {/* Not logged in */}
          {!user && !isLoading && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📖</div>
              <h2 className="text-2xl font-bold text-[var(--parchment)] mb-2">
                Sign in to save articles
              </h2>
              <p className="text-[var(--text-muted)] mb-6">
                Create an account to start building your reading list
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-6 py-3 bg-[var(--tan)] text-[var(--bg)] rounded-lg font-medium hover:bg-[var(--brass)] transition"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Loading */}
          {user && isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-[var(--surface-2)] rounded-lg shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-[var(--surface-2)] rounded w-3/4" />
                      <div className="h-4 bg-[var(--surface-2)] rounded w-1/4" />
                      <div className="h-4 bg-[var(--surface-2)] rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state - no articles at all */}
          {user && !isLoading && articles.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-[var(--parchment)] mb-2">
                No articles yet
              </h2>
              <p className="text-[var(--text-muted)] mb-6">
                Save articles to read later
              </p>
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-6 py-3 bg-[var(--tan)] text-[var(--bg)] rounded-lg font-medium hover:bg-[var(--brass)] transition"
              >
                Save Your First Article
              </button>
            </div>
          )}

          {/* Articles list */}
          {user && !isLoading && articles.length > 0 && (
            <>
              {/* Filter tabs */}
              <div className="flex items-center gap-1 mb-6 p-1 bg-[var(--surface)] rounded-lg border border-[var(--border)] w-fit">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filter === "all"
                      ? "bg-[rgba(255,238,214,0.08)] text-[var(--parchment)]"
                      : "text-[var(--text-muted)] hover:text-[var(--tan)]"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                    filter === "unread"
                      ? "bg-[rgba(255,238,214,0.08)] text-[var(--parchment)]"
                      : "text-[var(--text-muted)] hover:text-[var(--tan)]"
                  }`}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "var(--hermes-soft)",
                        color: "var(--hermes)",
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setFilter("read")}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filter === "read"
                      ? "bg-[rgba(255,238,214,0.08)] text-[var(--parchment)]"
                      : "text-[var(--text-muted)] hover:text-[var(--tan)]"
                  }`}
                >
                  Read
                </button>
              </div>

              {/* Results count */}
              <p className="text-[var(--text-muted)] text-sm mb-4">
                {displayedArticles.length} article
                {displayedArticles.length !== 1 ? "s" : ""}
              </p>

              {/* Article cards */}
              <div className="space-y-4">
                {displayedArticles.map((article) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 transition-all hover:bg-[var(--surface-2)] hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <div className="flex gap-4">
                      {/* Image */}
                      {article.image_url && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0">
                          <Image
                            src={article.image_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="80px"
                            unoptimized
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Unread indicator */}
                            {!article.is_read && (
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: "var(--hermes)" }}
                              />
                            )}
                            <h3 className="text-[var(--parchment)] font-medium truncate group-hover:text-[var(--tan)] transition-colors">
                              {article.title || article.url}
                            </h3>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleRead(article);
                              }}
                              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--tan)] transition-colors"
                              title={
                                article.is_read
                                  ? "Mark as unread"
                                  : "Mark as read"
                              }
                            >
                              {article.is_read ? (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(article.id);
                              }}
                              className="p-1.5 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Domain & date */}
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          {article.domain} · Saved {formatDate(article.created_at)}
                        </p>

                        {/* Description */}
                        {article.description && (
                          <p className="text-sm text-[var(--text-muted)] mt-2 line-clamp-2">
                            {article.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              {/* Empty state after filtering */}
              {displayedArticles.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[var(--text-muted)] mb-4">
                    {filter === "read"
                      ? "No read articles yet"
                      : "No unread articles"}
                  </p>
                  <button
                    onClick={() => setFilter("all")}
                    className="text-[var(--tan)] hover:text-[var(--parchment)] text-sm underline"
                  >
                    View all articles
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <SaveArticleModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveArticle}
      />
    </div>
  );
}
