/**
 * Read-only API route: individual product details by slug.
 *
 * GET /api/products/[slug]
 *
 * Unpublished products are never exposed: returns 404 for unknown or
 * unpublished slugs. Returns 404 when the database is not configured.
 */

import { NextResponse } from "next/server";
import { PostgresCommerceStore, disconnectPrisma } from "@/lib/commerce/postgres-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  let store: PostgresCommerceStore | null = null;
  try {
    store = new PostgresCommerceStore();
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const product = await store.getProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  } finally {
    await disconnectPrisma();
  }
}
