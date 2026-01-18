# EduPay Pro - Deployment & Database Setup Guide

## Problem Statement

The deployed app at `https://cosmic-twilight-8b89a3.netlify.app/` was showing a blank page due to missing environment variables and database configuration. The application requires Firebase credentials to initialize properly.

## Issues Identified

1. **Missing Environment Variables**: The app requires Firebase configuration variables that were not set in Netlify
2. **No Database Connection**: Firebase Firestore was not connected
3. **Missing Build Configuration**: Vite environment variables needed to be properly configured

## Solutions Implemented

### 1. Added Netlify Configuration ✅

- `netlify.toml` already configured with proper redirects
- Catch-All redirect rule in place to handle SPA routing

### 2. Created Environment Variables Template ✅

- Added `.env.example` with all required Firebase configuration keys
- Documents which env vars are needed for the application

### 3. Deployed to Netlify

**Add these environment variables to Netlify Dashboard:**

Go to: `Project Settings > Environment variables`

#### Firebase Configuration Variables:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Additional Configuration:

```
GEMINI_API_KEY=your_gemini_api_key (already set)
```

## Getting Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Go to Project Settings
4. Under "Your apps", select your web app
5. Copy the config object and extract the values
6. Add each value to the corresponding Netlify environment variable

## Database Setup

### Firebase Firestore

The application uses Firebase Firestore for the database. The `firebase.ts` file includes:

- **Local Storage Fallback**: If Firebase isn't configured, the app uses localStorage
- **Automatic Migration**: Can migrate local data to Firebase when credentials are available
- **Collections**:
  - `teachers` - Faculty records
  - `classes` - Class/batch information
  - `attendance` - Lecture attendance records
  - `payments` - Payment records
  - `advances` - Advance payment records
  - `students` - Student records
  - `feePayments` - Fee payment records
  - `exams` - Exam records
  - `examSubjects` - Exam subject mappings
  - `examPapers` - Exam paper details
  - `markEntries` - Student marks
  - `teacherExamAssignments` - Teacher-exam assignments
  - `subjects` - Subject definitions

## Deployment Steps

1. **Set Environment Variables**:
   - Go to Netlify > cosmic-twilight-8b89a3 > Site settings > Build & deploy > Environment
   - Add all Firebase variables from above

2. **Trigger Rebuild**:
   - Go to Deploys tab
   - Click "Trigger deploy" > "Deploy site"
   - Wait for build to complete

3. **Verify Deployment**:
   - Visit https://cosmic-twilight-8b89a3.netlify.app/
   - App should now load without errors

## Architecture

### Frontend (Vite + React)
- Handles all UI/UX interactions
- Uses Vite for fast builds
- Environment variables injected at build time with `VITE_` prefix

### Backend (Netlify Functions)
- `netlify/functions/` - Cloud functions
- Handles server-side logic
- Can use different environment vars (without VITE_ prefix)

### Database
- **Production**: Firebase Firestore (cloud)
- **Development**: localStorage (browser)
- Automatic fallback when Firebase unavailable

## Troubleshooting

### App Still Shows Blank Page
1. Check browser console (F12) for errors
2. Verify all environment variables are set in Netlify
3. Trigger a new deploy after setting variables

### Firebase Connection Failed
1. Verify credentials are correct
2. Check Firebase project security rules allow read/write
3. Ensure Firebase billing is enabled

### Seed Database
```javascript
// In browser console, run:
await dbService.seedDatabase();
// This creates test data for development
```

## Next Steps

1. Get Firebase credentials from your Firebase project
2. Add all environment variables to Netlify
3. Trigger a new deployment
4. Test the application
5. Run `seedDatabase()` to populate test data

## Local Development

For local development, create a `.env.local` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_gemini_key
```

Then run:
```bash
npm install
npm run dev
```

## Reference

- [Firebase Web SDK Docs](https://firebase.google.com/docs/web/setup)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-modes.html)
