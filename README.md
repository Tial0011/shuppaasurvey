# Shuppaa Survey

Survey website + admin panel for the Shuppaa awareness campaign.
React 19 · Vite · TypeScript · Firebase (Firestore, Auth, Hosting, Analytics).

Palette: main blue `#2563EC`, teal `#0BB9B7`, off-white `#FAFBFD`, white.

## 1. Run it locally
```bash
npm install
npm run dev
```
Site: http://localhost:5173 · Admin: http://localhost:5173/admin

Your Firebase config is already in `.env`.

## 2. One-time Firebase setup (5 minutes)
1. **Firestore**: Firebase console → Build → Firestore Database → *Create database* (production mode).
2. **Auth**: Build → Authentication → *Get started* → enable **Email/Password**.
3. **Create your admin login**: Authentication → Users → *Add user* (your email + a strong password).
4. **Make that user an admin**: sign in at `/admin/login`. The screen will show your **User ID**. In Firestore create a collection `admins` and add a document whose **Document ID** is that User ID (no fields needed). Refresh and you're in.
5. **Publish the security rules** (important, this is what protects your data):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules
   ```
   (or paste `firestore.rules` into Firestore → Rules → Publish)

## 3. Deploy
```bash
npm run deploy      # builds, then firebase deploy (hosting + rules)
```
If sign-in fails on your live domain, add it under Authentication → Settings → Authorized domains.

## How it works
| Public | |
|---|---|
| `/` | Landing page: "Small business. Big-business habits.", 3 pillars, live "early access spots left" counter |
| `/survey` | One-question-at-a-time survey, then optional early-access contact step |
| `/?src=instagram` | Tracked links. `src` is remembered for the session and saved with the response |

| Admin (`/admin`) | |
|---|---|
| Dashboard | Responses vs target, early-access sign-ups, link clicks, completion rate, UNIMED share, per-day chart, by-source chart |
| Responses | Search, filter (source / UNIMED / early access), full answers, delete, **CSV export** |
| Insights | Per-question charts, averages and free-text answers, ready to share back |
| Survey builder | Edit/add/reorder/delete questions live. Tag one question "UNIMED check" and one "How did you hear" |
| Share links | Tracked links per platform and per student leader |
| Settings | Open/close survey, target, early-access spots, campaign start date, title and intro |

## Project structure
```
src/
  config/      brand copy + default survey questions
  lib/         firebase init, shared types
  services/    all Firestore/Auth calls (surveyService, adminService)
  hooks/       context providers (config, auth, responses, tracking)
  utils/       stats, csv, source helpers
  components/  shared UI (Logo, Icon, Spinner, Toast)
  features/
    survey/    Landing, SurveyPage, QuestionField, ThankYou
    admin/     AdminLayout + pages/ (code-split, only loaded for admins)
  styles/      tokens.css (palette), base.css, site.css, admin.css
firestore.rules  security rules      firebase.json  hosting config
```

## Notes
- The survey questions in `src/config/defaultSurvey.ts` are a starter set, because your questions were provided separately. Replace them in **Admin → Survey builder** (no code needed).
- The logo is a placeholder wordmark; swap it in `src/components/ui/Logo.tsx` when the designer's logo is ready.
- Pricing is intentionally not mentioned anywhere, per the strategy doc.
- Public visitors can only *create* responses. Only admins can read or delete them (see `firestore.rules`).
