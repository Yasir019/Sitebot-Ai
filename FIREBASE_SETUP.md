# Firebase Setup for SiteBot AI

This project now has Firebase Web SDK config in `.env.local`, a Firebase client in `src/firebase.ts`, and auth helpers in `src/services/firebaseAuth.ts`.

## Enable Firebase Services

In Firebase Console for `sideagents`, enable:

- Authentication: Email/Password provider
- Firestore Database
- Storage

## Deploy Rules

Install and login to Firebase CLI if needed:

```powershell
npm install -g firebase-tools
firebase login
```

Deploy Firestore and Storage rules:

```powershell
cd D:\sitebot-ai
firebase use sideagents
firebase deploy --only firestore:rules,storage
```

## Run Locally

```powershell
cd D:\sitebot-ai
npm run dev
```

Open:

```text
http://localhost:3000
```

## What Works Now

- Business owner signup creates a Firebase Auth user.
- Business owner signup creates:
  - `users/{uid}`
  - `businesses/{businessId}`
- Login first tries Firebase Auth + Firestore profile lookup.
- Existing demo/local Express login remains as fallback for the old seeded accounts.

## What Is Still Needed for Full Production Backend

To let an owner create staff Firebase Auth accounts from the owner dashboard securely, you need one of these:

- Firebase Admin SDK on the backend with service account credentials, recommended.
- A secondary Firebase client app flow, less ideal for production.

For real document upload/RAG, the next phase should connect:

- Firebase Storage uploads
- document text extraction
- chunk storage in Firestore
- embeddings/vector search
- secure AI answer endpoint
