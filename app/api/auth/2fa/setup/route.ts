import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generate2FASecret, generateBackupCodes, formatBackupCodes } from '@/lib/services/twoFactorAuthService';

export const dynamic = 'force-dynamic';

async function GETHandler(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return timedJson({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    // Generate 2FA secret and backup codes
    const { secret, qrCodeUrl } = generate2FASecret(session.user.email!);
    const backupCodes = generateBackupCodes(10);

    return timedJson(
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
    return timedJson({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withRouteMetrics('/api/auth/2fa/setup', 'GET', GETHandler);
