import { Metadata } from "next";
import { ArticlesContent } from "./ArticlesContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Articles - Business Wisdom",
  description: "Your personal reading list of saved articles",
};

export default function ArticlesPage() {
  return <ArticlesContent />;
}
