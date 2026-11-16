import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { canModerateContent } from "@backend/modules/identity/domain/rbac";
import { moderationService } from "@backend/modules/moderation/application/moderation-service";
import { reviewActionSchema } from "@backend/modules/moderation/application/dto";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!canModerateContent(user)) {
      throw AppError.forbidden("Access denied: Content moderator role required.");
    }

    const body = await req.json();
    const parseResult = reviewActionSchema.safeParse(body);

    if (!parseResult.success) {
      throw AppError.badRequest("Validation failed", parseResult.error.flatten().fieldErrors);
    }

    const result = await moderationService.reviewBook(user.id, parseResult.data);

    return NextResponse.json(
      {
        result,
        message: `Book ${parseResult.data.action.toLowerCase()}ed successfully.`,
      },
      { status: 200 }
    );
  } catch (error) {
    return toProblemResponse(error, "/api/moderation/review");
  }
}

