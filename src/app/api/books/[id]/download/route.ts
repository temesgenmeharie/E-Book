import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { libraryService } from "@backend/modules/library/application/library-service";
import { generatePresignedDownloadUrl, BUCKET_PRIVATE } from "@/infrastructure/storage/s3";
import { BookFormat } from "@prisma/client";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getSessionCookie();
    if (!token) throw AppError.unauthorized("Authentication required");

    const user = await authService.validateSession(token);
    if (!user) throw AppError.unauthorized("Session expired or invalid");

    // 1. Strict entitlement verification
    const entitlement = await libraryService.verifyEntitlement(user.id, params.id);

    const formatQuery = (req.nextUrl.searchParams.get("format") || "PDF").toUpperCase();
    const targetFormat = formatQuery === "EPUB" ? BookFormat.EPUB : BookFormat.PDF;

    const bookFile = entitlement.book.files.find(
      (f) => f.format === targetFormat && !f.isSample
    );

    if (!bookFile) {
      throw AppError.notFound(`File for ${targetFormat} format not found.`);
    }

    const safeTitle = entitlement.book.title.replace(/[^\w\s-]/g, "");
    const ext = targetFormat.toLowerCase();
    const filename = `${safeTitle}.${ext}`;

    const downloadUrl = await generatePresignedDownloadUrl({
      bucket: BUCKET_PRIVATE,
      storageKey: bookFile.storageKey,
      filename,
      expiresInSeconds: 300, // 5 minutes valid
    });

    return NextResponse.json({
      downloadUrl,
      filename,
      expiresInSeconds: 300,
    });
  } catch (error) {
    return toProblemResponse(error, `/api/books/${params.id}/download`);
  }
}

