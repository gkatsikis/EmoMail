// ponytail: one-off correction for the 2026-09-02 "dubbed"/nagare mixup — delete after use.
// The Resend key is send-only (can't fetch the sent email), so we regenerate the
// content with the emotion pinned to "nagare" and resend with a Correction subject.
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

interface EmotionContent {
  emotion: string;
  pronunciation: string;
  wordType: string;
  description: string;
  etymology: string;
  culturalContext: string;
  literaryExample: { work: string; author: string; excerpt: string; analysis: string };
}

const prompt = `Generate an "emotion of the day" entry for a daily newsletter focused on emotional intelligence and literary appreciation.

The emotion for today is fixed: "nagare" (流れ), the Japanese concept of flow.

Return ONLY valid JSON with exactly this structure, no other text:
{
  "emotion": "nagare",
  "pronunciation": "phonetic pronunciation guide using simple English syllables. Capitalize the stressed syllable.",
  "wordType": "the grammatical category of the word",
  "description": "2-3 sentences describing what this emotion feels like, when it arises, and why it's worth noticing",
  "etymology": "1-2 sentences on the linguistic origin of the word",
  "culturalContext": "1-2 sentences on the culture or tradition this emotion is most associated with",
  "literaryExample": {
    "work": "title of the poem, novel, play, or story",
    "author": "author's full name",
    "excerpt": "an accurate, real quote or passage (1-4 lines) from the work that evokes this emotion",
    "analysis": "2-3 sentences on how the author channels this emotion and what a reader can learn from it"
  }
}`;

// copied from src/index.ts (importing it would run main())
function buildEmailHtml(content: EmotionContent, date: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EmoMail — ${content.emotion}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f13;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f13;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;border-bottom:1px solid #2a2a35;">
              <p style="margin:0;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#7b6f8e;font-family:'Helvetica Neue',sans-serif;">EmoMail</p>
              <p style="margin:8px 0 0;font-size:12px;color:#4a4a5a;font-family:'Helvetica Neue',sans-serif;">${date}</p>
            </td>
          </tr>

          <!-- Correction note -->
          <tr>
            <td style="padding-top:24px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#9b8aaa;font-family:'Helvetica Neue',sans-serif;">A correction: this morning's letter mislabeled the emotion as &ldquo;dubbed.&rdquo; The word we meant to share is <em>nagare</em>. Here it is, properly named.</p>
            </td>
          </tr>

          <!-- Emotion of the Day -->
          <tr>
            <td style="padding-top:40px;padding-bottom:8px;">
              <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7b6f8e;font-family:'Helvetica Neue',sans-serif;">emotion of the day</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <h1 style="margin:0;font-size:48px;color:#e8e0f0;font-weight:normal;font-style:italic;line-height:1.1;">${content.emotion}</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#7b6f8e;font-family:'Helvetica Neue',sans-serif;font-style:italic;letter-spacing:0.5px;">[ ${content.pronunciation} ]</p>
              <p style="margin:8px 0 0;font-size:12px;color:#4a4a5a;font-family:'Helvetica Neue',sans-serif;letter-spacing:1px;text-transform:uppercase;">${content.wordType}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:40px;border-bottom:1px solid #2a2a35;">
              <p style="margin:0;font-size:16px;line-height:1.8;color:#b8aec8;">${content.description}</p>
            </td>
          </tr>

          <!-- Etymology & Cultural Context -->
          <tr>
            <td style="padding-top:40px;padding-bottom:16px;">
              <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7b6f8e;font-family:'Helvetica Neue',sans-serif;">origin &amp; culture</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:40px;border-bottom:1px solid #2a2a35;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#b8aec8;">${content.etymology}</p>
              <p style="margin:0;font-size:15px;line-height:1.75;color:#b8aec8;">${content.culturalContext}</p>
            </td>
          </tr>

          <!-- Literary Example -->
          <tr>
            <td style="padding-top:40px;padding-bottom:16px;">
              <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7b6f8e;font-family:'Helvetica Neue',sans-serif;">found in literature</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:20px;">
              <p style="margin:0;font-size:15px;color:#e8e0f0;font-family:'Helvetica Neue',sans-serif;font-weight:500;">${content.literaryExample.work}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#7b6f8e;font-family:'Helvetica Neue',sans-serif;">by ${content.literaryExample.author}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;background-color:#1a1a24;border-left:3px solid #7b6f8e;">
              <p style="margin:0;font-size:17px;line-height:1.85;color:#d4c8e8;font-style:italic;">${content.literaryExample.excerpt}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;padding-bottom:40px;border-bottom:1px solid #2a2a35;">
              <p style="margin:0;font-size:15px;line-height:1.75;color:#b8aec8;">${content.literaryExample.analysis}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;padding-bottom:40px;text-align:center;">
              <p style="margin:0 0 10px;font-size:12px;color:#4a4a5a;font-family:'Helvetica Neue',sans-serif;">EmoMail — a daily letter for emotional vocabulary</p>
              <p style="margin:0;font-size:12px;color:#4a4a5a;font-family:'Helvetica Neue',sans-serif;">Want to process what you're feeling? Try <a href="https://www.mindful-companion.com" style="color:#9b8aaa;text-decoration:none;">Mindful Companion</a> — an AI journaling app that offers validation and support.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function main() {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const recipients = (process.env.RECIPIENT_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  if (recipients.length === 0) throw new Error('RECIPIENT_EMAIL required');
  const from = process.env.FROM_EMAIL ?? 'EmoMail <onboarding@resend.dev>';

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  const raw = message.content[0].type === 'text' ? message.content[0].text : '';
  console.log('RAW MODEL OUTPUT:\n', raw);
  const content = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)) as EmotionContent;
  if (content.emotion !== 'nagare') throw new Error(`Expected nagare, got "${content.emotion}"`);

  const html = buildEmailHtml(content, 'Tuesday, September 2, 2026');
  const subject = 'Correction — EmoMail: nagare, not "dubbed" — Sep 2';

  for (const to of recipients) {
    const { data, error } = await resend.emails.send({ from, to, subject, html });
    console.log(error ? `FAILED ${to}: ${JSON.stringify(error)}` : `Sent to ${to} — ID: ${data?.id}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
