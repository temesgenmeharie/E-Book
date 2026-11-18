import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { isSeller } from "@backend/modules/identity/domain/rbac";
import { s3Client } from "@/infrastructure/storage/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function POST(req: NextRequest) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");
    if (!isSeller(user) || !user.sellerProfileId) {
      throw AppError.forbidden("Only verified authors or publishers can upload book assets.");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const storageKey = formData.get("storageKey") as string | null;
    const bucket = formData.get("bucket") as string | null;

    if (!file || !storageKey || !bucket) {
      throw AppError.badRequest("file, storageKey, and bucket are required.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    return NextResponse.json({
      success: true,
      storageKey,
      bucket,
    });
  } catch (error) {
    return toProblemResponse(error, "/api/catalog/upload-proxy");
  }
}

