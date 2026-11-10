import { BrandStory } from "@/components/sections/BrandStory";
import { ClosingBand } from "@/components/sections/ClosingBand";
import { Hero } from "@/components/sections/Hero";
import { Lookbook } from "@/components/sections/Lookbook";
import { NewArrivals } from "@/components/sections/NewArrivals";

export default function HomePage() {
  return (
    <>
      <Hero />
      <NewArrivals />
      <Lookbook />
      <BrandStory />
      <ClosingBand />
    </>
  );
}
