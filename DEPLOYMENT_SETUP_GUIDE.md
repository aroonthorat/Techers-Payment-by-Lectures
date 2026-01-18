# EduPay Pro - Deployment Setup Guide

This guide will help you set up and deploy the EduPay Pro application on Netlify with your own Firebase database.

## Prerequisites

- A GitHub repository (you have this)
- A Netlify account (connected to your GitHub)
- A Firebase project (free tier is sufficient)
- Node.js and npm installed locally (for testing)

## Step 1: Set Up Your Firebase Project

### 1.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a new project"
3. Name it "EduPay Pro" (or your preferred name)
4. Select your region (choose the closest to your users, e.g., `asia-south1` for India)
5. Click "Create project"

### 1.2 Enable Firestore Database

1. In the Firebase Console, go to **Firestore Database** from the left sidebar
2. Click **Create database**
3. Start in **Test Mode** (you will configure security rules later)
4. Select your region and click **Create**

### 1.3 Add a Web App to Your Firebase Project

1. Go to **Project Settings** (gear icon in the top left)
2. Click on the **Apps** section
3. Click **Add app** and select **Web** (</>)
4. Register the app (name it "EduPay Pro Web")
5. **Copy the Firebase config object** - you'll need these values:

```javascript
{
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
}
```

## Step 2: Add Environment Variables to Netlify

### 2.1 Navigate to Netlify Environment Variables

1. Go to your Netlify project: [cosmic-twilight-8b89a3](https://app.netlify.com/projects/cosmic-twilight-8b89a3)
2. Go to **Settings** → **Build & deploy** → **Environment**
3. Click **Edit variables**

### 2.2 Add Your Firebase Credentials

Add the following environment variables with your Firebase config values:

| Variable Name | Value | Example |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Your API Key | `AIzaSyD3xK...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth Domain | `edupay-trial.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID | `edupay-trial` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage Bucket | `edupay-trial.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | App ID | `1:123456789:web:abc123...` |

**Note:** You should already have `GEMINI_API_KEY` and `VITE_FIREBASE_API_KEY` set.

## Step 3: Trigger a New Deploy

1. After adding all environment variables, go back to the Netlify project page
2. Click **Deploys** in the sidebar
3. You should see a new deploy automatically triggered, or click **Trigger deploy** → **Deploy site**
4. Wait for the deploy to complete (usually 2-3 minutes)
5. Visit your deployed app at: `https://cosmic-twilight-8b89a3.netlify.app/`

## Step 4: Verify the App is Working

1. Once deployed, visit the app URL
2. You should see the login screen with two options:
   - **MANAGEMENT** - Admin access
   - **STAFF MEMBER** - Teacher access
3. Click **MANAGEMENT** to log in
4. The app should now connect to your Firebase database

## Step 5: Seed Demo Data (Optional)

To test the app with sample data:

1. While logged in as MANAGEMENT, go to the **Dashboard**
2. Look for a **Reset** or **Seed** button (yellow refresh icon)
3. Click it to populate the database with demo data
4. You can now explore all features

## Troubleshooting

### App Shows Blank Page

- **Check Console:** Open DevTools (F12) and look for errors
- **Missing Variables:** Ensure all 6 Firebase variables are set in Netlify
- **Wait for Deploy:** Give the deploy 2-3 minutes to complete
- **Clear Cache:** Do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Firebase Connection Issues

- Verify your credentials are correct in the Firebase Console
- Check that Firestore is enabled and in **Test Mode**
- Ensure your browser allows CORS requests (all modern browsers do)

### Deployment Failed

- Check the Netlify deploy logs for errors
- Ensure there are no syntax errors in recent commits
- Try rebuilding: **Deploys** → **Trigger deploy** → **Deploy site**

## Local Development (Optional)

To run the app locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/aroonthorat/Techers-Payment-by-Lectures.git
   cd Techers-Payment-by-Lectures
   ```

2. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

3. Fill in your Firebase credentials in `.env`

4. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```

5. Open `http://localhost:5173` in your browser

## Security Rules (Optional - Production)

When you're ready for production, apply proper Firestore security rules:

1. Go to Firebase Console → **Firestore Database** → **Rules**
2. Replace with rules from `firestore.rules` in the repository
3. This ensures only authorized users can access data

## Support

For issues or questions:
1. Check the AI Studio conversation history
2. Review the INTEGRATION_GUIDE.md for API details
3. Open an issue on GitHub

---

**Last Updated:** Today
**App Version:** 1.0.0
**Firebase Plan:** Spark (Free)
