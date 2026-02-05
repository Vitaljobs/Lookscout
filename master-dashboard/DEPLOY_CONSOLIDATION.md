# 🚀 Quick Deploy - Master Database Consolidatie

## Wat moet je doen? (10 minuten)

### Stap 1: Database Migraties (5 min)

Open [Supabase SQL Editor](https://supabase.com/dashboard/project/cwhcxazrmayjhaadtjqs/sql/new) en voer uit:

**Migratie 1: Project ID Systeem**
```sql
-- Zie DATABASE_MIGRATION_GUIDE.md sectie "Migratie 1"
```

**Migratie 2: User Access**
```sql
-- Zie DATABASE_MIGRATION_GUIDE.md sectie "Migratie 2"
```

**Migratie 3: RLS Policies**
```sql
-- Zie DATABASE_MIGRATION_GUIDE.md sectie "Migratie 3"
```

### Stap 2: Deploy Code (3 min)

```bash
cd C:\Users\james\Desktop\sites\Lookscout\master-dashboard
git add .
git commit -m "feat: master database consolidatie met project_id systeem"
git push
```

### Stap 3: Test (2 min)

1. Log in op dashboard
2. Check dat berichten zichtbaar zijn
3. Verstuur test email
4. Verifieer project labeling

## Volledige Documentatie

- [DATABASE_MIGRATION_GUIDE.md](file:///C:/Users/james/Desktop/sites/Lookscout/master-dashboard/DATABASE_MIGRATION_GUIDE.md) - Complete SQL migraties
- [implementation_plan.md](file:///C:/Users/james/.gemini/antigravity/brain/c93dfc5d-7d5e-454b-bccb-1a93b575c994/implementation_plan.md) - Technische details

## Wat is er veranderd?

✅ **Database:**
- `project_id` kolom toegevoegd aan alle tabellen
- `user_project_access` tabel voor access control
- RLS policies voor data isolatie
- Overlord access voor james@live.nl

✅ **Code:**
- `emailAnalyzer.ts` - Haalt project_id op uit database
- `app/api/support/incoming/route.ts` - Schrijft project_id
- `types/support.ts` - ContactMessage met project_id
- Frontend klaar voor project filtering

## Troubleshooting

**Error: column already exists**
→ Skip naar volgende migratie

**Error: user not found**
→ Log eerst in op de app

**Berichten niet zichtbaar**
→ Check RLS policies zijn correct
