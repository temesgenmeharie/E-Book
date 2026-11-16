import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { loginSchema } from "@backend/modules/identity/application/dto";
import { setSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { toProblemResponse, AppError } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      throw AppError.badRequest("Invalid email or password format");
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const sessionResponse = await authService.login(parseResult.data, {
      ipAddress,
      userAgent,
    });

    setSessionCookie(sessionResponse.sessionToken);

    return NextResponse.json(
      {
        user: sessionResponse.user,
        message: "Login successful",
      },
      { status: 200 }
    );
  } catch (error) {
    return toProblemResponse(error, "/api/auth/login");
  }
}

