# Firebase Integration Setup Guide

## ✅ Completed Steps

I've already set up:
1. ✅ Installed Firebase SDK (`npm install firebase`)
2. ✅ Created `src/firebase.ts` - Firebase configuration file
3. ✅ Created `src/firebaseService.ts` - Database operations helper
4. ✅ Created `.env.local.example` - Template for environment variables
5. ✅ Updated `src/App.tsx` - Added Firebase imports

## 📋 Your Setup Steps (Required)

### **Step 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a new project"**
3. Enter project name: `formulario-evaluacion-fisioterapia`
4. Click **"Continue"**
5. Skip "Enable Google Analytics" (click "Continue" without enabling)
6. Click **"Create project"** and wait for setup to complete

### **Step 2: Get Firebase Credentials**

1. In Firebase Console, go to **Project Settings** (gear icon, top-left)
2. Click on **"Service Accounts"** tab
3. Click **"Generate New Private Key"** button
4. A JSON file downloads with your credentials
5. Open the JSON file and look for these values:
   - `apiKey` → search for `"apiKey"`
   - `authDomain` → your project ID + `.firebaseapp.com`
   - `projectId` → your project ID
   - `storageBucket` → your project ID + `.appspot.com`
   - `messagingSenderId` → numeric ID from the JSON
   - `appId` → your app ID from the JSON

**Alternatively, use the Web Config:**
1. Go to **Project Settings** > **General** tab
2. Scroll to **"Your apps"** section
3. Click on the web app (or create one with the `</>` button)
4. Copy the `firebaseConfig` object shown there

### **Step 3: Enable Firestore Database**

1. In Firebase Console, left sidebar click **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose region closest to you
5. Click **"Enable"**

### **Step 4: Create `.env.local` File**

1. In your project root directory (same level as `package.json`), create a new file: `.env.local`
2. Copy this content and replace with your Firebase values:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

3. Example (with real values):
```env
VITE_FIREBASE_API_KEY=AIzaSyDx9F1h2K3m4N5o6P7Q8R9S0T1U2V3W4X5Y
VITE_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-project-123456
VITE_FIREBASE_STORAGE_BUCKET=my-project-123456.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### **Step 5: Update Firestore Security Rules (Important!)**

1. In Firebase Console, go to **Firestore Database**
2. Click **"Rules"** tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write only their own forms
    match /formularios/{formId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

4. Click **"Publish"**

### **Step 6: Test the App**

1. Stop the dev server if running: `Ctrl+C`
2. Restart it: `npm run dev`
3. Open http://localhost:5173/
4. You should see a login option at the top
5. Sign in (you can use anonymous sign-in)
6. Fill out the form and save
7. Refresh the page - data should persist
8. Try on a different device (same Firebase project)

## 🌍 Deploy to Internet (Optional)

To make it accessible from anywhere:

### **Option A: Deploy to Vercel (Easiest)**

1. Push your code to GitHub
2. Go to [Vercel.com](https://vercel.com)
3. Sign in with GitHub
4. Click "Import Project" and select your repository
5. Add environment variables:
   - Copy all values from your `.env.local`
   - Paste in Vercel's "Environment Variables" section
6. Click "Deploy"
7. Your app will be live at `your-project.vercel.app`

### **Option B: Deploy to Netlify**

1. Push your code to GitHub
2. Go to [Netlify.com](https://netlify.com)
3. Click "Import an existing project"
4. Connect GitHub and select your repository
5. Add environment variables in "Build & Deploy > Environment"
6. Click "Deploy"

## ✨ Features Now Enabled

- ✅ Cloud storage - data saved in Firebase
- ✅ Multi-device sync - access data from any device
- ✅ User authentication - each user's data is private
- ✅ Form history - all saved forms are preserved
- ✅ Easy backup - Firebase handles backups automatically
- ✅ No paid tier needed - free plan is sufficient

## 🆘 Troubleshooting

**"Firebase Config is empty"**
- Make sure `.env.local` file exists with all variables
- Restart the dev server after creating `.env.local`

**"Permission denied"**
- Check Firestore rules are published correctly
- Ensure user is authenticated (sign in)

**"Database not created"**
- Go to Firebase Console > Firestore Database
- Click "Create database"

**"Forms not saving"**
- Check browser console for errors (F12)
- Verify Firestore is enabled in Firebase Console
- Check that `.env.local` has correct values

## 📚 Next Steps

Once this is working, you can add:
- Email/password authentication instead of anonymous
- Cloud backup of PDF exports
- Sharing forms with other therapists
- Activity logging and audit trail
- Advanced search and filtering

---

**Questions?** Check Firebase docs: https://firebase.google.com/docs/firestore/quickstart
