
# EduPay Pro Backend Integration Guide

Follow these steps to enable the server-side logic and security.

## 1. Firebase Project Setup
- Enable **Firestore Database** in the console.
- Enable **Cloud Functions** (Requires Blaze Pay-As-You-Go plan).
- Enable **Authentication**.

## 2. Deploy Functions
```bash
# From the project root
cd functions
npm install
npm run build
firebase deploy --only functions
```

## 3. Applying Security Rules
- Copy the contents of `firestore.rules` into the **Firestore > Rules** tab in the Firebase Console.
- Click **Publish**.

## 4. Setting User Roles
User roles are enforced via **Custom Claims**. You must set these using the Firebase Admin SDK.
Example (Node.js script):
```javascript
admin.auth().setCustomUserClaims(uid, { role: 'admin' }); // For Management
admin.auth().setCustomUserClaims(uid, { role: 'teacher' }); // For Faculty
```

## 5. Required Firestore Indexes
The system requires composite indexes for performance.
1. `markEntries`: `examId` (Asc) + `class` (Asc) + `division` (Asc)
2. `markEntries`: `teacherId` (Asc) + `status` (Asc)
3. `teacherExamAssignments`: `teacherId` (Asc) + `examId` (Asc)

## 6. Frontend Hookup
Use the `httpsCallable` from Firebase SDK to call the functions:
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
const functions = getFunctions();
const generateMarks = httpsCallable(functions, 'generateMarkEntries');
await generateMarks({ examId: '...', subjectIds: ['...'] });
```
