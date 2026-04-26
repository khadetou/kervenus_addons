import { Link } from "@tanstack/react-router"

import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { landingStoryBanners } from "@/lib/landing-assets"

export function ProductStoryBanners() {
  const [feature, ...supporting] = landingStoryBanners

  if (!feature) return null

  return (
    <section className="mx-auto mt-16 w-[min(1560px,calc(100vw-32px))]">
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">catalogue vivant</p>
          <h2 className="font-serif text-5xl leading-none md:text-6xl">
            Autour des familles maison.
          </h2>
        </div>
        <p className="max-w-md text-sm leading-7 text-warm-gray">
          Thermos, boîtes à lunch, chauffe-plats et détails de table repris dans
          une direction plus éditoriale.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
        <StoryTile story={feature} featured />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {supporting.slice(0, 2).map((story) => (
            <StoryTile key={story.src} story={story} />
          ))}
        </div>
      </div>

      {supporting[2] ? (
        <div className="mt-4">
          <StoryTile story={supporting[2]} compact />
        </div>
      ) : null}
    </section>
  )
}

type StoryTileProps = {
  story: (typeof landingStoryBanners)[number]
  featured?: boolean
  compact?: boolean
}

function StoryTile({ story, featured, compact }: StoryTileProps) {
  return (
    <article
      className={[
        "group relative overflow-hidden rounded-[2rem] border border-white/75 bg-charcoal text-ivory shadow-soft",
        featured ? "min-h-[560px]" : compact ? "min-h-[300px]" : "min-h-[272px]",
      ].join(" ")}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.035]"
        style={{ backgroundImage: `url('${story.src}')` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,23,23,.76),rgba(23,23,23,.34)_55%,rgba(23,23,23,.1)),linear-gradient(180deg,rgba(23,23,23,.08),rgba(23,23,23,.54))]" />
      <div
        className={[
          "relative z-10 flex h-full min-h-[inherit] flex-col justify-end p-6",
          featured ? "md:p-10" : "md:p-7",
          compact ? "md:max-w-2xl" : "",
        ].join(" ")}
      >
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/22 bg-white/14 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-champagne backdrop-blur">
          <AppIcon icon="solar:stars-line-duotone" className="size-4" />
          {story.eyebrow}
        </span>
        <h3
          className={[
            "mt-4 max-w-2xl font-serif leading-none text-white",
            featured ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl",
          ].join(" ")}
        >
          {story.title}
        </h3>
        <p className="mt-4 max-w-xl text-sm leading-7 text-ivory/78 md:text-base">
          {story.description}
        </p>
        <Button
          asChild
          className="mt-6 h-11 w-fit rounded-full bg-ivory px-5 text-charcoal hover:bg-champagne"
        >
          <Link to="/shop" search={{ category: story.categorySlug }}>
            {story.cta}
            <AppIcon icon="solar:arrow-right-linear" className="size-4" />
          </Link>
        </Button>
      </div>
    </article>
  )
}
