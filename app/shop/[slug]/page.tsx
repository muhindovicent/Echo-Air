import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductOptions } from "@/components/shop/ProductOptions";
import { SizeGuideDialog } from "@/components/shop/SizeGuideDialog";
import { WishlistButton } from "@/components/shop/WishlistButton";
import {
  PRODUCTS,
  categoryLabel,
  getProduct,
  siblingProducts,
} from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    return { title: "Piece not found — Echo & Air" };
  }

  return {
    title: `${product.name} — Preview`,
    description: `Demonstration preview of ${product.name}: ${product.tagline} No pricing or ordering is available.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  const { previous, next } = siblingProducts(product.slug);

  return (
    <section
      aria-labelledby="product-heading"
      className="border-b border-bone/12 bg-obsidian"
    >
      <div className="mx-auto max-w-[1600px] px-5 pb-16 pt-32 md:px-10 md:pb-20 md:pt-40">
        <nav aria-label="Breadcrumb" className="mb-10">
          <Link
            href="/shop"
            className="label text-bone/60 transition-colors duration-300 hover:text-acid"
          >
            &larr; Back to the catalogue
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6 lg:col-start-1 lg:row-start-1">
            <p className="label text-acid">
              {product.index} — {product.collection}
            </p>
            <h1
              id="product-heading"
              className="mt-5 text-section font-medium uppercase"
            >
              {product.name}
            </h1>
            <p className="label mt-4 text-ash">
              {categoryLabel(product.category)} — {product.colourway}
            </p>
            <p className="mt-6 max-w-xl text-lead text-bone/75">
              {product.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <p className="label text-ash">
                {product.views.length > 1
                  ? `Frames — ${String(product.views.length).padStart(2, "0")}`
                  : "Single frame"}
              </p>
              <SizeGuideDialog category={categoryLabel(product.category)} />
            </div>
          </div>

          {/* The main frame follows the heading on small screens and moves to
              the right-hand column on large ones. */}
          <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2 lg:self-start">
            <ProductGallery views={product.views} productName={product.name} />
          </div>

          <div className="lg:col-span-6 lg:col-start-1 lg:row-start-2">
            <div className="border border-bone/12 bg-obsidian-soft p-6">
              <p className="label text-acid">Demonstration product</p>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-bone/65">
                This is a working title for a piece that does not exist yet.
                No price, stock, size availability, reviews or ordering is
                published, and no checkout is connected.
              </p>
            </div>

            <ProductOptions
              slug={product.slug}
              sizes={product.sizes}
              colours={product.colours}
            />

            <dl className="mt-10 border-t border-bone/12">
              <div className="border-b border-bone/12 py-5">
                <dt className="label text-ash">Construction notes</dt>
                <dd>
                  <ul className="mt-3 space-y-2">
                    {product.details.map((detail) => (
                      <li
                        key={detail}
                        className="text-[0.95rem] leading-relaxed text-bone/70"
                      >
                        {detail}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="border-b border-bone/12 py-5">
                <dt className="label text-ash">Category</dt>
                <dd className="mt-2">
                  <Link
                    href={`/shop?category=${product.category}`}
                    className="link-underline text-[0.95rem] text-bone/80 transition-colors duration-300 hover:text-acid"
                  >
                    {categoryLabel(product.category)}
                  </Link>
                </dd>
              </div>
              <div className="border-b border-bone/12 py-5">
                <dt className="label text-ash">Status</dt>
                <dd className="mt-2 text-[0.95rem] text-bone/70">
                  Demonstration piece — not for sale
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <WishlistButton slug={product.slug} name={product.name} />
              <Link
                href="/shop"
                className="label inline-flex items-center gap-3 border border-bone/25 px-6 py-4 text-bone transition-colors duration-300 hover:border-bone hover:bg-bone hover:text-obsidian"
              >
                Browse the catalogue
              </Link>
              <Link
                href={`/shop?category=${product.category}`}
                className="label inline-flex items-center gap-3 border border-bone/25 px-6 py-4 text-bone transition-colors duration-300 hover:border-bone hover:bg-bone hover:text-obsidian"
              >
                More {categoryLabel(product.category).toLowerCase()}
              </Link>
            </div>
          </div>
        </div>

        <nav
          aria-label="Other pieces"
          className="mt-16 grid gap-6 border-t border-bone/12 pt-8 md:grid-cols-2"
        >
          {previous ? (
            <Link
              href={`/shop/${previous.slug}`}
              className="group border border-bone/12 p-6 transition-colors duration-300 hover:border-bone/40"
            >
              <span className="label text-ash">Previous</span>
              <span className="mt-3 block text-[1.1rem] font-medium transition-colors duration-300 group-hover:text-acid">
                {previous.name}
              </span>
            </Link>
          ) : null}
          {next ? (
            <Link
              href={`/shop/${next.slug}`}
              className="group border border-bone/12 p-6 text-right transition-colors duration-300 hover:border-bone/40 md:col-start-2"
            >
              <span className="label text-ash">Next</span>
              <span className="mt-3 block text-[1.1rem] font-medium transition-colors duration-300 group-hover:text-acid">
                {next.name}
              </span>
            </Link>
          ) : null}
        </nav>
      </div>
    </section>
  );
}
