/**
 * Read-only API route: list published commercial products.
 *
 * GET /api/products?query=...&category=...
 *
 * Unpublished products are never exposed.
 * Returns a 503 when the database is not configured or unreachable,
 * rather than a misleading empty success response.
 */

import { NextResponse } from "next/server";
import { CommercialProduct } from "@/lib/commerce/types";
import { PostgresCommerceStore } from "@/lib/commerce/postgres-server";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";
  const category = searchParams.get("category") ?? "all";

  const store = new PostgresCommerceStore();

  try {
    let products: readonly CommercialProduct[];
    if (category === "all") {
      products = query
        ? await store.searchProducts(query)
        : await store.getPublishedProducts();
    } else {
      products = await store.filterByCategory(category);
    }

    return NextResponse.json({
      products,
      count: products.length,
    });
  } catch {
    // Database not configured or unreachable: report a service error rather
    // than inventing an empty successful response.
    return NextResponse.json(
      { error: "product catalog unavailable" },
      { status: 503 },
    );
  }
}
