# Privacy Policy

**App:** Flash  
**Bundle ID:** com.climbing.flashApp  
**Effective Date:** May 25, 2026  
**Last Updated:** May 25, 2026  
**Contact:** talharhol@gmail.com

---

## 1. Introduction

Flash ("we," "our," or "us") is a mobile application that allows climbers to photograph gym walls, mark holds, compose bouldering routes ("problems"), and track their climbing progress. This Privacy Policy explains what personal data we collect, why we collect it, how we use and protect it, and your rights regarding that data.

By downloading, installing, or using Flash, you agree to the practices described in this policy. If you do not agree, do not use the app.

---

## 2. Information We Collect

### 2.1 Account Information

When you create an account via Google Sign-In or Apple Sign-In, we receive:

- **Name** — as provided by your identity provider or set by you in-app
- **Email address** — from your identity provider, used solely for authentication and account recovery
- **Profile photo** — optionally set by you; stored on Firebase Storage
- **User ID** — a unique identifier assigned at account creation

We do not receive your identity provider password. Authentication is handled entirely by Google or Apple.

### 2.2 Wall and Route Content

When you create walls and climbing problems, we collect:

- **Wall photographs** — images you capture or upload of gym walls, stored on Firebase Storage
- **Hold data** — SVG path coordinates of holds you mark or that our ML model detects on your wall images
- **Wall metadata** — name, gym name, angle, version, and whether the wall is public or private
- **Problem metadata** — name, grade, hold selection, problem type, and whether the problem is public or private
- **Setter identity** — your user ID is associated with walls and problems you create

### 2.3 Location Data

If you grant location permission, we collect:

- **Approximate or precise location** — a single GPS coordinate (latitude/longitude) that you explicitly attach to a wall to help others find it
- Location is **optional**. You can create and use walls without granting location access.
- We do **not** track your location continuously or in the background.

### 2.4 Activity Data (Ticks)

We collect records of your interactions with problems:

- Problem ID, your user ID, tick tag (e.g., "sent," "attempted," "project"), and timestamp

### 2.5 Group Membership

When you join or create a group:

- Group name, member list (user IDs), and which walls/problems belong to the group

### 2.6 Technical and Usage Data

We automatically collect:

- **Device type and OS version** — for crash diagnostics and compatibility
- **App version and runtime version** — via Expo EAS Updates
- **Crash logs and error reports** — anonymized stack traces
- **Login count** — stored locally, used only to personalize onboarding

We do **not** collect advertising identifiers, behavioral analytics, or browsing history.

---

## 3. How We Use Your Information

| Purpose | Legal Basis (GDPR) |
|---|---|
| Provide and operate core app features | Performance of contract |
| Sync your data across devices | Performance of contract |
| Display public walls and problems to other users | Legitimate interests |
| Enable group sharing and collaboration | Performance of contract |
| Allow other users to search and discover public walls | Legitimate interests |
| Improve ML hold-detection accuracy (on-device only) | N/A — processed locally, never uploaded |
| Send app updates via Expo EAS (bug fixes, improvements) | Legitimate interests |
| Respond to support requests | Legitimate interests |
| Comply with legal obligations | Legal obligation |

We do **not** use your data for advertising, profiling, or sale to third parties.

---

## 4. On-Device Machine Learning

Flash uses two TFLite models (MobileSAM encoder and decoder) to detect climbing holds from a tap point on a wall image. This inference runs **entirely on your device**. Wall images and tap coordinates are **never** sent to our servers or any third-party ML service for hold detection. The only images uploaded are the wall photos you explicitly choose to make public or share in a group.

---

## 5. How We Share Your Information

We do **not** sell or rent your personal data. We share data only as follows:

### 5.1 Other Flash Users

- **Public walls:** name, gym, angle, hold data, and attached location (if set) are visible to all Flash users.
- **Public problems:** name, grade, hold selection, and setter display name are visible to all Flash users.
- **Group content:** walls and problems shared with a group are visible to group members only.
- **Profile:** your display name and profile photo are visible to users who view your public content.
- **Private walls and problems** are never exposed to other users.

### 5.2 Service Providers

We use the following third-party infrastructure providers who process data on our behalf under data processing agreements:

| Provider | Purpose | Data Shared | Privacy Policy |
|---|---|---|---|
| **Google Firebase (Firestore)** | Cloud database — stores wall, problem, group, user, and tick records | Structured data (no raw images) | https://firebase.google.com/support/privacy |
| **Google Firebase (Storage)** | Stores wall photos and profile images | Image files | https://firebase.google.com/support/privacy |
| **Google Firebase (Authentication)** | Manages sign-in sessions and identity linking | User ID, email, auth tokens | https://firebase.google.com/support/privacy |
| **Google Sign-In** | Third-party OAuth login | User ID, name, email (from Google) | https://policies.google.com/privacy |
| **Apple Sign-In** | Third-party OAuth login | User ID, name, email (from Apple) | https://www.apple.com/legal/privacy/ |
| **Expo (EAS Updates)** | Delivers over-the-air app updates | Anonymous device/runtime identifiers | https://expo.dev/privacy |

All providers are contractually prohibited from using your data for their own purposes beyond service delivery.

### 5.3 Legal Requirements

We may disclose data if required by law, court order, or to protect the rights, property, or safety of Flash users or the public. We will notify you when legally permitted to do so.

---

## 6. Data Storage and Retention

- **Local storage:** App data (walls, problems, ticks) is cached in a SQLite database on your device. Uninstalling the app deletes this data.
- **Remote storage:** Data synced to Firebase is retained for as long as your account is active.
- **Account deletion:** You may request deletion of your account and all associated remote data at any time by emailing talharhol@gmail.com. We will complete deletion within 30 days. Local data is removed when you uninstall the app.
- **Images:** Wall photos and profile images stored on Firebase Storage are deleted upon account deletion or when you remove the associated wall.

---

## 7. Data Security

We implement the following technical and organizational measures:

- All data in transit between the app and Firebase is encrypted via TLS 1.2+.
- Firebase Storage and Firestore enforce authentication-based access controls — unauthenticated users cannot read or write data.
- Private walls and problems are protected by Firestore Security Rules that restrict access to their owner.
- ML processing happens on-device; wall images are not transmitted to external ML services.
- We follow Firebase's recommended security configuration, including App Check.

No system is 100% secure. If you discover a security vulnerability, please report it to talharhol@gmail.com.

---

## 8. Your Rights

Depending on your jurisdiction, you may have the following rights:

### 8.1 All Users

- **Access:** Request a copy of the personal data we hold about you.
- **Correction:** Request correction of inaccurate data.
- **Deletion:** Request deletion of your account and associated data.
- **Portability:** Request your data in a machine-readable format.
- **Objection:** Object to processing based on legitimate interests.

### 8.2 European Economic Area / UK (GDPR / UK GDPR)

In addition to the above, you have the right to:

- Lodge a complaint with your local data protection authority (e.g., your national DPA).
- Withdraw consent at any time where processing is based on consent.

Our lawful bases for processing are: performance of contract, legitimate interests (described in Section 3), and legal obligation.

### 8.3 California Residents (CCPA / CPRA)

Flash does **not** sell or share your personal information for cross-context behavioral advertising. You have the right to:

- Know what personal information is collected and how it is used.
- Delete your personal information.
- Correct inaccurate personal information.
- Non-discrimination for exercising your privacy rights.

We do not process sensitive personal information beyond what is described in this policy.

To exercise any right, email talharhol@gmail.com. We will respond within 30 days (GDPR) or 45 days (CCPA).

---

## 9. Children's Privacy

Flash is not directed to children under 13 (or under 16 in the EEA/UK). We do not knowingly collect personal data from children under these ages. If we become aware that a child under 13 has created an account, we will delete that account and associated data promptly.

If you believe a child has provided us with personal information, contact us at talharhol@gmail.com.

---

## 10. Location Data — Additional Detail

- Location permission is requested with the explanation: "Allow Flash to use your location to tag walls and find walls near you."
- Location is only accessed when you explicitly choose to tag a wall with your current location — we do not access it at any other time.
- Location is stored as a single GeoPoint (latitude/longitude) associated with the wall record in Firestore.
- You can remove location data from a wall at any time by editing the wall.
- We do **not** use location for targeted advertising or sell location data to any party.

---

## 11. Third-Party Links and Integrations

Flash may display gym names or reference climbing gym locations. We do not control third-party websites, gyms, or services. This policy does not apply to third-party services you access outside the app.

---

## 12. Changes to This Policy

We may update this policy to reflect changes in our practices or applicable law. We will notify you of material changes by updating the "Last Updated" date and, where required by law, by in-app notice or email. Continued use of Flash after a change constitutes acceptance of the updated policy.

---

## 13. Contact

For privacy questions, rights requests, or to report a concern:

**Email:** talharhol@gmail.com  
**Response time:** within 30 days
