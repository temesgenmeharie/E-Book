import { NextRequest, NextResponse } from "next/server";
import { discoveryService } from "@/modules/catalog/application/discovery-service";
import { BookFormat } from "@prisma/client";
import { toProblemResponse } from "@/lib/errors/api-error";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("q") || undefined;
    const categorySlug = searchParams.get("category") || undefined;
    const language = searchParams.get("lang") || undefined;
    const format = (searchParams.get("format") as BookFormat) || undefined;
    const currency = searchParams.get("currency") || "ETB";
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const sortBy = (searchParams.get("sortBy") as any) || "newest";
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const pageSize = searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!, 10) : 12;

    const results = await discoveryService.searchBooks({
      query,
      categorySlug,
      language,
      format,
      currency,
      minPrice,
      maxPrice,
      sortBy,
      page,
      pageSize,
    });

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/catalog/search");
  }
}
