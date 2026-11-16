import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/modules/identity/application/auth-service";
import { getSessionCookie } from "@/modules/identity/infrastructure/session-cookie";
import { engagementService } from "@/modules/engagement/application/engagement-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const { bookId, rating, comment } = await req.json();
    if (!bookId || rating === undefined) {
      throw AppError.badRequest("bookId and rating are required");
    }

    const review = await engagementService.addReview(
      user.id,
      bookId,
      Number(rating),
      comment
    );

    return NextResponse.json(
      { review, message: "Review posted successfully" },
      { status: 201 }
    );
  } catch (error) {
    return toProblemResponse(error, "/api/engagement/reviews");
  }
}
