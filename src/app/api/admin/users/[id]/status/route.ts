import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { isAdministrator } from "@backend/modules/identity/domain/rbac";
import { adminService } from "@backend/modules/admin/application/admin-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!isAdministrator(user)) throw AppError.forbidden("Admin privileges required");

    const { isActive } = await req.json();
    if (typeof isActive !== "boolean") {
      throw AppError.badRequest("isActive must be a boolean");
    }

    const updated = await adminService.updateUserStatus(user.id, params.id, isActive);
    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, `/api/admin/users/${params.id}/status`);
  }
}

