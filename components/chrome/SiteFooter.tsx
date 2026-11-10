import Link from "next/link";
import { contactStatus, copyrightYear, footerColumns } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-bone/12 bg-obsidian-soft">
      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <p className="label text-acid">Echo &amp; Air</p>
            <p className="mt-6 max-w-md text-[clamp(1.05rem,1.4vw,1.3rem)] leading-relaxed text-bone/85">
              Outerwear and heavyweight essentials built for the hours before
              and after the noise.
            </p>
            <div className="mt-8">
              <p className="label text-ash">{contactStatus.label}</p>
              <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-bone/70">
                {contactStatus.value}
              </p>
              <p className="mt-3 max-w-sm text-[0.85rem] leading-relaxed text-bone/50">
                {contactStatus.note}
              </p>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-4 lg:col-start-7">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="label text-ash">{column.title}</p>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="link-underline text-[0.95rem] text-bone/80 transition-colors duration-300 hover:text-acid"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 lg:col-start-11">
            <p className="label text-ash">Social</p>
            <ul className="mt-5 space-y-3">
              {["Instagram", "TikTok", "X"].map((network) => (
                <li key={network}>
                  <span className="text-[0.95rem] text-bone/45">
                    {network} — no confirmed account
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 border border-bone/12 bg-obsidian p-6 md:mt-24 md:p-8">
          <p className="label text-acid">Concept disclosure</p>
          <p className="mt-4 max-w-3xl text-[0.95rem] leading-relaxed text-bone/70">
            This is a Phase 01 concept build, not a live store. Every
            photograph on this site is placeholder artwork carried over from the
            original prototype and tagged &ldquo;Concept&rdquo; on screen. Garment
            names are working titles for layout purposes. No pricing,
            availability, reviews, contact details or orders are presented, and
            no checkout exists. Real brand photography, verified contact
            details and a commerce provider are required before this site can
            sell anything or publish business information.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-bone/12 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-ash">
            &copy; {copyrightYear} Echo &amp; Air — Phase 01 foundation
          </p>
          <Link
            href="/#top"
            className="label group inline-flex items-center gap-3 text-bone transition-colors duration-300 hover:text-acid"
          >
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-300 group-hover:-translate-y-1"
            >
              &uarr;
            </span>
            Back to top
          </Link>
        </div>
      </div>
    </footer>
  );
}
