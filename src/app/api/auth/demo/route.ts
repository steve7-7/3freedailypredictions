import { NextResponse } from "next/server";
import {
  createSessionRecord,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { ensureDemoUser } from "@/lib/demo";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

async function startDemo() {
  const user = await ensureDemoUser();
  const session = await createSessionRecord(user.id);
  await ensureSeed();
  return { user, session };
}

function wantsJson(req: Request) {
  const accept = req.headers.get("accept") || "";
  const contentType = req.headers.get("content-type") || "";
  return contentType.includes("application/json") || accept.includes("application/json");
}

function withSessionCookie(res: NextResponse, token: string, expiresAt: Date) {
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
}

function dashboardRedirect(req: Request) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const location = host ? `${proto}://${host}/dashboard` : "/dashboard";
  return NextResponse.redirect(location, 303);
}

export async function POST(req: Request) {
  try {
    const { user, session } = await startDemo();
    if (wantsJson(req)) {
      const res = NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
        },
        provider: "demo",
      });
      return withSessionCookie(res, session.token, session.expiresAt);
    }
    return withSessionCookie(
      dashboardRedirect(req),
      session.token,
      session.expiresAt
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not start the demo session." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { session } = await startDemo();
    return withSessionCookie(
      dashboardRedirect(req),
      session.token,
      session.expiresAt
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not start the demo session." },
      { status: 500 }
    );
  }
}
