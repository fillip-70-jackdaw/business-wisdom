import { Metadata } from "next";
import { FavoritesContent } from "./FavoritesContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Favorites - Business Leaders Wisdom",
  description: "Your saved nuggets of wisdom from legendary business leaders",
};

export default function FavoritesPage() {
  return <FavoritesContent />;
}
