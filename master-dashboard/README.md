# 🔱 Titan | Central Control Tower

**Titan** is het centrale dashboard voor het real-time monitoren en beheren van meerdere platforms binnen het ecosysteem van **Lookscout**, waaronder **CommonGround**, **VIBECHAIN** en **Vitaljobs**.

![Titan Dashboard Status](https://img.shields.io/badge/Status-Live-success)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Supabase](https://img.shields.io/badge/Supabase-Connected-green)

## 🚀 Functies
- **Live Connection**: Directe integratie met Supabase-databases voor real-time gebruikersstatistieken.
- **Multi-Project Overzicht**: Schakel naadloos tussen verschillende projectomgevingen via de projectkiezer.
- **Performance Analytics**: Real-time inzicht in bezoekersaantallen, actieve sessies en systeemstatus.
- **Geoptimaliseerde UI**: Een modern, high-performance dashboard gebouwd met Next.js en Tailwind CSS (Dark Mode).
- **Secure API Proxy**: Ingebouwde Next.js Rewrites voor veilige CORS-handling.

## 🛠 Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **Database**: [Supabase](https://supabase.com/) (Real-time data)
- **Deployment**: [Vercel](https://vercel.com/)
- **Styling**: Tailwind CSS

## ⚙️ Installatie & Ontwikkeling

### 1. Kloon de repository
```bash
git clone https://github.com/Vitaljobs/Lookscout.git
cd Lookscout/master-dashboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Omgevingsvariabelen instellen
Maak een `.env.local` bestand aan in de `master-dashboard` map en voeg de volgende sleutels toe (verkrijgbaar via beheerder):

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=jouw-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-supabase-anon-key

# Pulse API Configuration (Supabase REST)
NEXT_PUBLIC_PULSE_API_URL=https://[project-ref].supabase.co/rest/v1
NEXT_PUBLIC_PULSE_API_KEY=jouw-service-role-of-anon-key
```

### 4. Start de dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) om het dashboard te bekijken.

---

## ℹ️ Repository Details (GitHub Sidebar)
*Gebruik deze tekst voor de "About" sectie van de repository:*

**Description:** Central Control Tower for monitoring CommonGround, VIBECHAIN & Vitaljobs.
**Website:** https://lookscout-delta.vercel.app/
**Topics:** `nextjs`, `supabase`, `dashboard`, `real-time-analytics`, `control-tower`, `typescript`
