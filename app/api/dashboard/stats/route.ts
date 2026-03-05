import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dashboardStatsService } from '@/lib/services/dashboardService';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const result = await dashboardStatsService();
    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('GET Dashboard Stats Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
