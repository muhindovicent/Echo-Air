import type { Metadata } from "next";
import { BagPageContent } from "@/components/shop/BagPageContent";

export const metadata: Metadata = {
  title: "Demo Bag — Echo & Air",
  description:
    "The demonstration bag: the pieces you picked with their demonstration size and colour label. Nothing here can be ordered and no prices are shown.",
};

export default function BagPage() {
  return <BagPageContent />;
}
