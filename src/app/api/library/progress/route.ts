import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { libraryService } from "@backend/modules/library/application/library-service";
import { BookFormat } from "@prisma/client";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const { bookId, format, locator, percentage } = await req.json();

    if (!bookId || !format || locator === undefined || percentage === undefined) {
      throw AppError.badRequest("bookId, format, locator, and percentage are required");
    }

    const progress = await libraryService.saveProgress({
      userId: user.id,
      bookId,
      format: format as BookFormat,
      locator: String(locator),
      percentage: Number(percentage),
    });

    return NextResponse.json({ progress }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/library/progress");
  }
}

