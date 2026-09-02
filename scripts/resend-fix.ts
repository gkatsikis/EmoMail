// ponytail: one-off correction script for the 2026-09-02 "dubbed"/nagare mixup — delete after use
const SENT_EMAIL_ID = '88f89d05-566e-4015-b503-090f03a794d8';

async function main() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY required');

  const res = await fetch(`https://api.resend.com/emails/${SENT_EMAIL_ID}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${await res.text()}`);
  const email = (await res.json()) as { subject: string; html: string };

  if (process.env.MODE !== 'send') {
    console.log('SUBJECT:', email.subject);
    console.log('----- HTML -----');
    console.log(email.html);
    return;
  }

  const html = email.html
    .replace('EmoMail — dubbed', 'EmoMail — nagare')
    .replace('>dubbed</h1>', '>nagare</h1>');
  const subject = 'Correction: ' + email.subject.replace('dubbed', 'nagare');

  const recipients = (process.env.RECIPIENT_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  if (recipients.length === 0) throw new Error('RECIPIENT_EMAIL required');
  const from = process.env.FROM_EMAIL ?? 'EmoMail <onboarding@resend.dev>';

  for (const to of recipients) {
    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    const body = await sendRes.json();
    console.log(sendRes.ok ? `Sent to ${to} — ID: ${(body as any).id}` : `FAILED ${to}: ${JSON.stringify(body)}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
