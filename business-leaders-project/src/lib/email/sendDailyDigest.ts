import { Resend } from "resend";
import {
  generateDailyDigestHtml,
  generateDailyDigestText,
  DailyDigestData,
} from "./dailyDigestTemplate";

// Lazy-initialize Resend client to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendDailyDigest(
  email: string,
  data: DailyDigestData
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getResendClient();
    const { error } = await client.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL || "Business Wisdom <daily@resend.dev>",
      to: email,
      subject: `Daily Wisdom: ${data.nugget.leader.name}`,
      html: generateDailyDigestHtml(data),
      text: generateDailyDigestText(data),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send daily digest:", error);
    return { success: false, error: String(error) };
  }
}
