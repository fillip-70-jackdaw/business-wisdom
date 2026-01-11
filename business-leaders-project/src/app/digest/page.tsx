import { Metadata } from "next";
import { DigestContent } from "./DigestContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Daily Digest - Business Wisdom",
  description: "Your personalized daily wisdom digest",
};

export default function DigestPage() {
  return <DigestContent />;
}
