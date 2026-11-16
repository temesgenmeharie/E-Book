import { NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { orderService } from "@backend/modules/orders/application/order-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    const order = await orderService.getOrderById(params.id, user.id);
    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, `/api/orders/${params.id}`);
  }
}

