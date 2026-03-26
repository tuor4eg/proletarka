export function HomeHero() {
    return (
        <div className="relative w-full overflow-hidden" style={{ maxHeight: "clamp(280px, 45vw, 520px)" }}>
            <img
                src="/proletarka.jpg"
                alt="Пролетарка"
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 lg:px-12 lg:pb-10 max-w-2xl lg:max-w-4xl">
                <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
                    Память Пролетарки
                </h1>
                <p className="text-sm lg:text-base text-white/80 mt-2 leading-relaxed">
                    Истории людей, которые работали на заводе.
                </p>
            </div>
        </div>
    )
}
