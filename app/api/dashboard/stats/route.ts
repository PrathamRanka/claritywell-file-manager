import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dashboardStatsService } from '@/lib/services/dashboardService';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await dashboardStatsService();
    const stats = result.data?.stats;
    
    // Return stats in the format expected by the frontend
    return NextResponse.json({
      totalUsers: stats?.userCount || 0,
      totalDocuments: stats?.documentCount || 0,
      totalDepartments: stats?.departmentCount || 0,
      totalRequirements: stats?.requirementCount || 0,
    });
  } catch (error) {
    console.error('GET Dashboard Stats Error:', error);
    return NextResponse.json({ 
      totalUsers: 0,
      totalDocuments: 0,
      totalDepartments: 0,
      totalRequirements: 0,
    }, { status: 500 });
  }
}
