import { NextRequest, NextResponse } from "next/server";
import { authService } from "@backend/modules/identity/application/auth-service";
import { getSessionCookie } from "@backend/modules/identity/infrastructure/session-cookie";
import { libraryService } from "@backend/modules/library/application/library-service";
import { getObjectStream, BUCKET_PRIVATE } from "@/infrastructure/storage/s3";
import { BookFormat } from "@prisma/client";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";
import { Readable } from "stream";

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
      throw AppError.notFound(`Book is not available in ${targetFormat} format.`);
    }

    const rangeHeader = req.headers.get("range");

    // 2. Fetch partial content from MinIO
    const s3Response = await getObjectStream({
      bucket: BUCKET_PRIVATE,
      storageKey: bookFile.storageKey,
      range: rangeHeader || undefined,
    });

    if (!s3Response.Body) {
      throw AppError.internal("Could not read binary asset from storage.");
    }

    const stream = s3Response.Body as ReadableStream | Readable;
    const contentType = bookFile.mimeType || (targetFormat === "PDF" ? "application/pdf" : "application/epub+zip");

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "private, no-cache, no-store, must-revalidate");

    if (s3Response.ContentRange) {
      responseHeaders.set("Content-Range", s3Response.ContentRange);
    }
    if (s3Response.ContentLength !== undefined) {
      responseHeaders.set("Content-Length", s3Response.ContentLength.toString());
    }

    const status = rangeHeader ? 206 : 200;

    // Convert node stream or Web readable stream to web response
    return new NextResponse(stream as any, {
      status,
      headers: responseHeaders,
    });
  } catch (error) {
    return toProblemResponse(error, `/api/books/${params.id}/stream`);
  }
}

