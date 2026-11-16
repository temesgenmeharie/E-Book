import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { registerSchema } from "@backend/modules/identity/application/dto";
import { setSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { toProblemResponse, AppError } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parseResult.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(issue.message);
      }
      throw AppError.badRequest("Validation failed", fieldErrors);
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const sessionResponse = await authService.register(parseResult.data, {
      ipAddress,
      userAgent,
    });

    setSessionCookie(sessionResponse.sessionToken);

    return NextResponse.json(
      {
        user: sessionResponse.user,
        message: "Registration successful",
      },
      { status: 201 }
    );
  } catch (error) {
    return toProblemResponse(error, "/api/auth/register");
  }
}

