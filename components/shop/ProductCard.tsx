import Link from "next/link";
import { ConceptFigure } from "@/components/ui/ConceptFigure";
import { categoryLabel, type Product } from "@/lib/products";

type ProductCardProps = {
  product: Product;
  priority?: boolean;
  sizes?: string;
};

/**
 * Catalogue card. The whole card is a single link to the product preview
 * route, so there is one accessible target per product.
 */
export function ProductCard({
  product,
  priority = false,
  sizes = "(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 45vw, 92vw",
}: ProductCardProps) {
  return (
    <article className="group flex flex-col">
      <Link
        href={`/shop/${product.slug}`}
        className="flex flex-col focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acid"
      >
        <ConceptFigure
          src={product.image}
          alt={`Concept image for ${product.name}: ${product.tagline}`}
          ratio="3 / 4"
          sizes={sizes}
          priority={priority}
          focus="50% 50%"
        />

        <div className="mt-4 flex items-start justify-between gap-4 border-t border-bone/12 pt-3">
          <div className="min-w-0">
            <p className="label text-ash">{product.index}</p>
            <h3 className="mt-2 text-[1.05rem] font-medium leading-snug transition-colors duration-300 group-hover:text-acid">
              {product.name}
            </h3>
            <p className="mt-2 text-[0.85rem] leading-relaxed text-bone/55">
              {categoryLabel(product.category)} — {product.collection}
            </p>
          </div>
          <span className="label shrink-0 border border-bone/20 px-2 py-1 text-bone/60">
            Preview
          </span>
        </div>
      </Link>
    </article>
  );
}
