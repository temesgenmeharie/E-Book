import { NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { canModerateContent } from "@backend/modules/identity/domain/rbac";
import { moderationService } from "@backend/modules/moderation/application/moderation-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function GET() {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!canModerateContent(user)) {
      throw AppError.forbidden("Access denied: Content moderator role required.");
    }

    const queue = await moderationService.getQueue();
    return NextResponse.json({ queue }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/moderation/queue");
  }
}

