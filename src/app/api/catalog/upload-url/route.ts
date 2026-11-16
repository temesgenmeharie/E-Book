import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { isSeller } from "@backend/modules/identity/domain/rbac";
import {
  generatePresignedUploadUrl,
  BUCKET_PRIVATE,
  BUCKET_PUBLIC,
} from "@/infrastructure/storage/s3";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!isSeller(user) || !user.sellerProfileId) {
      throw AppError.forbidden("Only verified authors or publishers can upload book assets.");
    }

    const { fileType, contentType, originalName } = await req.json();

    if (!fileType || !contentType || !originalName) {
      throw AppError.badRequest("fileType, contentType, and originalName are required.");
    }

    const safeExtension = originalName.split(".").pop() || "bin";
    const randomKey = crypto.randomBytes(16).toString("hex");

    let bucket = BUCKET_PRIVATE;
    let storageKey = "";

    if (fileType === "cover") {
      bucket = BUCKET_PUBLIC;
      storageKey = `covers/${user.sellerProfileId}/${randomKey}.${safeExtension}`;
    } else if (fileType === "book_binary") {
      bucket = BUCKET_PRIVATE;
      storageKey = `books/${user.sellerProfileId}/${randomKey}.${safeExtension}`;
    } else if (fileType === "verification_doc") {
      bucket = BUCKET_PRIVATE;
      storageKey = `kyc/${user.sellerProfileId}/${randomKey}.${safeExtension}`;
    } else {
      throw AppError.badRequest("Invalid fileType. Allowed: cover, book_binary, verification_doc.");
    }

    const uploadUrl = await generatePresignedUploadUrl({
      bucket,
      storageKey,
      contentType,
      expiresInSeconds: 900,
    });

    return NextResponse.json(
      {
        uploadUrl,
        storageKey,
        bucket,
      },
      { status: 200 }
    );
  } catch (error) {
    return toProblemResponse(error, "/api/catalog/upload-url");
  }
}

