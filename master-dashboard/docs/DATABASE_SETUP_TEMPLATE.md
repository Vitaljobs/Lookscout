# 📋 Database Setup Template - Voor Nieuwe Projecten

## Kopieer dit naar de Agent bij elk nieuw project:

---

### 🎯 Project Informatie

**Project Naam**: [bijv. "MindGarden", "JobHub", "EchoSpace"]  
**Project Slug**: [bijv. "mindgarden", "jobhub", "echospace"]  
**Categorie**: [bijv. "wellness", "recruitment", "social"]

---

### 🗄️ Database Configuratie

**BELANGRIJK**: Gebruik de bestaande **Lookscout Supabase database**

```
Supabase Project: Lookscout
URL: https://cwhcxazrmayjhaadtjqs.supabase.co
Database: Gedeelde multi-tenant database
```

**Niet een nieuwe Supabase project aanmaken!**

---

### 📊 Vereiste Tabellen

#### 1. Voeg `project_source` toe aan gedeelde tabellen

Als je gebruik maakt van gedeelde tabellen (zoals `contact_messages`), zorg dat:
- Elke insert heeft `project_source = '[project-slug]'`
- Elke query filtert op `project_source = '[project-slug]'`

#### 2. Project-specifieke tabellen

Als je project-specifieke data heeft, maak dan tabellen met prefix:

```sql
-- Voorbeeld voor project "mindgarden"
create table mindgarden_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  session_data jsonb,
  created_at timestamptz default now()
);

-- Of zonder prefix maar met project_source kolom
create table wellness_sessions (
  id uuid primary key default gen_random_uuid(),
  project_source text not null default 'mindgarden',
  user_id uuid references auth.users(id),
  session_data jsonb,
  created_at timestamptz default now()
);
```

---

### 🔐 Row Level Security (RLS)

Zorg altijd voor RLS policies die filteren op `project_source`:

```sql
-- Voorbeeld policy
create policy "Users see own project data"
  on [table_name] for select
  using (project_source = '[project-slug]');

create policy "Users insert own project data"
  on [table_name] for insert
  with check (project_source = '[project-slug]');
```

---

### 📧 Email Integratie

Als dit project support emails ontvangt:

**Email Adres**: VOIDEZSS@GMAIL.COM (gedeeld voor alle projecten)

**Configuratie**:
- Emails worden automatisch gelabeld met `project_source`
- AI detecteert automatisch het juiste project
- Zichtbaar in Titan Unified Support Hub

**Keywords voor AI detectie** (voeg toe aan `lib/emailAnalyzer.ts`):
```typescript
'[project-slug]': ['keyword1', 'keyword2', 'keyword3']
```

---

### 🎨 Dashboard Integratie

Als dit project zichtbaar moet zijn in Titan dashboard:

**Project Badge Color** (voeg toe aan `components/SupportHub.tsx`):
```typescript
'[project-slug]': 'bg-[color]-500/20 text-[color]-400 border-[color]-500/30'
```

**Kleuren suggesties**:
- 🟣 Paars: purple (wellness, spiritueel)
- 🔵 Blauw: blue (tech, business)
- 🟢 Groen: green (health, eco)
- 🟠 Oranje: orange (creative, energie)
- 🔴 Rood: red (urgent, belangrijk)
- 🟡 Geel: yellow (positief, vrolijk)

---

### 🔑 Environment Variables

Voeg toe aan `.env.local` (indien nodig):

```env
# [Project Naam] Configuratie
NEXT_PUBLIC_[PROJECT]_API_URL=https://...
[PROJECT]_API_KEY=...
```

---

### ✅ Checklist voor Agent

Geef dit door aan de agent:

```
Nieuw project: [Project Naam]

Database setup:
- [ ] Gebruik bestaande Lookscout Supabase database
- [ ] Voeg project_source = '[project-slug]' toe aan alle queries
- [ ] Maak project-specifieke tabellen met prefix of project_source kolom
- [ ] Configureer RLS policies met project_source filter
- [ ] Voeg keywords toe aan emailAnalyzer.ts voor AI detectie
- [ ] Voeg project badge color toe aan SupportHub.tsx
- [ ] Update types indien nodig

Email integratie:
- [ ] Gebruik VOIDEZSS@GMAIL.COM (gedeeld adres)
- [ ] AI detecteert automatisch project via keywords
- [ ] Berichten verschijnen in Unified Support Hub

Deployment:
- [ ] Gebruik bestaande Vercel project (indien van toepassing)
- [ ] Of maak nieuw Vercel project met zelfde Supabase credentials
```

---

## 📝 Voorbeeld Prompt voor Agent

```
Hallo! Ik wil een nieuw project toevoegen aan mijn ecosystem.

Project: MindGarden
Slug: mindgarden
Type: Wellness app voor mental health tracking

Database Setup:
- Gebruik de bestaande Lookscout Supabase database
- Voeg project_source = 'mindgarden' toe aan alle data
- Maak tabellen: mindgarden_sessions, mindgarden_moods
- RLS policies met project_source filter

Email Support:
- Gebruik VOIDEZSS@GMAIL.COM
- Keywords: wellness, mental health, mood, meditation, mindfulness
- Badge color: groen (green)

Maak de database migratie en update de email analyzer.
```

---

## 🎯 Belangrijkste Regels

1. **Eén Database**: Altijd Lookscout Supabase gebruiken
2. **Project Isolatie**: Via `project_source` kolom
3. **Gedeelde Email**: VOIDEZSS@GMAIL.COM voor alles
4. **AI Detectie**: Keywords toevoegen voor automatische labeling
5. **RLS Policies**: Altijd filteren op `project_source`

---

## 🚀 Quick Reference

| Aspect | Actie |
|--------|-------|
| **Database** | Gebruik Lookscout Supabase |
| **Tabellen** | Prefix met `[project]_` of kolom `project_source` |
| **Queries** | Filter: `where project_source = '[slug]'` |
| **Email** | VOIDEZSS@GMAIL.COM (gedeeld) |
| **AI Keywords** | Voeg toe aan `emailAnalyzer.ts` |
| **Badge Color** | Voeg toe aan `SupportHub.tsx` |
| **RLS** | Policy met `project_source` filter |

---

Bewaar dit document en gebruik het als template bij elk nieuw project! 🎉
