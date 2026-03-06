import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generate2FASecret, generateBackupCodes, formatBackupCodes } from '@/lib/services/twoFactorAuthService';

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
