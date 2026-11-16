import { NextResponse } from "next/server";
import { authService } from "@/modules/identity/application/auth-service";
import {
  getSessionCookie,
  clearSessionCookie,
} from "@/modules/identity/infrastructure/session-cookie";

export async function POST() {
  const token = getSessionCookie();
  if (token) {
    await authService.revokeSession(token);
  }
  clearSessionCookie();

  return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
}
