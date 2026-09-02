import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

const HISTORY_FILE = path.resolve('history.json');

interface HistoryEntry {
  emotion: string;
  date: string;
}

function readHistory(): string[] {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  const entries: HistoryEntry[] = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  return entries.map((e) => e.emotion);
}

function appendToHistory(emotion: string): void {
  const existing: HistoryEntry[] = fs.existsSync(HISTORY_FILE)
    ? JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
    : [];
  existing.push({ emotion, date: new Date().toISOString().split('T')[0] });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(existing, null, 2) + '\n');
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

interface EmotionContent {
  emotion: string;
  pronunciation: string;
  wordType: string;
  description: string;
  etymology: string;
  culturalContext: string;
  literaryExample: {
    work: string;
    author: string;
    excerpt: string;
    analysis: string;
  };
}

async function generateEmotionContent(pastEmotions: string[]): Promise<EmotionContent> {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const avoidClause =
    pastEmotions.length > 0
      ? `\n\nThese emotions have already been used — do NOT repeat any of them:\n${pastEmotions.join(', ')}\n`
      : '';

  const prompt = `Today is ${today}. Generate an "emotion of the day" for a daily newsletter focused on emotional intelligence and literary appreciation.

Choose a nuanced, specific emotion — avoid generic emotions like "happy" or "sad" and try to not recommend german words and favor words from central & south america as well as asia. Prefer emotions like "saudade", "hiraeth", "liminal anticipation", "bittersweet nostalgia", "wabi-sabi acceptance", "sublime awe", "productive melancholy", "effusive warmth", "quiet dread", etc. Foreign-language emotion words with no English equivalent are welcome but not required.${avoidClause}

Return ONLY valid JSON with exactly this structure, no other text:
{
  "emotion": "the emotion name",
  "pronunciation": "phonetic pronunciation guide using simple English syllables, e.g. 'sow-DAH-jee' or 'HEER-eyeth'. Capitalize the stressed syllable.",
  "wordType": "the grammatical category of the word, e.g. 'noun', 'adjective', 'verb', 'noun phrase'",
  "description": "2-3 sentences describing what this emotion feels like, when it arises, and why it's worth noticing",
  "etymology": "1-2 sentences on the linguistic origin of the word — what language it comes from, its root words, and how its meaning evolved",
  "culturalContext": "1-2 sentences on the culture or tradition this emotion is most associated with and how it shows up in their daily life or worldview",
  "literaryExample": {
    "work": "title of the poem, novel, play, or story",
    "author": "author's full name",
    "excerpt": "an accurate, real quote or passage (1-4 lines) from the work that evokes this emotion",
    "analysis": "2-3 sentences on how the author channels this emotion and what a reader can learn from it"
  }
}`;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const raw = content.text;
    console.log('Raw model output:\n', raw);
    const text = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
    try {
      return JSON.parse(text) as EmotionContent;
    } catch (err) {
      lastErr = err;
      console.error(`Parse failed (attempt ${attempt}/2). Raw text:\n`, raw);
    }
  }
  throw lastErr;
}

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

          <!-- Emotional Granularity Note -->
          <tr>
            <td style="padding-top:40px;padding-bottom:40px;border-bottom:1px solid #2a2a35;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7b6f8e;font-family:'Helvetica Neue',sans-serif;">why this practice matters</p>
              <p style="margin:0;font-size:13px;line-height:1.75;color:#6a6178;font-family:'Helvetica Neue',sans-serif;">Research by neuroscientist <span style="color:#9b8aaa;">Lisa Feldman Barrett</span> shows that people with higher <em>emotional granularity</em> — the ability to distinguish and label emotions with precision — experience better emotional regulation, lower anxiety, and greater psychological resilience. The simple act of naming what you feel, specifically, changes how your brain processes it.</p>
              <p style="margin:10px 0 0;font-size:11px;color:#4a4a5a;font-family:'Helvetica Neue',sans-serif;">Barrett, L.F. et al. — <em>Knowing what you're feeling and knowing what to do about it.</em> Cognition &amp; Emotion, 2001.</p>
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
  const recipientEmails = (process.env.RECIPIENT_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  const fromEmail = process.env.FROM_EMAIL ?? 'EmoMail <onboarding@resend.dev>';

  if (recipientEmails.length === 0) {
    throw new Error('RECIPIENT_EMAIL environment variable is required');
  }

  const pastEmotions = readHistory();
  console.log(`History: ${pastEmotions.length} emotion(s) used so far.`);

  console.log('Generating emotion content...');
  const content = await generateEmotionContent(pastEmotions);
  console.log(`Today's emotion: ${content.emotion}`);

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const html = buildEmailHtml(content, date);

  const subject = `EmoMail: ${content.emotion} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  console.log(`Sending email to ${recipientEmails.length} recipient(s)...`);
  let sentCount = 0;
  for (const recipient of recipientEmails) {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipient,
      subject,
      html,
    });

    if (error) {
      console.error(`Failed to send to ${recipient}: ${JSON.stringify(error)}`);
      continue;
    }

    sentCount++;
    console.log(`Sent to ${recipient} — ID: ${data?.id}`);
    if (recipientEmails.indexOf(recipient) < recipientEmails.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  if (sentCount === 0) {
    throw new Error(`All ${recipientEmails.length} send(s) failed — not logging to history.`);
  }

  appendToHistory(content.emotion);
  console.log(`Logged "${content.emotion}" to history.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
