'use client';

import { SectionHeader } from '@/components/home/section-header';
import { ArrowRight, Coffee, Gamepad, Monitor, Palette, Play, PaintBucket } from 'lucide-react';
import { FlickeringGrid } from '@/components/home/ui/flickering-grid';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const showcaseAgents = [
  {
    id: 'game-agent',
    title: 'Quriosity Game Agent',
    description: 'An interactive card game implementation with Black Myth-inspired themes. Experience traditional Chinese card gameplay with modern web technology.',
    icon: <Gamepad className="w-5 h-5" />,
    buttonText: 'View Game',
    color: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
    iconColor: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
    url: '#',
  },
  {
    id: 'design-agent',
    title: 'Quriosity Design Agent',
    description: 'Comprehensive brand identity showcase featuring merchandise designs, stationery, digital assets, and complete brand applications for the Quriosity ecosystem.',
    icon: <Palette className="w-5 h-5" />,
    buttonText: 'View Gallery',
    color: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
    iconColor: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
    url: '#',
  },
  {
    id: 'brand-agent',
    title: 'Quriosity Brand Agent',
    description: 'AI-generated branding and mockups for a charming fictional coffee brand, "Panda Coffee".',
    icon: <Coffee className="w-5 h-5" />,
    buttonText: 'View Gallery',
    color: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
    iconColor: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    url: '#',
  },
  {
    id: 'web-agent',
    title: 'Quriosity Web Agent',
    description: 'Experience our autonomous AI agent that plans complex trips using web search, code execution, and multi-step reasoning. Watch it plan a Tokyo-Kyoto-Osaka journey in real-time.',
    icon: <Monitor className="w-5 h-5" />,
    buttonText: 'View Agent',
    color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    iconColor: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    url: '#',
  },
  {
    id: 'art-agent',
    title: 'Quriosity Art Agent',
    description: 'A mesmerizing animation of AI-generated poker cards, inspired by the Black Myth: Wukong art style.',
    icon: <PaintBucket className="w-5 h-5" />,
    buttonText: 'View Gallery',
    color: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
    iconColor: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400',
    url: '#',
    featured: true,
  },
  {
    id: 'clone-agent',
    title: 'Quriosity Clone Agent',
    description: 'Advanced web cloning agent that replicates complex streaming interfaces using Emergent technology. Demonstrates autonomous UI reconstruction and intelligent web architecture replication capabilities.',
    icon: <Play className="w-5 h-5" />,
    buttonText: 'View Project',
    color: 'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-800',
    iconColor: 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-400',
    url: '#',
  },
];

export function QuriositShowcase() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      id="showcases"
      className="flex flex-col items-center justify-center w-full relative py-2 -mt-8"
    >
      {/* Subtle background without grid lines */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/90 to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/10 via-background/5 to-background/10 z-5" />
      </div>

      <div className="w-full max-w-6xl mx-auto px-6 relative z-10">
        <SectionHeader>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Showcases
            </span>
          </h2>
          <p className="text-muted-foreground text-center text-balance font-medium">
            Explore our collection of AI-powered projects, interactive demos, and creative applications.
          </p>
        </SectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-12">
          {showcaseAgents.map((agent) => (
            <div
              key={agent.id}
              className={`rounded-xl p-6 border transition-all duration-200 hover:scale-105 hover:shadow-lg ${agent.color}`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2.5 ${agent.iconColor}`}>
                    {agent.icon}
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {agent.title}
                  </h3>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {agent.description}
                </p>
                
                <Link
                  href={agent.url}
                  className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-2"
                >
                  <span>{agent.buttonText}</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 