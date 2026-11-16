import { NextResponse } from "next/server";
import { catalogService } from "@backend/modules/catalog/application/catalog-service";
import { toProblemResponse } from "@/lib/errors/api-error";

export async function GET() {
  try {
    const categories = await catalogService.getAllCategories();
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    return toProblemResponse(error, "/api/catalog/categories");
  }
}

