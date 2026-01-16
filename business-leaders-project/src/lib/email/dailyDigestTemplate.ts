import type { NuggetWithLeader } from "@/lib/supabase/types";

export interface DailyDigestData {
  nugget: NuggetWithLeader;
  streak: {
    current: number;
    longest: number;
  };
  baseUrl: string;
}

export function generateDailyDigestHtml(data: DailyDigestData): string {
  const { nugget, streak, baseUrl } = data;

  const streakDisplay =
    streak.current > 0
      ? `<p style="font-size: 18px; color: #F37022; margin: 0 0 16px 0;">🔥 ${streak.current} day streak</p>`
      : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #3D3028; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #3D3028; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 24px;">
              <h1 style="margin: 0; font-size: 20px; color: #F7E8D0; font-weight: 500;">
                Business Wisdom
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: rgba(247, 232, 208, 0.55);">
                Your Daily Wisdom
              </p>
            </td>
          </tr>

          <!-- Streak -->
          <tr>
            <td>
              ${streakDisplay}
            </td>
          </tr>

          <!-- Daily Nugget Card -->
          <tr>
            <td style="background: rgba(255, 238, 214, 0.04); border: 1px solid rgba(216, 179, 124, 0.22); border-radius: 16px; padding: 24px;">
              <!-- Leader -->
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #D8B37C;">
                ${nugget.leader.name}
              </p>

              <!-- Quote -->
              <p style="margin: 0; font-size: 20px; color: rgba(247, 232, 208, 0.92); line-height: 1.5;">
                "${nugget.text}"
              </p>

              <!-- Topics -->
              <p style="margin: 16px 0 0 0; font-size: 12px; color: rgba(247, 232, 208, 0.55);">
                ${nugget.topic_tags.slice(0, 3).join(" · ")}
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding-top: 24px; text-align: center;">
              <a href="${baseUrl}/daily" style="display: inline-block; padding: 12px 24px; background-color: #D8B37C; color: #3D3028; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">
                Start Your Morning Ritual
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: rgba(247, 232, 208, 0.35);">
                <a href="${baseUrl}/daily?settings=true" style="color: rgba(247, 232, 208, 0.5); text-decoration: underline;">
                  Manage email preferences
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateDailyDigestText(data: DailyDigestData): string {
  const { nugget, streak, baseUrl } = data;

  return `
Business Wisdom - Your Daily Wisdom

${streak.current > 0 ? `🔥 ${streak.current} day streak\n\n` : ""}Today's Wisdom from ${nugget.leader.name}:

"${nugget.text}"

${nugget.topic_tags.slice(0, 3).join(" · ")}

---

Start your morning ritual: ${baseUrl}/daily

Manage email preferences: ${baseUrl}/daily?settings=true
  `.trim();
}
