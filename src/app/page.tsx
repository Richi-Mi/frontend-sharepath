// import Image from "next/image";
import HeroSection from "@/components/landing-components/hero-section";
import IntroAnimada from "@/components/landing-components/introAnimada";
import ContentSection from "@/components/landing-components/landing-content";
import CallToAction from "@/components/landing-components/call-to-action";
import FooterSection from "@/components/landing-components/footer";
import { HeroHeader } from "@/components/landing-components/hero-header";

import { Background } from "@/components/landing/background";
import { FAQ } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { ResourceAllocation } from "@/components/landing/resource-allocation";
import { Testimonials } from "@/components/landing/testimonials";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { AnimacionScrollT } from "@/components/landing/animacionScrollT";

export default function Home() {
  return (
    <>
      <AnimacionScrollT />
      <Navbar />
      <Background className="via-muted to-muted/80">
        <Hero />

        <Features />
        <ResourceAllocation />
      </Background>
      <Testimonials />
      <Background variant="bottom">
        <FAQ />
      </Background>
      <Footer />
    </>
  );
}
