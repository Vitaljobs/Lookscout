# 📧 Resend Email Setup Guide

## Stap 1: Resend Inbound Email Configureren

### 1.1 Log in op Resend Dashboard
Ga naar [resend.com](https://resend.com) en log in met je account.

### 1.2 Configureer Inbound Email
1. Ga naar **Inbound** in het menu
2. Klik op **Add Inbound Route**
3. Configureer als volgt:
   - **Domain**: Kies je geverifieerde domain (bijv. `titan.xx.kg`)
   - **Inbound Address**: Maak een catch-all of specifiek adres (bijv. `support@titan.xx.kg`)
   - **Webhook URL**: `https://jouw-vercel-url.vercel.app/api/support/incoming`
   - **Events**: Selecteer "Email Received"

### 1.3 Noteer Webhook Secret
- Kopieer de **Webhook Secret** die Resend genereert
- Deze heb je nodig voor `.env.local`

## Stap 2: Gmail Forwarding Instellen

### 2.1 Open Gmail Settings
1. Log in op **VOIDEZSS@GMAIL.COM**
2. Klik op het tandwiel ⚙️ → **See all settings**
3. Ga naar het tabblad **Forwarding and POP/IMAP**

### 2.2 Voeg Forwarding Toe
1. Klik op **Add a forwarding address**
2. Voer in: `support@titan.xx.kg` (of het adres dat je in Resend hebt geconfigureerd)
3. Gmail stuurt een verificatie email → klik op de link in die email
4. Keer terug naar Gmail settings
5. Selecteer **Forward a copy of incoming mail to** → `support@titan.xx.kg`
6. Kies wat er met de originele email moet gebeuren:
   - **Keep Gmail's copy in the Inbox** (aanbevolen voor backup)
   - Of: **Archive Gmail's copy**

### 2.3 Sla op
Klik onderaan op **Save Changes**

## Stap 3: Environment Variables Updaten

Voeg toe aan `.env.local`:

```env
# Support Email Configuration
SUPPORT_EMAIL=VOIDEZSS@GMAIL.COM
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Stap 4: Deploy naar Vercel

```bash
# Push naar GitHub
git add .
git commit -m "feat: email integratie voor Unified Support Hub"
git push

# Vercel zal automatisch deployen
# Of handmatig: vercel --prod
```

## Stap 5: Test de Integratie

### 5.1 Verstuur Test Email
Verstuur een email naar **VOIDEZSS@GMAIL.COM** met:
- **Onderwerp**: "Test van Echo Chamber"
- **Bericht**: "Hallo, ik heb een vraag over mijn reputation score"

### 5.2 Controleer Flow
1. Email komt binnen in Gmail
2. Gmail forward naar `support@titan.xx.kg`
3. Resend ontvangt email
4. Resend stuurt webhook naar jouw API
5. API analyseert met Gemini AI
6. Bericht verschijnt in Titan dashboard

### 5.3 Verifieer in Dashboard
1. Open Titan dashboard
2. Ga naar Unified Support Hub
3. Bericht zou direct zichtbaar moeten zijn met:
   - ✅ Project label: "echo-chamber"
   - ✅ Sentiment: 😐 (neutral)
   - ✅ Status: "new"

## Troubleshooting

### Email komt niet aan in Dashboard

**Check 1: Gmail Forwarding**
```
Gmail → Settings → Forwarding → Moet actief zijn
```

**Check 2: Resend Webhook Logs**
```
Resend Dashboard → Inbound → Logs → Check of webhook is aangeroepen
```

**Check 3: Vercel Logs**
```bash
vercel logs
# Zoek naar: "📧 Inbound email received"
```

**Check 4: Database**
```sql
-- Check in Supabase SQL Editor
select * from contact_messages order by created_at desc limit 5;
```

### SPF/DKIM Issues (voor OUTBOUND emails)

Als je emails verstuurt vanuit Titan maar ze komen niet aan:

1. **Verifieer Domain in Resend**
   - Resend Dashboard → Domains → Add Domain
   - Voeg DNS records toe (SPF, DKIM, DMARC)

2. **Check DNS Records**
   ```
   SPF:   v=spf1 include:_spf.resend.com ~all
   DKIM:  resend._domainkey (waarde van Resend)
   DMARC: v=DMARC1; p=none; rua=mailto:dmarc@jouwdomain.com
   ```

3. **Test Email Deliverability**
   - Gebruik [mail-tester.com](https://www.mail-tester.com)
   - Verstuur test email en check score

## Verificatie Checklist

- [ ] Resend inbound route geconfigureerd
- [ ] Gmail forwarding actief
- [ ] Webhook secret in `.env.local`
- [ ] Code gedeployed naar Vercel
- [ ] Test email verstuurd
- [ ] Bericht zichtbaar in dashboard
- [ ] Project label correct
- [ ] Sentiment gedetecteerd
- [ ] Reply functionaliteit werkt

## Support

Als je problemen hebt, check:
1. Vercel deployment logs
2. Resend webhook logs
3. Supabase database logs
4. Browser console voor frontend errors
