import { NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { canModerateContent } from "@backend/modules/identity/domain/rbac";
import { moderationService } from "@backend/modules/moderation/application/moderation-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function GET(
  _req: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!canModerateContent(user)) {
      throw AppError.forbidden("Access denied: Moderator role required.");
    }

    const history = await moderationService.getModerationHistory(params.bookId);
    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, `/api/moderation/history/${params.bookId}`);
  }
}

