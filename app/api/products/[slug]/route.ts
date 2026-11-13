/**
 * Read-only API route: individual product details by slug.
 *
 * GET /api/products/[slug]
 *
 * Unpublished products are never exposed: returns 404 for unknown or
 * unpublished slugs. Returns 503 when the database is not configured or
 * unreachable, rather than a misleading 404.
 */

import { NextResponse } from "next/server";
import { PostgresCommerceStore } from "@/lib/commerce/postgres-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  const store = new PostgresCommerceStore();

  try {
    const product = await store.getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch {
    // Database not configured or unreachable: report a service error rather
    // than a misleading 404.
    return NextResponse.json(
      { error: "product catalog unavailable" },
      { status: 503 },
    );
  }
}
