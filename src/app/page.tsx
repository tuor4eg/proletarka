import { PublicNavWrapper } from "@/components/PublicNavWrapper"
import { HomeHero } from "@/components/HomeHero"
import { ArtifactShowcase } from "@/components/ArtifactShowcase"
import { HomePeople } from "@/components/HomePeople"
import { HomeWar } from "@/components/HomeWar"
import { HomeAbout } from "@/components/HomeAbout"

export default function HomePage() {
    const showcaseCodes = (process.env.HOMEPAGE_SHOWCASES ?? "").split(",").filter(Boolean)

    return (
        <>
            <PublicNavWrapper />
            <HomeHero />
            <main className="max-w-lg mx-auto px-4 lg:max-w-4xl mt-3">
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
                    {showcaseCodes.map((code) => (
                        <ArtifactShowcase key={code} code={code} />
                    ))}
                    <HomePeople />
                    <HomeWar />
                    <HomeAbout />
                </div>
            </main>
        </>
    )
}
