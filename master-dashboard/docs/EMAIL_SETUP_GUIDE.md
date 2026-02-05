# 🚀 Email Integratie Setup - Complete Handleiding

## Overzicht

Je gaat nu **VOIDEZSS@GMAIL.COM** koppelen aan de Unified Support Hub, zodat alle emails automatisch in je Titan dashboard verschijnen met:
- ✅ **Automatische project detectie** (echo-chamber, commonground, vitaljobs, lookscout)
- ✅ **Sentiment analyse** (😊 positief, 😐 neutraal, 😟 negatief)
- ✅ **Real-time updates** (geen refresh nodig)

---

## Stap 1: Database Migratie Uitvoeren

### Via Supabase Dashboard (Aanbevolen)

1. **Open Supabase Dashboard**
   - Ga naar [supabase.com](https://supabase.com/dashboard)
   - Selecteer je **Lookscout** project

2. **Open SQL Editor**
   - Klik op **SQL Editor** in het linkermenu
   - Klik op **New query**

3. **Voer Migratie Uit**
   
   Kopieer en plak deze SQL:

   ```sql
   -- Add sentiment and metadata columns to contact_messages table
   alter table contact_messages 
     add column if not exists sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
     add column if not exists metadata jsonb;

   -- Add index for sentiment queries
   create index if not exists idx_contact_messages_sentiment on contact_messages(sentiment);

   -- Update RLS policy to allow anonymous inserts (for webhook)
   create policy if not exists "Allow anonymous insert for webhook"
     on contact_messages for insert
     to anon
     with check (true);
   ```

4. **Run Query**
   - Klik op **Run** (of druk Ctrl+Enter)
   - Je zou moeten zien: "Success. No rows returned"

---

## Stap 2: Resend Inbound Email Configureren

### 2.1 Log in op Resend

1. Ga naar [resend.com/login](https://resend.com/login)
2. Log in met je account

### 2.2 Verifieer je Domain (Als nog niet gedaan)

1. Ga naar **Domains** in het menu
2. Als je domain al geverifieerd is, ga door naar 2.3
3. Anders:
   - Klik **Add Domain**
   - Voer je domain in (bijv. `titan.xx.kg` of `lookscout.nl`)
   - Voeg de DNS records toe die Resend toont (SPF, DKIM, DMARC)
   - Wacht tot verificatie compleet is (kan 5-30 minuten duren)

### 2.3 Configureer Inbound Email Route

1. Klik op **Inbound** in het linkermenu
2. Klik op **Create Inbound Route**
3. Configureer als volgt:

   **Inbound Settings:**
   - **Domain**: Selecteer je geverifieerde domain
   - **Inbound Email**: `support@jouwdomain.com` (of maak een catch-all: `*@jouwdomain.com`)
   
   **Webhook Settings:**
   - **Webhook URL**: `https://jouw-vercel-url.vercel.app/api/support/incoming`
     
     > **Let op**: Vervang `jouw-vercel-url` met je echte Vercel URL!
     > Je vindt deze in je Vercel dashboard of door `vercel --prod` te runnen
   
   - **Events**: Selecteer **Email Received**

4. Klik **Create Route**

5. **Kopieer Webhook Signing Secret**
   - Resend toont een signing secret (begint met `whsec_...`)
   - Kopieer deze - je hebt hem nodig voor `.env.local`

---

## Stap 3: Gmail Forwarding Instellen

### 3.1 Log in op Gmail

1. Ga naar [gmail.com](https://gmail.com)
2. Log in met **VOIDEZSS@GMAIL.COM**

### 3.2 Open Instellingen

1. Klik op het tandwiel ⚙️ rechtsboven
2. Klik op **See all settings**
3. Ga naar het tabblad **Forwarding and POP/IMAP**

### 3.3 Voeg Forwarding Adres Toe

1. Klik op **Add a forwarding address**
2. Voer in: `support@jouwdomain.com` (het adres dat je in Resend hebt geconfigureerd)
3. Klik **Next** → **Proceed** → **OK**
4. Gmail stuurt nu een verificatie email naar dat adres

### 3.4 Verifieer Forwarding

> **Belangrijk**: De verificatie email gaat NIET naar je Gmail, maar naar het Resend adres!

**Optie A: Check via Resend Dashboard**
1. Ga naar Resend → **Emails** → **Inbound**
2. Je zou de verificatie email van Gmail moeten zien
3. Open de email en kopieer de verificatie link
4. Plak in je browser en bevestig

**Optie B: Check je andere email**
Als je het Resend domain forward naar een ander adres, check daar.

### 3.5 Activeer Forwarding

1. Keer terug naar Gmail settings
2. Refresh de pagina (F5)
3. Bij **Forward a copy of incoming mail to** selecteer je het adres
4. Kies wat er met originele emails moet gebeuren:
   - **Keep Gmail's copy in the Inbox** ✅ (aanbevolen - backup)
   - Of: **Archive Gmail's copy**
5. Klik onderaan op **Save Changes**

---

## Stap 4: Environment Variables Updaten

1. Open `.env.local` in je project
2. Voeg deze regels toe (of update bestaande):

```env
# Support Email Configuration
SUPPORT_EMAIL=VOIDEZSS@GMAIL.COM
RESEND_WEBHOOK_SECRET=whsec_jouw_secret_hier
```

3. Sla op

---

## Stap 5: Code Deployen naar Vercel

### 5.1 Commit en Push

```bash
cd C:\Users\james\Desktop\sites\Lookscout\master-dashboard

git add .
git commit -m "feat: email integratie met AI sentiment analyse"
git push
```

### 5.2 Wacht op Deployment

- Vercel zal automatisch deployen
- Check [vercel.com/dashboard](https://vercel.com/dashboard) voor status
- Wacht tot status **Ready** is

### 5.3 Update Environment Variables in Vercel

1. Ga naar je project in Vercel dashboard
2. Klik op **Settings** → **Environment Variables**
3. Voeg toe:
   - `SUPPORT_EMAIL` = `VOIDEZSS@GMAIL.COM`
   - `RESEND_WEBHOOK_SECRET` = `whsec_...` (je secret van Resend)
4. Klik **Save**
5. **Redeploy** je project (Settings → Deployments → laatste deployment → ... → Redeploy)

---

## Stap 6: Test de Integratie! 🎉

### Test 1: Verstuur Email

1. Open je persoonlijke email (niet VOIDEZSS@GMAIL.COM)
2. Verstuur een email naar **VOIDEZSS@GMAIL.COM**:

   ```
   Aan: VOIDEZSS@GMAIL.COM
   Onderwerp: Test van Echo Chamber
   
   Hallo,
   
   Ik heb een vraag over mijn reputation score in Echo Chamber.
   Kunnen jullie me helpen?
   
   Bedankt!
   ```

3. Verstuur de email

### Test 2: Check de Flow

**Verwachte flow:**
1. ✅ Email komt aan in Gmail inbox
2. ✅ Gmail forward naar Resend
3. ✅ Resend ontvangt en stuurt webhook naar je API
4. ✅ API analyseert met Gemini AI
5. ✅ Bericht wordt opgeslagen in Supabase
6. ✅ Dashboard toont bericht real-time

**Check Resend Logs:**
1. Ga naar Resend → **Inbound** → **Logs**
2. Je zou je test email moeten zien
3. Check of webhook succesvol is (status 200)

**Check Vercel Logs:**
```bash
vercel logs --prod
```
Zoek naar:
```
📧 Inbound email received
🤖 Analyzing email with AI...
✅ Analysis complete
✅ Email saved to database
```

### Test 3: Check Dashboard

1. Open je Titan dashboard: `https://jouw-vercel-url.vercel.app`
2. Log in
3. Scroll naar **Unified Support Hub** widget
4. Je zou je test email moeten zien met:
   - ✅ Naam van afzender
   - ✅ Onderwerp
   - ✅ Project badge: **echo-chamber** (oranje/paars)
   - ✅ Sentiment emoji: 😐 of 😊
   - ✅ Status: **new** (blauw pulserende dot)

### Test 4: Test Reply Functionaliteit

1. Klik op het bericht in de hub
2. Type een antwoord in het tekstveld
3. Klik **Verstuur**
4. Check je persoonlijke email - je zou een reply moeten ontvangen
5. In dashboard: status zou moeten veranderen naar **replied** ✅

---

## Troubleshooting

### ❌ Email komt niet aan in Dashboard

**Check 1: Gmail Forwarding**
```
Gmail → Settings → Forwarding → Moet "Forwarding enabled" tonen
```

**Check 2: Resend Webhook Logs**
```
Resend Dashboard → Inbound → Logs
Kijk of webhook is aangeroepen en wat de response was
```

**Check 3: Vercel Logs**
```bash
vercel logs --prod | Select-String "Inbound email"
```

**Check 4: Database**
```sql
-- In Supabase SQL Editor
select * from contact_messages 
order by created_at desc 
limit 5;
```

### ❌ Webhook Error 500

**Mogelijke oorzaken:**
1. `GEMINI_API_KEY` niet ingesteld in Vercel
2. `SUPABASE_SERVICE_ROLE_KEY` niet ingesteld
3. Database migratie niet uitgevoerd

**Fix:**
1. Check Vercel → Settings → Environment Variables
2. Zorg dat deze zijn ingesteld:
   - `GEMINI_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
3. Redeploy

### ❌ Project Label is "unknown"

Dit betekent dat de AI de email niet kon categoriseren.

**Verbeter door:**
1. Gebruik duidelijke keywords in je test email:
   - Voor Echo Chamber: "reputation", "score", "mission"
   - Voor CommonGround: "wellness", "mood", "check-in"
   - Voor VitalJobs: "vacature", "sollicitatie", "cv"
   - Voor Lookscout: "dashboard", "titan", "monitoring"

### ❌ Sentiment is altijd "neutral"

De AI heeft moeite met sentiment detectie.

**Test met duidelijkere emails:**
- **Positief**: "Geweldig! Bedankt voor jullie hulp!"
- **Negatief**: "Dit werkt niet, ik heb een probleem"

---

## Verificatie Checklist

Gebruik deze checklist om te verifiëren dat alles werkt:

- [ ] Database migratie succesvol uitgevoerd
- [ ] Resend inbound route geconfigureerd
- [ ] Gmail forwarding actief en geverifieerd
- [ ] Environment variables ingesteld in `.env.local`
- [ ] Environment variables ingesteld in Vercel
- [ ] Code gedeployed naar Vercel (status: Ready)
- [ ] Test email verstuurd naar VOIDEZSS@GMAIL.COM
- [ ] Email zichtbaar in Resend Inbound Logs
- [ ] Webhook succesvol (status 200 in Resend)
- [ ] Bericht zichtbaar in Titan dashboard
- [ ] Project label correct gedetecteerd
- [ ] Sentiment emoji zichtbaar
- [ ] Reply functionaliteit getest en werkt

---

## Next Steps

Na succesvolle setup:

1. **Configureer Email Signature**
   - Update `app/api/support/reply/route.ts`
   - Pas de email template aan naar jouw huisstijl

2. **Voeg Filters Toe**
   - Maak Gmail filters om spam te voorkomen
   - Alleen echte support emails forwarden

3. **Monitor Performance**
   - Check Resend dashboard regelmatig
   - Monitor Vercel logs voor errors
   - Check Supabase voor database performance

4. **Verbeter AI Detectie**
   - Verzamel feedback over verkeerde project labels
   - Update keywords in `lib/emailAnalyzer.ts`
   - Train de AI met betere prompts

---

## Support

Als je vastloopt, check:
1. **Vercel Logs**: `vercel logs --prod`
2. **Resend Dashboard**: Inbound → Logs
3. **Supabase Logs**: Dashboard → Logs
4. **Browser Console**: F12 → Console tab

Veel succes! 🚀
