import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/modules/identity/application/auth-service";
import { getSessionCookie } from "@/modules/identity/infrastructure/session-cookie";
import { sellerService } from "@/modules/sellers/application/seller-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function GET() {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const profile = await sellerService.getProfileByUserId(user.id);
    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/sellers/profile");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const body = await req.json();
    const updated = await sellerService.updateProfile(user.id, body);

    return NextResponse.json({ profile: updated }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/sellers/profile");
  }
}
