# 🚀 Quick Start - Email Integratie

## Wat is er klaar?

✅ **Code geïmplementeerd:**
- Email webhook endpoint (`/api/support/incoming`)
- AI analyzer met Gemini (`lib/emailAnalyzer.ts`)
- Database schema updates (sentiment + metadata)
- Frontend sentiment badges
- Project badge colors (inclusief lookscout)

## Volgende Stappen (5 minuten)

### 1️⃣ Database Migratie (1 min)

Open [Supabase SQL Editor](https://supabase.com/dashboard/project/cwhcxazrmayjhaadtjqs/sql/new) en run:

```sql
alter table contact_messages 
  add column if not exists sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  add column if not exists metadata jsonb;

create index if not exists idx_contact_messages_sentiment on contact_messages(sentiment);

create policy if not exists "Allow anonymous insert for webhook"
  on contact_messages for insert
  to anon
  with check (true);
```

### 2️⃣ Deploy naar Vercel (2 min)

```bash
cd C:\Users\james\Desktop\sites\Lookscout\master-dashboard
git add .
git commit -m "feat: email integratie met AI sentiment analyse"
git push
```

Vercel deployt automatisch. Check status op [vercel.com/dashboard](https://vercel.com/dashboard)

### 3️⃣ Resend Configureren (2 min)

1. Ga naar [resend.com/inbound](https://resend.com/inbound)
2. Create Inbound Route:
   - Domain: je geverifieerde domain
   - Webhook URL: `https://jouw-vercel-url.vercel.app/api/support/incoming`
3. Kopieer webhook secret → voeg toe aan Vercel env vars

### 4️⃣ Gmail Forwarding (30 sec)

1. Gmail → Settings → Forwarding
2. Add forwarding address: `support@jouwdomain.com`
3. Verify email → Enable forwarding

### 5️⃣ Test! (30 sec)

Verstuur email naar **VOIDEZSS@GMAIL.COM** → Check Titan dashboard!

---

## Documentatie

📚 **Complete guides:**
- [EMAIL_SETUP_GUIDE.md](file:///C:/Users/james/.gemini/antigravity/brain/c93dfc5d-7d5e-454b-bccb-1a93b575c994/EMAIL_SETUP_GUIDE.md) - Stap-voor-stap setup
- [walkthrough.md](file:///C:/Users/james/.gemini/antigravity/brain/c93dfc5d-7d5e-454b-bccb-1a93b575c994/walkthrough.md) - Technische details
- [DATABASE_SETUP_TEMPLATE.md](file:///C:/Users/james/.gemini/antigravity/brain/c93dfc5d-7d5e-454b-bccb-1a93b575c994/DATABASE_SETUP_TEMPLATE.md) - Template voor nieuwe projecten

## Hulp nodig?

Check de troubleshooting sectie in EMAIL_SETUP_GUIDE.md
