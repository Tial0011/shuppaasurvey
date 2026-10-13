# Submission debugging update

## Changes
- Submission errors now remain visible and include the Firestore/API error message; they are also logged in the browser console.
- Removed the unsafe behavior that showed the thank-you screen after a permission-denied error simply because a prior attempt timed out. A thank-you screen is shown only after a successful create or a confirmed duplicate-create response.
- Final submit validates all required questions, even if the step flow was bypassed.
- Submission retries use the same response document ID. An already-created response does not increment the public response counter again.
- Removed the local `.env` file from this distributable. The project has the Firebase config fallback in `src/lib/firebase.ts`; use `.env.example` to configure environment variables for your own deployment if needed.

## Important Firebase checks
1. Open DevTools → Console and Network, submit a test response, and inspect the `[Shuppaa] Survey submission failed` message if the UI shows an error.
2. Confirm the Firebase project configured in Netlify is `shuppaa-survey` and that the Firestore database is enabled.
3. Publish the included `firestore.rules` to the same Firebase project. The public response rule must allow create with the expected fields and server timestamp.
4. In Network, inspect the request to `firestore.googleapis.com/v1/projects/shuppaa-survey/databases/(default)/documents:commit`. A 403/`PERMISSION_DENIED` points to security rules or project configuration; a 400 usually points to a request/rules data mismatch; network/CORS failures point to browser/network configuration.
5. Verify the saved document in Firestore Console → `responses`. The public client is intentionally not allowed to read survey responses.

## Build validation
A production build could not be completed in this environment because npm dependency installation timed out and `vite/client` was unavailable. Run `npm ci` followed by `npm run build` locally or in Netlify before deploying. No live Firestore write was possible from this environment, so confirm with a real test submission after publishing the rules.

## Final touches: contact details are now mandatory
- The last step requires **full name, email address and WhatsApp / phone number**. The survey cannot be submitted without all three.
- Inline error messages per field, re-checked as the person types. Email is lowercased; phone is cleaned to digits (a leading + is kept).
- The submit button now always reads "Submit survey" (the old "Submit without contact" option is gone).
- `firestore.rules` also enforces it on the server (map with name/phone/email, valid sizes, email shape), so it can't be bypassed.
  **Publish the updated rules** (Firestore → Rules → Publish) for the server-side check to apply.

## Submit feel + console messages
- Console: `[Shuppaa] Submitting survey…` when the button is pressed, then a green `✅ Survey submitted successfully` (with response ID, answer count and source) once Firestore confirms. Personal contact details are never logged. Failures still log `[Shuppaa] Survey submission failed`.
- The button shows a spinner and "Submitting…" for at least ~1s and the fields lock while sending.
- After Firestore confirms, a "Submitted successfully" card shows for ~1.4s before the thank-you screen.
- Pressing Enter in the name/email fields now moves to the next field instead of submitting early. Only Enter in the phone field submits.

## Fix: no more false "success" on FAILED_PRECONDITION
`FAILED_PRECONDITION` is a broad Firestore status, so it is no longer treated as proof a survey was saved.
A reply counts as "already saved" only when Firestore returns `ALREADY_EXISTS`, or returns `FAILED_PRECONDITION` whose
message says the document already exists AND that same response ID had an earlier attempt that timed out or dropped.
Anything else is shown to the person as a real failure and never reaches the thank-you screen.

## Clear storage + cache on reload (testing switch)
`src/config/app.ts` → `CLEAR_BROWSER_DATA_ON_LOAD = true`. On every full page load/reload the site's localStorage, Cache Storage and
service workers are wiped (sessionStorage and the Firebase admin login are left alone). `netlify.toml` also sends no-store for the HTML shell.
**Set it to `false` before launch**, otherwise the "already responded" protection is off and anyone can resubmit by reloading.

## Final audit (see chat summary)
Type-check + build clean · 0 JS errors · no horizontal overflow at 360px · all tap targets >= 40px · all inputs labelled ·
admin routes redirect when signed out · submit logs "[Shuppaa] ✅ Survey submitted successfully" · reload wipes storage and cache.
