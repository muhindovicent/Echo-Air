import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ActionLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "solid" | "ghost" | "quiet";
  className?: string;
  withArrow?: boolean;
};

const variants: Record<NonNullable<ActionLinkProps["variant"]>, string> = {
  solid:
    "bg-acid text-obsidian border border-acid hover:bg-bone hover:border-bone",
  ghost:
    "border border-bone/30 text-bone hover:border-bone hover:bg-bone hover:text-obsidian",
  quiet:
    "border border-transparent text-bone hover:text-acid underline-offset-[6px] hover:underline",
};

/**
 * Primary call to action. Renders a real anchor so it is keyboard reachable,
 * announced as a link, and works without JavaScript.
 */
export function ActionLink({
  href,
  children,
  variant = "solid",
  className,
  withArrow = true,
}: ActionLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group label inline-flex items-center gap-3 px-6 py-4 transition-colors duration-300",
        variants[variant],
        className,
      )}
    >
      <span>{children}</span>
      {withArrow ? (
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
          &rarr;
        </span>
      ) : null}
    </Link>
  );
}
