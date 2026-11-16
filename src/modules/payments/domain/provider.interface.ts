import { PaymentProvider } from "@prisma/client";
import Decimal from "decimal.js";

export interface InitializePaymentParams {
  orderId: string;
  orderNumber: string;
  amount: Decimal;
  currency: string;
  customerEmail: string;
  customerName: string;
  returnUrl: string;
}

export interface InitializePaymentResult {
  providerReference: string;
  redirectUrl: string;
}

export interface WebhookVerificationResult {
  eventId: string;
  eventType: string;
  orderId: string;
  providerReference: string;
  amount: Decimal;
  currency: string;
  isSuccess: boolean;
  metadata?: Record<string, any>;
}

export interface IPaymentProviderAdapter {
  readonly provider: PaymentProvider;

  initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResult>;

  verifyWebhook(
    headers: Record<string, string>,
    rawPayload: string | Record<string, any>
  ): Promise<WebhookVerificationResult>;
}
