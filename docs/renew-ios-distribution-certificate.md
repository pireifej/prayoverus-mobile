# Renewing the iOS Distribution Certificate

Apple issues iOS Distribution Certificates with a **1-year expiry**. You'll receive an email from Apple Developer Relations ~30 days before it expires. This guide walks through the renewal using EAS CLI.

---

## When to do this
- You receive an email from Apple: *"Your iOS Distribution Certificate will no longer be valid in 30 days"*
- A build fails with a signing error mentioning an expired certificate

---

## What it affects
- **Does NOT break the live app** — users on the App Store are unaffected
- **Does break new builds** — you won't be able to submit new versions until renewed

---

## Step-by-step

### 1. Log in to EAS
```bash
cd expo-app
eas login
```
Enter your Expo username (`pireifej`) and password when prompted.

---

### 2. Open the credentials manager
```bash
eas credentials
```

---

### 3. Select the platform
```
Select platform › iOS
```

---

### 4. Select the build profile
```
Which build profile do you want to configure? › production
```

---

### 5. Log in to your Apple account
EAS will prompt for your Apple ID (`paul.ireifej@gmail.com`) and password.  
Complete the **two-factor authentication** (6-digit code sent to your trusted device/phone).

---

### 6. Navigate to Build Credentials
```
What do you want to do? › Build Credentials: Manage everything needed to build your project
```

---

### 7. Add a new Distribution Certificate
```
What do you want to do? › Distribution Certificate: Add a new one to your account
```

---

### 8. Confirm the prompts
EAS will ask two confirmation questions — answer **yes** to both:
- `Generate a new Apple Distribution Certificate? › yes`
- `Do you want pray-over-us to use the new Distribution Certificate? › yes`

EAS automatically:
- Generates a new certificate and registers it with Apple
- Creates a new provisioning profile tied to the new certificate

---

### 9. Verify the new expiration date
After completion you'll see the updated credentials summary:

```
Distribution Certificate
  Expiration Date   Mon, 02 Aug 2027 ...   ← should be ~1 year from today
  Updated           10 seconds ago

Provisioning Profile
  Status            active
  Expiration        Mon, 02 Aug 2027 ...
```

---

### 10. Exit
Press any key, then select **Exit** from the menu.

---

## Notes
- The new certificate is valid for **1 year** — set a reminder for next August
- No code changes or OTA push needed — this is purely a signing credential update
- The next time you run `eas build --platform ios --profile production`, it will automatically use the new certificate
- Apple caps iOS Distribution Certificates at **2 active certificates** per team — if you hit the limit, delete the old expiring one from the menu first (`Distribution Certificate: Delete one from your account`), then add a new one

---

## Team info (for reference)
- Team ID: `MC4R3L639K`
- Bundle ID: `com.pireifej.prayoverus`
- Apple ID: `paul.ireifej@gmail.com`
