import { Metadata } from "next";
import { SavePageContent } from "./SavePageContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Save Article - Business Wisdom",
  description: "Save an article to your reading list",
};

export default function SavePage() {
  return <SavePageContent />;
}
