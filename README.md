# EmoMail

A daily email that delivers an **emotion of the day** with literary context — a quote or passage from literature, poetry, or prose that brings the emotion to life, plus a note on why it matters in everyday life.

Powered by [Claude](https://anthropic.com) and sent via [Resend](https://resend.com). Runs automatically every morning via GitHub Actions.

---

## How It Works

1. GitHub Actions triggers the workflow every morning at 7:00 AM ET
2. The script calls the Claude API to generate a nuanced emotion + a literary example
3. The email is formatted and sent via Resend to your inbox

---

## Setup

### 1. Fork or clone this repo

### 2. Get your API keys

- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com)
- **Resend API key** — [resend.com](https://resend.com) (free tier: 3,000 emails/month)

### 3. Set up your sender address in Resend

By default, the email sends from `EmoMail <onboarding@resend.dev>` (Resend's shared test address). To use your own address, [verify a domain in Resend](https://resend.com/docs/send-with-custom-domain) and set the `FROM_EMAIL` secret.

### 4. Add GitHub Actions secrets

In your repo, go to **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `RESEND_API_KEY` | Your Resend API key |
| `RECIPIENT_EMAIL` | Email address to receive the daily mail |
| `FROM_EMAIL` | *(Optional)* Sender address, e.g. `EmoMail <hello@yourdomain.com>`. Defaults to `onboarding@resend.dev` |

### 5. Enable GitHub Actions

GitHub Actions is enabled by default on public repos. On private repos, ensure it's enabled under **Settings → Actions → General**.

### 6. Test it manually

Go to **Actions → Daily EmoMail → Run workflow** to trigger a test send without waiting for the next scheduled run.

---

## Local Development

```bash
cp .env.example .env
# Fill in your keys in .env

npm install
npm run dev
```

---

## Customize

- **Schedule**: Edit the `cron` expression in [`.github/workflows/daily-email.yml`](.github/workflows/daily-email.yml). Use [crontab.guru](https://crontab.guru) to build your expression.
- **Email style**: The HTML template is in [`src/index.ts`](src/index.ts) in the `buildEmailHtml` function.
- **Prompt**: The Claude prompt is in `generateEmotionContent()` — tweak it to change tone, focus, or structure.
