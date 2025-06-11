'use client';

import Image from 'next/image';
import { siteConfig } from '@/lib/home';
import Link from 'next/link';
import { FlickeringGrid } from '@/components/home/ui/flickering-grid';
import { useState, useEffect } from 'react';

export function CTASection() {
  const [mounted, setMounted] = useState(false);
  const { ctaSection } = siteConfig;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      id="cta"
      className="flex flex-col items-center justify-center w-full pt-12 pb-12 relative"
    >
      {/* Left background grid */}
      <div className="absolute left-0 top-0 h-full w-1/3 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background z-10" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent z-10" />
        
        {mounted && (
          <FlickeringGrid
            className="h-full w-full"
            squareSize={2.5}
            gridGap={2.5}
            color="var(--secondary)"
            maxOpacity={0.3}
            flickerChance={0.02}
          />
        )}
      </div>

      {/* Right background grid */}
      <div className="absolute right-0 top-0 h-full w-1/3 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background z-10" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent z-10" />
        
        {mounted && (
          <FlickeringGrid
            className="h-full w-full"
            squareSize={2.5}
            gridGap={2.5}
            color="var(--secondary)"
            maxOpacity={0.3}
            flickerChance={0.02}
          />
        )}
      </div>

      {/* Center background */}
      <div className="absolute inset-x-1/4 top-0 h-full -z-20 bg-background rounded-b-xl" />
      <div className="w-full max-w-6xl mx-auto px-6">
        <div className="h-[400px] md:h-[400px] overflow-hidden shadow-xl w-full border border-border rounded-xl bg-secondary/10 relative z-20">
          {/* <Image
            src={ctaSection.backgroundImage}
            alt="Agent CTA Background"
            className="absolute inset-0 w-full h-full object-cover object-right md:object-center"
            fill
            priority
          /> */}
          <div className="absolute inset-0 -top-32 md:-top-40 flex flex-col items-center justify-center">
            <h1 className="text-black dark:text-white text-4xl md:text-7xl font-medium tracking-tighter max-w-xs md:max-w-xl text-center">
              {ctaSection.title}
            </h1>
            <div className="absolute bottom-10 flex flex-col items-center justify-center gap-2">
              <Link
                href={ctaSection.button.href}
                className="bg-white dark:bg-black text-black dark:text-white font-semibold text-sm h-10 w-fit px-4 rounded-full flex items-center justify-center shadow-md"
              >
                {ctaSection.button.text}
              </Link>
              <span className="text-black dark:text-white text-sm">{ctaSection.subtext}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
