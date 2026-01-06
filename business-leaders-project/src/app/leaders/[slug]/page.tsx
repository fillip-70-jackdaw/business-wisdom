import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { LeaderNuggets } from "./LeaderNuggets";
import type { Leader } from "@/lib/supabase/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("leaders")
    .select("name, title")
    .eq("slug", slug)
    .single();

  const leader = data as { name: string; title: string } | null;

  if (!leader) {
    return { title: "Leader Not Found" };
  }

  return {
    title: `${leader.name} - Business Leaders Wisdom`,
    description: `Wisdom and insights from ${leader.name}, ${leader.title}`,
  };
}

export default async function LeaderPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leaders")
    .select("*")
    .eq("slug", slug)
    .single();

  const leader = data as Leader | null;

  if (error || !leader) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Back Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Feed
          </Link>
        </div>
      </div>

      <main className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Leader Header */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden mb-8">
            <div className="relative h-64 sm:h-80 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
              <Image
                src={leader.photo_url}
                alt={leader.name}
                fill
                className="object-cover object-top"
                sizes="(max-width: 640px) 100vw, 896px"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg mb-2">
                  {leader.name}
                </h1>
                <p className="text-white/90 text-lg sm:text-xl drop-shadow">
                  {leader.title}
                </p>
              </div>
            </div>
            {leader.photo_credit && (
              <p className="px-6 py-3 text-xs text-slate-500 dark:text-slate-400">
                Photo: {leader.photo_credit}
              </p>
            )}
          </div>

          {/* Nuggets Section */}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Wisdom & Insights
          </h2>
          <LeaderNuggets leaderId={leader.id} />
        </div>
      </main>
    </div>
  );
}
