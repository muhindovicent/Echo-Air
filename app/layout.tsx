import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { WishlistProvider } from "@/components/shop/WishlistProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Echo & Air — Concept Storefront (Phase 01)",
    template: "%s — Echo & Air",
  },
  description:
    "Echo & Air is a streetwear label building heavyweight outerwear and essentials. This is the Phase 01 concept storefront: homepage, design system and reusable components. No orders are taken yet.",
  applicationName: "Echo & Air",
  openGraph: {
    title: "Echo & Air — Concept Storefront (Phase 01)",
    description:
      "Phase 01 concept storefront for Echo & Air. Homepage and design foundation only — the catalog and checkout are not live.",
    type: "website",
    siteName: "Echo & Air",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="bg-obsidian text-bone antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');",
          }}
        />
        <a
          href="#main"
          className="label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-acid focus:px-5 focus:py-3 focus:text-obsidian"
        >
          Skip to content
        </a>
        <WishlistProvider>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </WishlistProvider>
      </body>
    </html>
  );
}
