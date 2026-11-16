import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/modules/identity/application/auth-service";
import { getSessionCookie } from "@/modules/identity/infrastructure/session-cookie";
import { isAdministrator } from "@/modules/identity/domain/rbac";
import { adminService } from "@/modules/admin/application/admin-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function GET(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!isAdministrator(user)) throw AppError.forbidden("Admin privileges required");

    const search = req.nextUrl.searchParams.get("search") || undefined;
    const page = req.nextUrl.searchParams.get("page") ? parseInt(req.nextUrl.searchParams.get("page")!, 10) : 1;

    const result = await adminService.listUsers({ search, page });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/admin/users");
  }
}
