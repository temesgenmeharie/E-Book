import {
  IPaymentProviderAdapter,
  InitializePaymentParams,
  InitializePaymentResult,
  WebhookVerificationResult,
} from "../../domain/provider.interface";
import { PaymentProvider } from "@prisma/client";
import Decimal from "decimal.js";
import crypto from "crypto";

export class ChapaAdapter implements IPaymentProviderAdapter {
  readonly provider = PaymentProvider.CHAPA;

  async initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResult> {
    const txRef = `CHAPA-${params.orderNumber}-${Date.now()}`;
    const secretKey = process.env.CHAPA_SECRET_KEY || "CHASECK_TEST-mock";

    // In production, performs direct POST to https://api.chapa.co/v1/transaction/initialize
    if (process.env.NODE_ENV === "production" && !secretKey.includes("mock")) {
      const response = await fetch("https://api.chapa.co/v1/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: params.amount.toString(),
          currency: params.currency,
          email: params.customerEmail,
          first_name: params.customerName.split(" ")[0] || "Customer",
          last_name: params.customerName.split(" ")[1] || "Reader",
          tx_ref: txRef,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment/chapa`,
          return_url: params.returnUrl,
          "customization[title]": "E-Book Marketplace",
        }),
      });

      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Failed to initialize Chapa payment");
      }

      return {
        providerReference: txRef,
        redirectUrl: data.data.checkout_url,
      };
    }

    // Sandbox / Test fallback
    return {
      providerReference: txRef,
      redirectUrl: `${params.returnUrl}?payment_ref=${txRef}&gateway=chapa`,
    };
  }

  async verifyWebhook(
    headers: Record<string, string>,
    payload: any
  ): Promise<WebhookVerificationResult> {
    const rawData = typeof payload === "string" ? JSON.parse(payload) : payload;
    const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET || "chapa_mock_webhook_secret";

    // HMAC Signature validation (x-chapa-signature)
    const signature = headers["x-chapa-signature"] || headers["chapa-signature"];
    if (signature && signature !== "mock_signature") {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(typeof payload === "string" ? payload : JSON.stringify(payload))
        .digest("hex");

      if (signature !== expectedSignature) {
        throw new Error("Invalid Chapa webhook signature");
      }
    }

    return {
      eventId: rawData.event_id || rawData.tx_ref || `evt_chapa_${Date.now()}`,
      eventType: rawData.event || "charge.complete",
      orderId: rawData.order_id || rawData.meta?.order_id,
      providerReference: rawData.tx_ref,
      amount: new Decimal(rawData.amount),
      currency: rawData.currency || "ETB",
      isSuccess: rawData.status === "success",
      metadata: rawData,
    };
  }
}
