import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  checkCredentials,
  createSession,
} from "../../../lib/auth";

export async function POST(req: NextRequest) {
  let username = "";
  let password = "";
  try {
    const body = await req.json();
    username = String(body.username ?? "");
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!checkCredentials(username, password)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = await createSession(username);
  if (!token) {
    // SESSION_SECRET não configurado -> fail closed
    return NextResponse.json({ ok: false, config: false }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
