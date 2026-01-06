import { Metadata } from "next";
import { ReviewContent } from "./ReviewContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Review - Business Leaders Wisdom",
  description: "Review and publish nuggets of wisdom",
};

export default function ReviewPage() {
  return <ReviewContent />;
}
