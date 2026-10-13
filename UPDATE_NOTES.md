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
