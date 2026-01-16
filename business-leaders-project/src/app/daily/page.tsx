import { Metadata } from "next";
import { DailyContent } from "./DailyContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Daily Wisdom - Business Leaders",
  description:
    "Start your day with timeless business wisdom. A daily ritual for growth.",
};

export default function DailyPage() {
  return <DailyContent />;
}
