import {
  IPaymentProviderAdapter,
  InitializePaymentParams,
  InitializePaymentResult,
  WebhookVerificationResult,
} from "../../domain/provider.interface";
import { PaymentProvider } from "@prisma/client";
import Decimal from "decimal.js";
import crypto from "crypto";

export class ManualTestAdapter implements IPaymentProviderAdapter {
  readonly provider = PaymentProvider.MANUAL_TEST;

  async initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResult> {
    const reference = `MANUAL-${crypto.randomBytes(8).toString("hex")}`;
    return {
      providerReference: reference,
      redirectUrl: `${params.returnUrl}?payment_ref=${reference}&status=success`,
    };
  }

  async verifyWebhook(
    _headers: Record<string, string>,
    payload: any
  ): Promise<WebhookVerificationResult> {
    const data = typeof payload === "string" ? JSON.parse(payload) : payload;

    return {
      eventId: data.eventId || `evt_${crypto.randomBytes(8).toString("hex")}`,
      eventType: "payment.completed",
      orderId: data.orderId,
      providerReference: data.providerReference || "MANUAL_REF",
      amount: new Decimal(data.amount),
      currency: data.currency || "ETB",
      isSuccess: true,
      metadata: data.metadata,
    };
  }
}

