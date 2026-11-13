/**
 * Read-only API route: list published commercial products.
 *
 * GET /api/products?query=...&category=...
 *
 * Unpublished products are never exposed. Returns an empty list when the
 * database is not configured.
 */

import { NextResponse } from "next/server";
import { CommercialProduct } from "@/lib/commerce/types";
import {
  PostgresCommerceStore,
  disconnectPrisma,
} from "@/lib/commerce/postgres-server";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";
  const category = searchParams.get("category") ?? "all";

  let store: PostgresCommerceStore | null = null;
  try {
    store = new PostgresCommerceStore();
  } catch {
    // Prisma Client can be constructed without DATABASE_URL; queries fail
    // later. Return an empty list rather than leaking a server error.
    return NextResponse.json({ products: [], count: 0 });
  }

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
    // Database not reachable or not configured: report empty rather than
    // inventing data or leaking internals.
    return NextResponse.json({ products: [], count: 0 });
  } finally {
    await disconnectPrisma();
  }
}
