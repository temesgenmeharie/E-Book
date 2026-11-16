import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { isAdministrator } from "@backend/modules/identity/domain/rbac";
import { adminService } from "@backend/modules/admin/application/admin-service";
import { RoleType } from "@prisma/client";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!isAdministrator(user)) throw AppError.forbidden("Admin privileges required");

    const { role } = await req.json();
    if (!role || !Object.values(RoleType).includes(role)) {
      throw AppError.badRequest("Valid role name is required");
    }

    const assigned = await adminService.assignRole(user.id, params.id, role as RoleType);
    return NextResponse.json({ assigned, message: "Role assigned" }, { status: 201 });
  } catch (error) {
    return toProblemResponse(error, `/api/admin/users/${params.id}/roles`);
  }
}

