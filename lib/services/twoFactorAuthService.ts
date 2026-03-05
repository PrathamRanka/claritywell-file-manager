/**
 * 2FA (Two-Factor Authentication) Service using TOTP
 * Requires 'speakeasy' library for TOTP generation
 * Install with: npm install speakeasy qrcode
 */

const TOTP_WINDOW = 1; // Allow ±30 seconds
const SECRET_LENGTH = 32;

/**
 * Generate a TOTP secret for 2FA setup
 */
export function generate2FASecret(email: string) {
  try {
    // This requires the speakeasy library
    // For now, we'll provide a structure that can be implemented with the library
    const secret = generateRandomSecret(SECRET_LENGTH);

    return {
      secret,
      qrCodeUrl: `otpauth://totp/${email}?secret=${secret}`,
      manualEntry: secret,
    };
  } catch (error) {
    console.error('2FA secret generation error:', error);
    throw new Error('Failed to generate 2FA secret');
  }
}

/**
 * Verify TOTP token
 */
export function verify2FAToken(secret: string, token: string): boolean {
  try {
    // This requires the speakeasy library for proper TOTP verification
    // For now, we provide a basic structure
    if (!secret || !token || token.length !== 6) {
      return false;
    }

    // TODO: Implement proper TOTP verification with speakeasy
    // const verified = speakeasy.totp.verify({
    //   secret: secret,
    //   encoding: 'base32',
    //   token: token,
    //   window: TOTP_WINDOW,
    // });

    // Placeholder: Always return false until speakeasy is installed
    return false;
  } catch (error) {
    console.error('2FA verification error:', error);
    return false;
  }
}

/**
 * Generate random secret (placeholder - requires crypto)
 */
function generateRandomSecret(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 alphabet
  let secret = '';

  try {
    const randomValues = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomValues);
    } else {
      // Fallback for Node.js
      const { randomBytes } = require('crypto');
      const buffer = randomBytes(length);
      for (let i = 0; i < length; i++) {
        randomValues[i] = buffer[i];
      }
    }

    for (let i = 0; i < length; i++) {
      secret += chars[randomValues[i] % chars.length];
    }
  } catch (error) {
    // Fallback to Math.random
    for (let i = 0; i < length; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return secret;
}

/**
 * Generate backup codes for account recovery (typically 10 codes)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    codes.push(code.toUpperCase());
  }

  return codes;
}

/**
 * Format backup codes for display
 */
export function formatBackupCodes(codes: string[]): string {
  return codes.map((code, index) => `${index + 1}. ${code}`).join('\n');
}

/**
 * Verify and consume a backup code
 */
export function verifyBackupCode(code: string, backupCodes: string[]): boolean {
  return backupCodes.includes(code.toUpperCase());
}

/**
 * Remove a used backup code
 */
export function consumeBackupCode(code: string, backupCodes: string[]): string[] {
  return backupCodes.filter((c) => c !== code.toUpperCase());
}
