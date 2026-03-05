# 2FA (Two-Factor Authentication) Implementation Guide

## Overview
This guide explains how to complete the 2FA implementation for DocVault. The foundation is in place with services and API endpoints prepared. Follow the steps below to fully enable 2FA.

## Database Schema Changes

### Step 1: Update Prisma Schema
Add these fields to the `User` model in `prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields ...
  
  // 2FA fields
  twoFactorSecret        String?    // Encrypted TOTP secret
  twoFactorEnabled       Boolean    @default(false)
  twoFactorBackupCodes   String?    // JSON array of backup codes (encrypted)
  
  // ... rest of model ...
}
```

### Step 2: Create Migration
```bash
npx prisma migrate dev --name add_twofactor_auth
```

## Installation

### Step 1: Install Required Library
```bash
npm install speakeasy qrcode
npm install -D @types/speakeasy
```

### Step 2: Update 2FA Service
Replace the placeholder implementation in `lib/services/twoFactorAuthService.ts` with:

```typescript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function generate2FASecret(email: string) {
  const secret = speakeasy.generateSecret({
    name: `DocVault (${email})`,
    issuer: 'DocVault',
    length: 32,
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCodeUrl: qrCode,
    manualEntry: secret.base32,
  };
}

export function verify2FAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });
}
```

## API Endpoints

### 1. GET /api/auth/2fa/setup
**Purpose**: Generate 2FA setup information
**Response**:
```json
{
  "data": {
    "secret": "JBSWY3DPEBLW64TMMQ==",
    "qrCodeUrl": "data:image/png;base64,...",
    "backupCodes": ["ABC12345", "DEF67890", ...],
    "message": "Scan the QR code..."
  }
}
```

### 2. POST /api/auth/2fa/enable
**Purpose**: Enable 2FA with verification
**Request**:
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ==",
  "token": "123456",
  "backupCodes": ["ABC12345", ...]
}
```

### 3. POST /api/auth/2fa/disable
**Purpose**: Disable 2FA
**Request**:
```json
{
  "password": "user-password"
}
```

### 4. POST /api/auth/2fa/verify
**Purpose**: Verify 2FA during login
**Request**:
```json
{
  "email": "user@example.com",
  "token": "123456"
}
```

## Frontend Implementation

### 1. 2FA Setup Page
Create a page at `/app/settings/2fa/page.tsx` with:
- QR code display
- Manual entry option
- Verification input
- Backup codes display and download

### 2. Login 2FA Flow
Update `/app/login/page.tsx` to:
- Show 2FA input if enabled for user
- Handle backup code entry
- Store session after 2FA verification

### 3. Settings Page
Add 2FA management:
- Enable/disable toggle
- View backup codes
- Regenerate backup codes
- View last verified date

## Security Considerations

1. **Secret Storage**: Encrypt secrets at rest using environment key
2. **Backup Codes**: Store encrypted, hash-verified
3. **Rate Limiting**: Implement rate limiting on verification attempts
4. **Recovery**: Provide email recovery if TOTP device is lost
5. **Session**: Store 2FA verified status in session

## Implementation Example

```typescript
// Enable 2FA
export async function enable2FA(userId: string, secret: string, token: string) {
  // 1. Verify token
  if (!verify2FAToken(secret, token)) {
    throw new Error('Invalid 2FA token');
  }

  // 2. Generate backup codes
  const backupCodes = generateBackupCodes(10);

  // 3. Encrypt and store
  const encryptedSecret = encryptSecret(secret);
  const encryptedCodes = encryptBackupCodes(backupCodes);

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: encryptedSecret,
      twoFactorEnabled: true,
      twoFactorBackupCodes: encryptedCodes,
    },
  });

  return {
    success: true,
    backupCodes, // Show to user once, for backup
  };
}
```

## Testing

### Test TOTP Tokens
Use Google Authenticator or Authy:
- Scan QR code
- Generate tokens
- Verify with API

### Backup Codes
- Test valid code usage
- Test invalid code
- Test code consumption

## Status

- ✅ Service: `twoFactorAuthService.ts` created
- ✅ API: `/api/auth/2fa/setup` endpoint ready
- ⏳ Database: Awaiting schema update
- ⏳ Remaining Endpoints: Enable, disable, verify
- ⏳ Frontend: Settings page implementation
- ⏳ Login Flow: 2FA integration

## Next Steps

1. Install `speakeasy` and `qrcode`
2. Update Prisma schema
3. Run migration
4. Complete API endpoints
5. Build frontend components
6. Test end-to-end flow
