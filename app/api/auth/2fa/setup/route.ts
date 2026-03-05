import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generate2FASecret, generateBackupCodes, formatBackupCodes } from '@/lib/services/twoFactorAuthService';

/**
 * GET /api/auth/2fa/setup
 * Generate 2FA setup information for the authenticated user
 * 
 * Note: This requires updating the User schema to include:
 * - twoFactorSecret: String? (encrypted)
 * - twoFactorEnabled: Boolean @default(false)
 * - twoFactorBackupCodes: String[] (encrypted JSON)
 * 
 * Then run: npx prisma migrate dev --name add_twofactor_auth
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    // Generate 2FA secret and backup codes
    const { secret, qrCodeUrl } = generate2FASecret(session.user.email!);
    const backupCodes = generateBackupCodes(10);

    return NextResponse.json(
      {
        data: {
          secret,
          qrCodeUrl,
          backupCodes,
          backupCodesFormatted: formatBackupCodes(backupCodes),
          message: 'Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy)',
        },
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
