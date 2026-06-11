# Go Disciple

**To know God and make Him known.**

A mobile-first discipleship app for GKDI church members. Built with Expo React Native + Firebase.

---

## Stack

| Layer | Technology |
|---|---|
| Mobile App | Expo React Native (JavaScript) |
| Navigation | Expo Router (file-based) |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| QR Scanner | expo-camera |
| Admin CMS | React + Vite (in `/admin`) |

---

## Project Structure

```
GoDisciple/
├── app/                    # Expo Router screens
│   ├── _layout.js
│   ├── index.js            # Auth redirect entry point
│   ├── auth/
│   │   ├── login.js
│   │   └── register.js
│   ├── tabs/               # Main bottom tab screens
│   │   ├── _layout.js
│   │   ├── home.js
│   │   ├── group.js
│   │   ├── stream.js
│   │   ├── schedule.js
│   │   └── profile.js
│   ├── group/
│   │   ├── [id].js         # Group detail
│   │   ├── requests.js     # Join requests (leader)
│   │   └── manage.js       # Edit group (leader)
│   ├── stream/
│   │   ├── [id].js         # Post detail + comments
│   │   └── create.js       # New post
│   ├── bible-theme/
│   │   ├── index.js        # Theme list
│   │   └── [id].js         # Theme detail
│   ├── checkin/
│   │   └── scanner.js      # QR scanner
│   └── profile/
│       ├── edit.js
│       └── claim-code.js
├── src/
│   ├── components/         # Reusable UI components
│   ├── constants/          # Colors, typography, spacing
│   ├── context/            # AuthContext
│   ├── firebase/           # Firebase config
│   ├── hooks/              # useAuth
│   ├── services/           # Firestore service functions
│   └── utils/              # Date helpers, seed data
├── admin/                  # Web admin CMS (React + Vite)
├── firestore.rules         # Firestore security rules
├── .env.example
└── app.json
```

---

## Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd GoDisciple
npm install
```

### 2. Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (e.g. `go-disciple`)
3. Enable **Authentication** → Sign-in methods → **Email/Password** ✓
4. Enable **Authentication** → Sign-in methods → **Google** ✓ *(see note below)*
5. Create **Firestore Database** → Start in **production mode**
6. Create **Storage** bucket

### 3. Get Firebase Config

In Firebase Console → Project Settings → Your apps → Add Web App.

Copy the config values.

### 4. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` and fill in your Firebase values:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Deploy Firestore Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # Select your project
firebase deploy --only firestore:rules
```

Or paste the contents of `firestore.rules` manually into the Firebase Console → Firestore → Rules tab.

### 6. Run the Mobile App

```bash
npm start
# or
npx expo start
```

Scan the QR code with **Expo Go** (iOS / Android).

---

## Admin CMS

The admin dashboard is a separate React + Vite web app in `/admin`.

### Setup Admin

```bash
cd admin
cp .env.example .env   # Fill in same Firebase values, but with VITE_ prefix
npm install
npm run dev            # Runs on http://localhost:5173
```

Admin login uses the same Firebase Auth. Only users with `role: admin` can access all features. Leaders/coLeaders can access group management features.

### Admin Features

- 📊 Dashboard with live stats
- 🖼 Manage home banners
- 📰 Manage news articles
- 📖 Manage Bible themes (set active theme)
- 📅 Manage schedules & events
- 👥 Manage groups
- 🔑 Generate leader claim codes
- 📋 View all join requests
- ✅ View attendance records
- ✨ Moderate stream posts
- 👤 Manage user roles

---

## Features

### Authentication
- Email + password register & login
- User profile stored in Firestore on register
- Role-based access: `member | leader | coLeader | admin`

### Home Screen
- Hero banner (CMS-managed)
- Quick action buttons (Scan QR, Schedule, Stream, Groups)
- Current Bible theme card
- Church news cards
- Upcoming schedules
- Group previews

### Groups
- Browse all groups
- Request to join → leader approves/rejects
- Group detail: leader, co-leaders, members, discipleship tree
- Leaders can edit group details and manage requests

### Leader Claim Code Flow
1. Admin generates a code in the Admin CMS
2. Leader enters code in Profile → Claim Leader Code
3. User's role is updated to `leader` or `coLeader`
4. User is assigned to the group linked to the code

### Stream
- Public feed of posts (reflection, testimony, prayer, etc.)
- Like and comment on posts
- Filter by category
- Create posts with visibility control (public or group-only)

### Schedule
- Browse church services, group meetings, events, training
- Grouped by date
- Filter by type

### Bible Theme
- View current and past Bible themes
- Scripture reference, text, description, and date range

### QR Check-In
- Scan QR codes with camera
- Validates against Firestore event data
- Prevents duplicate check-ins
- Records attendance with timestamp

### Profile
- View and edit profile photo, name, phone
- Claim leader code
- Leader shortcuts (manage group, pending requests, attendance)

---

## Firestore Data Model

```
users/{uid}
groups/{id}
groupJoinRequests/{id}
discipleshipRelations/{id}
leaderClaimCodes/{code}
banners/{id}
news/{id}
bibleThemes/{id}
schedules/{id}
events/{id}              ← used for QR check-in
attendance/{id}
streamPosts/{id}
streamComments/{id}
streamLikes/{postId_userId}
appSettings/main
```

### QR Code Format

Event QR codes must contain JSON in this format:

```json
{
  "eventId": "your-event-doc-id",
  "checkInCode": "SECRET_CODE_HERE"
}
```

Events must be stored in the `events` collection with a `checkInCode` field matching the QR value.

---

## Google Sign-In Setup

Google Sign-In **requires a native development build** and cannot run in Expo Go.

### Steps to enable:

1. In Firebase Console → Authentication → Google → Enable and add your SHA-1 key (Android) and bundle ID (iOS)
2. Install the required packages:
   ```bash
   npx expo install expo-auth-session expo-web-browser
   ```
3. For a full native integration, use `@react-native-google-signin/google-signin` with a development build:
   ```bash
   npx expo install @react-native-google-signin/google-signin
   npx expo prebuild
   ```
4. Add your Google client IDs to `.env`
5. Wire up `GoogleAuthProvider.credential()` to Firebase Auth

The code structure in `src/services/authService.js` is ready for this integration.

---

## Seed Data

Sample data is documented in `src/utils/seedData.js`.

To seed your database, either:
- Use the Admin CMS web app to create content manually
- Copy the data into Firebase Console → Firestore manually
- Use Firebase Admin SDK in a Node.js script

### Creating your first Admin user

1. Register in the mobile app normally
2. Go to Firebase Console → Firestore → `users` collection
3. Find your user document → change `role` to `"admin"`
4. Sign back in to the Admin CMS

---

## Environment Variables Reference

### Mobile App (`.env`)
```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

### Admin CMS (`admin/.env`)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

---

## Manual Firebase Console Steps Required

| Task | Where |
|---|---|
| Enable Email/Password auth | Firebase Console → Auth → Sign-in methods |
| Enable Google auth | Firebase Console → Auth → Sign-in methods |
| Set Firestore to production mode | Firebase Console → Firestore |
| Configure Storage rules | Firebase Console → Storage → Rules |
| Set first admin role | Firebase Console → Firestore → users → your doc → role = "admin" |
| Create events with checkInCode | Firebase Console → Firestore → events |

---

## Development Phases

- ✅ Phase 1: Project setup, Firebase, Auth, main tabs
- ✅ Phase 2: Home CMS content, Groups, Profile
- ✅ Phase 3: Stream feed, likes, comments, filters
- ✅ Phase 4: Schedule, Bible Theme
- ✅ Phase 5: QR scanner, attendance
- ✅ Phase 6: Admin CMS (React + Vite)
- ✅ Phase 7: Firestore rules, seed data, README

---

Built with ♥ for GKDI · Go Disciple v1.0.0
