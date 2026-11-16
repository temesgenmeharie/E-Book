import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@backend/modules/payments/application/payment-service";
import { PaymentProvider } from "@prisma/client";
import { toProblemResponse } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const result = await paymentService.processWebhook(
      PaymentProvider.MANUAL_TEST,
      headers,
      body
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/webhooks/payment/manual");
  }
}

