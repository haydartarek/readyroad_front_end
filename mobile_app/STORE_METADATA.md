# ReadyRoad Store Metadata

## App Information

**App Name**: ReadyRoad  
**Package Name (Android)**: com.readyroad.mobile_app  
**Bundle ID (iOS)**: com.readyroad.mobile-app  
**Version**: 1.0.0 (Build 1)

---

## Short Description (80 characters max)

Master your Belgian driving license exam with ReadyRoad - comprehensive prep!

---

## Full Description

### English

ReadyRoad is the ultimate Belgian driving license exam preparation platform. Our comprehensive app provides:

✅ **Complete Exam Preparation**

- Full question bank with detailed explanations
- Official Belgian traffic signs with multilingual descriptions
- Practice tests tailored to your weak areas
- Realistic exam simulations

🎯 **Smart Learning**

- Analytics tracking your progress
- Weak area identification
- Error pattern analysis
- Personalized study recommendations

🌐 **Multilingual Support**

- English, Arabic, Dutch, and French
- Full RTL support for Arabic
- Localized content for all languages

📚 **Comprehensive Content**

- Interactive lessons
- Traffic sign categories (A-Z series)
- Practice by category
- Favorites and bookmarking

🔐 **Secure & Private**

- Secure authentication
- Privacy-first design
- No data selling
- GDPR compliant

Start your journey to passing the Belgian driving license exam today!

### Arabic (العربية)

ReadyRoad هو التطبيق الشامل للتحضير لامتحان رخصة القيادة البلجيكية.

### Dutch (Nederlands)

ReadyRoad is het ultieme platform voor het voorbereiden van het Belgisch rijbewijs examen.

### French (Français)

ReadyRoad est la plateforme ultime de préparation à l'examen du permis de conduire belge.

---

## Categories

- Education
- Productivity
- Reference

---

## Keywords

Belgian driving license, driving exam, traffic signs, Belgium, practice test, exam preparation, verkeersborden, permis de conduire, إشارات المرور, rijbewijs

---

## Screenshots Required

1. **Main Dashboard** (showing exam progress)
2. **Traffic Signs** (showing category selection)
3. **Practice Test** (showing question with image)
4. **Analytics** (showing progress charts)
5. **Lessons** (showing lesson content)
6. **Exam Simulation** (showing exam in progress)
7. **Multi-language** (showing Arabic RTL interface)

---

## Privacy Policy URL

**Required**: <https://readyroad.be/privacy-policy>

**Note**: Must create privacy policy page before store submission.

**Content Requirements**:

- Data collection practices
- Authentication and user data handling
- Analytics (if any)
- Third-party services
- User rights (GDPR)
- Contact information

---

## Support & Contact

**Website**: <https://readyroad.be>  
**Support Email**: <support@readyroad.be>  
**Privacy Email**: <privacy@readyroad.be>

---

## Content Rating

**Target Age**: 16+ (driving age requirement)

**Content Rating Questionnaire**:

- Violence: None
- Sexual Content: None
- Profanity: None
- Drugs/Alcohol: None
- Gambling: None

---

## Permissions Justification

### Android

**INTERNET** (android.permission.INTERNET)

- **Purpose**: Required for API calls to backend server
- **User-facing explanation**: "This app requires internet access to sync your progress, fetch exam questions, and load traffic sign images."

### iOS

**No special permissions required**

---

## Deep Links Configuration

### Custom Scheme

- **Android**: `readyroad://`
- **iOS**: `readyroad://`
- **Example**: `readyroad://exam` opens exam screen

### Universal Links (Android App Links / iOS Universal Links)

- **Domain**: `https://readyroad.com`
- **Verified**: Yes (android:autoVerify="true")
- **iOS Associated Domains**: `applinks:readyroad.com`

**Verification Files Required**:

- Android: `https://readyroad.com/.well-known/assetlinks.json`
- iOS: `https://readyroad.com/.well-known/apple-app-site-association`

---

## Release Build Configuration

### Android Signing

**Keystore Requirements**:

- Keystore file: `readyroad-release-key.jks` (keep secure, never commit)
- Key alias: `readyroad`
- Validity: 25+ years

**Generate Keystore**:

```bash
keytool -genkey -v -keystore readyroad-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias readyroad
```

**key.properties** (create in `android/` folder, add to .gitignore):

```
storePassword=<your-store-password>
keyPassword=<your-key-password>
keyAlias=readyroad
storeFile=../readyroad-release-key.jks
```

### iOS Signing

**Requirements**:

- Apple Developer Program membership ($99/year)
- Bundle ID registered: `com.readyroad.mobile-app`
- Development/Distribution certificates
- Provisioning profiles

**Xcode Configuration**:

1. Open `ios/Runner.xcworkspace` in Xcode
2. Select Runner target → Signing & Capabilities
3. Select your development team
4. Automatic signing or manual provisioning profiles

---

## Data Safety (Google Play)

### Data Types Collected

**Account Info**:

- Email address (for authentication)
- Username (user-created)

**App Activity**:

- Exam progress
- Practice test results
- Analytics data (weak areas, error patterns)

**Other**:

- None

### Data Usage

- Used for app functionality
- Not shared with third parties
- Not sold to third parties
- Encrypted in transit
- Can be deleted on request

### Security Practices

- Data encrypted in transit (HTTPS/TLS)
- Data encrypted at rest (database encryption)
- User can request data deletion
- Committed to Google Play Families Policy

---

## App Store Review Notes

**Test Account** (provide for reviewers):

- Username: `reviewer@readyroad.be`
- Password: `ReviewPass2026!`

**Additional Notes**:

- App requires internet connection
- Backend API must be live during review
- All languages tested and functional
- Deep links verified on test domain

---

## Compliance Checklist

- [ ] Privacy policy published at <https://readyroad.be/privacy-policy>
- [ ] Terms of service published at <https://readyroad.be/terms>
- [ ] Data safety questionnaire completed
- [ ] Content rating obtained
- [ ] Screenshots uploaded (7 required)
- [ ] App icons set (all sizes)
- [ ] Feature graphic created (Android)
- [ ] Test account credentials provided
- [ ] Deep link verification files uploaded
- [ ] Release build signed and tested
- [ ] All store metadata translated (4 languages)

---

**Last Updated**: January 29, 2026  
**Store Submission Version**: 1.0.0
