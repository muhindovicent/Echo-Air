import Link from "next/link";

export default function NotFound() {
  return (
    <section
      aria-labelledby="not-found-heading"
      className="flex min-h-[80svh] items-center bg-obsidian"
    >
      <div className="mx-auto w-full max-w-[1600px] px-5 py-24 md:px-10">
        <p className="label text-acid">404 — not found</p>
        <h1
          id="not-found-heading"
          className="mt-6 text-display font-medium uppercase"
        >
          Nothing here
        </h1>
        <p className="mt-8 max-w-lg text-lead text-bone/70">
          This page does not exist in the current build. The catalogue holds
          every demonstration piece that does.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/shop"
            className="label inline-flex items-center gap-3 border border-acid bg-acid px-6 py-4 text-obsidian transition-colors duration-300 hover:bg-bone hover:border-bone"
          >
            Open the catalogue
          </Link>
          <Link
            href="/"
            className="label inline-flex items-center gap-3 border border-bone/25 px-6 py-4 text-bone transition-colors duration-300 hover:border-bone hover:bg-bone hover:text-obsidian"
          >
            Back to the homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
