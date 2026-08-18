# Android APK Build Instructions

## Prerequisites
- Android Studio installed
- Java JDK 11 or higher
- Android SDK installed

## Build Steps

### 1. Open Android Project
```bash
cd d:\Codes\aljinan
npx cap open android
```

### 2. Build APK in Android Studio
1. Wait for Gradle sync to complete
2. Go to: Build → Build Bundle(s) / APK(s) → Build APK(s)
3. Wait for build to complete
4. APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

### 3. Sign APK (Production)
For production release:
1. Build → Generate Signed Bundle / APK
2. Select APK
3. Create or use existing keystore
4. Fill in keystore details
5. Select release build variant
6. Build

### 4. Test APK
```bash
# Install on connected device
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Configuration
- App opens: https://www.tasheel.live
- App ID: sa.tasheel.app
- App Name: Tasheel
- Persistent login via WebView cookies

## Upload to AWS S3
After building, upload APK to AWS S3:
```bash
aws s3 cp android/app/build/outputs/apk/release/app-release.apk s3://your-bucket/downloads/tasheel-android.apk --acl public-read
```

## Notes
- Debug APK is for testing only
- Production APK must be signed with release keystore
- Keep keystore file safe - needed for all future updates
