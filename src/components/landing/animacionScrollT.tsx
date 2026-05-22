"use client"

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Lobster } from "next/font/google";

const lobster = Lobster({
  subsets: ['latin'],
  weight: ['400'],
});

gsap.registerPlugin(ScrollTrigger);

export function AnimacionScrollT() {
    const urlFondo : string = "./img/bellas.webp";
    const urlTunel : string = "./img/tunel2.webp";

    const wrapperRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const heroRef = useRef<HTMLElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.timeline({
                scrollTrigger: {
                    trigger: wrapperRef.current,
                    start: "top top",
                    end: "+=100%",
                    pin: true,
                    scrub: true,
                    // markers: true,
                },
            })
            .to(imgRef.current, {
                scale: 2,
                z: 350,
                transformOrigin: "center center",
                ease: 'power1.inOut',
            })
            .to(heroRef.current, {
                scale: 1.3,
                // opacity: 1,
                boxShadow: `10000px 0 0 0 rgba(0, 0, 0, 0) inset`,
                // height: "120vh",
                transformOrigin: "center center",
                ease: 'power1.Out',
            }, "<");
        }, wrapperRef);

        return () => ctx.revert();
    }, []);

    return (
    <>
        <div ref={wrapperRef} className="relative h-auto w-full z-1"> {/* wrapper */}
            <div className="h-screen w-full absolute flex flex-col justify-center items-center z-1 gap-10 text-white"> {/* intro */}
                {/* <h1 className={`text-4xl ${roboto.className}`}>Itinerario Turístico</h1> */}
                <p className={`text-8xl ${lobster.className}`}>Share</p>
                <p className={`text-7xl ${lobster.className}`}>Path</p>
            </div>

            <div className="overflow-hidden"> {/* content */}
                <section ref={heroRef} style={{ backgroundImage: `url(${urlFondo})`, boxShadow: `10000px 0 0 0 rgba(0, 0, 0, 0.6) inset`  }} className={`h-screen w-full bg-center bg-no-repeat bg-cover`}></section> {/* section hero */}
            </div>
            <div className="w-full h-screen absolute top-0 left-0 right-0 z-2 perspective-[500px] overflow-hidden"> {/* image-container */}
                <img ref={imgRef} src={urlTunel} alt="Imagen tunel" className="size-full object-cover"/>
            </div>
        </div>
    </>
    )
};