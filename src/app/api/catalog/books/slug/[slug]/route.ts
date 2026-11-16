import { NextResponse } from "next/server";
import { discoveryService } from "@/modules/catalog/application/discovery-service";
import { AppError, toProblemResponse } from "@/lib/errors/api-error";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const book = await discoveryService.getBookBySlug(params.slug);

    if (!book) {
      throw AppError.notFound("Published book not found");
    }

    return NextResponse.json({ book }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, `/api/catalog/books/slug/${params.slug}`);
  }
}
