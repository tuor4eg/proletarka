"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"

const METRIKA_ID = process.env.NEXT_PUBLIC_METRIKA_ID

export function YandexMetrika() {
    const pathname = usePathname()

    if (!METRIKA_ID || pathname.startsWith("/admin")) return null

    return (
        <>
            <Script
                id="yandex-metrika"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                        m[i].l=1*new Date();
                        for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
                        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                        (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
                        ym(${METRIKA_ID},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true});
                    `,
                }}
            />
            <noscript>
                <img
                    src={`https://mc.yandex.ru/watch/${METRIKA_ID}`}
                    style={{ position: "absolute", left: "-9999px" }}
                    alt=""
                />
            </noscript>
        </>
    )
}
