'use client';

import { SectionHeader } from '@/components/home/section-header';
import { siteConfig } from '@/lib/home';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { FlickeringGrid } from '@/components/home/ui/flickering-grid';
import { useState, useEffect } from 'react';

interface UseCase {
  id: string;
  title: string;
  description: string;
  category: string;
  featured: boolean;
  icon: React.ReactNode;
  image: string;
  url: string;
}

export function UseCasesSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get featured use cases from siteConfig and limit to 8
  const featuredUseCases: UseCase[] = (siteConfig.useCases || []).filter(
    (useCase: UseCase) => useCase.featured,
  );

  return (
    <section
      id="use-cases"
      className="flex flex-col items-center justify-center gap-10 pb-10 w-full relative"
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
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          See Q in action
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">
          Explore real-world examples of how Q completes complex tasks
          autonomously
        </p>
      </SectionHeader>

      <div className="relative w-full h-full">
        <div className="grid min-[650px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-4 gap-4 w-full max-w-6xl mx-auto px-6">
          {featuredUseCases.map((useCase: UseCase) => (
            <div
              key={useCase.id}
              className="rounded-xl overflow-hidden relative h-fit min-[650px]:h-full flex flex-col md:shadow-[0px_61px_24px_-10px_rgba(0,0,0,0.01),0px_34px_20px_-8px_rgba(0,0,0,0.05),0px_15px_15px_-6px_rgba(0,0,0,0.09),0px_4px_8px_-2px_rgba(0,0,0,0.10),0px_0px_0px_1px_rgba(0,0,0,0.08)] bg-accent"
            >
              <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-secondary/10 p-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-secondary"
                    >
                      {useCase.icon}
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium line-clamp-1">
                    {useCase.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {useCase.description}
                </p>
              </div>

              <div className="mt-auto">
                <div className="w-full h-[160px] bg-accent/10">
                  <div className="relative w-full h-full overflow-hidden">
                    <img
                      src={
                        useCase.image ||
                        `https://placehold.co/800x400/f5f5f5/666666?text=Q+${useCase.title.split(' ').join('+')}`
                      }
                      alt={`Q ${useCase.title}`}
                      className="w-full h-full object-cover"
                    />
                    <a
                      href={useCase.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-start p-4 group"
                    >
                      <span className="flex items-center gap-2 text-sm text-white font-medium">
                        Watch replay
                        <ArrowRight className="size-4 transform group-hover:translate-x-1 transition-transform" />
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {featuredUseCases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">No use cases available yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
