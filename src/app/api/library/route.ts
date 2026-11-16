import { NextResponse } from "next/server";
import { authService } from "@/modules/identity/application/auth-service";
import { getSessionCookie } from "@/modules/identity/infrastructure/session-cookie";
import { libraryService } from "@/modules/library/application/library-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function GET() {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const library = await libraryService.getUserLibrary(user.id);
    return NextResponse.json({ library }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/library");
  }
}
