'use client';

import { useEffect, useState } from 'react';
import { CTASection } from '@/components/home/sections/cta-section';
// import { FAQSection } from "@/components/sections/faq-section";
import { FooterSection } from '@/components/home/sections/footer-section';
import { HeroSection } from '@/components/home/sections/hero-section';
import { OpenSourceSection } from '@/components/home/sections/open-source-section';
import { PricingSection } from '@/components/home/sections/pricing-section';
import { QuriositShowcase } from '@/components/home/sections/quriosity-showcase';
import { UseCasesSection } from '@/components/home/sections/use-cases-section';
import { ModalProviders } from '@/providers/modal-providers';

export default function Home() {
  return (
    <>
      <ModalProviders />
      <main className="flex flex-col items-center justify-center min-h-screen w-full">
        <div className="w-full">
          <HeroSection />
          <QuriositShowcase />
          <UseCasesSection />
          {/* <CompanyShowcase /> */}
          {/* <BentoSection /> */}
          {/* <QuoteSection /> */}
          {/* <FeatureSection /> */}
          {/* <GrowthSection /> */}
          <OpenSourceSection />
          <PricingSection />
          {/* <TestimonialSection /> */}
          {/* <FAQSection /> */}
          <CTASection />
          <FooterSection />
        </div>
      </main>
    </>
  );
}
