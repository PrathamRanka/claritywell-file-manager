import { handlers } from "../../../../auth";
import { rateLimit } from "../../../../lib/rateLimit";
import { NextResponse } from "next/server";

const { GET, POST: AuthPost } = handlers;

export { GET };

export async function POST(req: any) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`auth_post_${ip}`, 10, 60000)) { // 10 requests per minute
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  return AuthPost(req);
}
