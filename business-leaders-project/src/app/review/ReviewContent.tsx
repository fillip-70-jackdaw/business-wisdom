"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { NuggetWithLeader } from "@/lib/supabase/types";
import Link from "next/link";

// In a real app, you'd check admin status via a custom claim or admin table
// For now, we'll just check if user is logged in
const ADMIN_EMAILS = ["admin@example.com"]; // Add your admin emails here

export function ReviewContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [drafts, setDrafts] = useState<NuggetWithLeader[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Fetch user and check admin status
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsAdmin(user ? ADMIN_EMAILS.includes(user.email || "") : false);
      setIsLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAdmin(session?.user ? ADMIN_EMAILS.includes(session.user.email || "") : false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Fetch draft nuggets (only if admin)
  useEffect(() => {
    const fetchDrafts = async () => {
      if (!isAdmin) return;

      // Note: This requires service role key or adjusted RLS to read drafts
      // For demo purposes, we'll attempt the query
      const { data, error } = await supabase
        .from("nuggets")
        .select(`
          *,
          leader:leaders(*)
        `)
        .eq("status", "draft")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Cast the data to the expected shape
        const typedData = data as unknown as Array<NuggetWithLeader & { leader: NuggetWithLeader["leader"] }>;
        setDrafts(typedData);
      }
    };

    fetchDrafts();
  }, [supabase, isAdmin]);

  // Update nugget status
  const updateStatus = async (nuggetId: string, status: "published" | "rejected") => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("nuggets") as any)
      .update({ status })
      .eq("id", nuggetId);

    if (!error) {
      setDrafts((prev) => prev.filter((n) => n.id !== nuggetId));
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Admin Access Required
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Please sign in with an admin account to access this page.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-700 dark:hover:bg-slate-200 transition inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You don&apos;t have permission to access the review queue.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-700 dark:hover:bg-slate-200 transition inline-block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              ← Back
            </Link>
            <h1 className="font-bold text-slate-900 dark:text-white">
              Admin Review Queue
            </h1>
          </div>
          <button
            onClick={handleSignOut}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {drafts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              All caught up!
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              No nuggets pending review.
            </p>
          </div>
        ) : (
          <>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {drafts.length} nugget{drafts.length !== 1 ? "s" : ""} pending review
            </p>

            <div className="space-y-4">
              {drafts.map((nugget) => (
                <div
                  key={nugget.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {nugget.leader.name} • {nugget.type} • {nugget.confidence}
                      </p>
                      <blockquote className="text-slate-900 dark:text-white text-lg font-serif italic mb-3">
                        &quot;{nugget.text}&quot;
                      </blockquote>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {nugget.topic_tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {nugget.source_title && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Source: {nugget.source_title}
                          {nugget.source_url && (
                            <a
                              href={nugget.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:underline"
                            >
                              View →
                            </a>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(nugget.id, "published")}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                      >
                        Publish
                      </button>
                      <button
                        onClick={() => updateStatus(nugget.id, "rejected")}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
