# Medical Connect App

## Technology Stack

### Frontend
- **React Native** (JavaScript/JSX)
  - Screens: Patient, Doctor, and Lab Owner interfaces
  - Components: FooterNav, various form inputs
- **State Management**: Context API
- **Styling**: React Native StyleSheet

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API Services**: Custom database service layer

### Key Features
- Role-based navigation (Patient, Doctor, Lab Owner)
- Medical records management
- Appointment scheduling
- Test results upload/viewing
- User authentication flows

### File Structure
```
src/
├── screens/          # All application screens
│   ├── Patient/      # Patient-specific screens
│   ├── Doctor/       # Doctor-specific screens  
│   ├── LabOwner/     # Lab owner screens
│   └── Shared/       # Common screens
├── components/       # Reusable components
├── contexts/         # Application state
├── services/         # API/database services
└── styles/           # Global styles
```

## Setup Instructions
1. Install dependencies: `npm install`
2. Configure Supabase credentials
3. Run on Android: `npx react-native run-android`
4. Run on iOS: `npx react-native run-ios`

## Build Instructions
See separate BUILD.md for APK generation steps
