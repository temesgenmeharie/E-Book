/**
 * Backend Facade & Domain Service Exports
 * Unified domain and application layer entry points
 */

export * from "./modules/identity/application/auth-service";
export * from "./modules/identity/domain/rbac";
export * from "./modules/identity/infrastructure/session-cookie";

export * from "./modules/sellers/application/seller-service";
export * from "./modules/catalog/application/catalog-service";
export * from "./modules/catalog/application/discovery-service";
export * from "./modules/moderation/application/moderation-service";
export * from "./modules/cart/application/cart-service";
export * from "./modules/orders/application/order-service";
export * from "./modules/payments/application/payment-service";
export * from "./modules/library/application/library-service";
export * from "./modules/finance/application/finance-service";
export * from "./modules/engagement/application/engagement-service";
export * from "./modules/admin/application/admin-service";

export * from "./infrastructure/storage/s3";
export * from "../database/client";

