import { HomeHero } from "@/components/HomeHero"
import { HomeNews } from "@/components/HomeNews"
import { HomeWar } from "@/components/HomeWar"
import { HomeExposition } from "@/components/HomeExposition"
import { HomeFunds } from "@/components/HomeFunds"
import { HomeAbout } from "@/components/HomeAbout"

export default function HomePage() {
    return (
        <>
            <HomeHero />
            <main className="max-w-lg mx-auto px-4 lg:max-w-4xl mt-3">
                <HomeNews />
                <HomeExposition />
                <HomeFunds />
                <HomeWar />
                <HomeAbout />
            </main>
        </>
    )
}
