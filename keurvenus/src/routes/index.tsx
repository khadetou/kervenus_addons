import { createFileRoute } from "@tanstack/react-router"

import { BenefitsSection } from "@/components/sections/benefits-section"
import { BrandStory } from "@/components/sections/brand-story"
import { CategoryShowcase } from "@/components/sections/category-showcase"
import { EditorialBanner } from "@/components/sections/editorial-banner"
import { FeaturedProducts } from "@/components/sections/featured-products"
import { HeroSection } from "@/components/sections/hero-section"
import { LookbookSection } from "@/components/sections/lookbook-section"
import { NewsletterSection } from "@/components/sections/newsletter-section"
import { ProductCarousel } from "@/components/sections/product-carousel"
import { ProductStoryBanners } from "@/components/sections/product-story-banners"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  return (
    <main>
      <HeroSection />
      <CategoryShowcase />
      <ProductStoryBanners />
      <FeaturedProducts />
      <EditorialBanner />
      <ProductCarousel />
      <LookbookSection />
      <BrandStory />
      <BenefitsSection />
      <NewsletterSection />
    </main>
  )
}
