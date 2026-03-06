import { withRouteMetrics } from '@/lib/utils/route-metrics';
import { authOptions } from "@/auth";
import NextAuth from "next-auth";

const handler = NextAuth(authOptions);

export const GET = withRouteMetrics('/api/auth/[...nextauth]', 'GET', handler);
export const POST = withRouteMetrics('/api/auth/[...nextauth]', 'POST', handler);
