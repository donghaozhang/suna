'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface QuriositiLogoProps {
  size?: number;
}
export function KortixLogo({ size = 24 }: QuriositiLogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use proper light/dark mode logos instead of CSS invert
  const logoSrc = mounted && theme === 'dark' ? '/kortix-logo-white.svg' : '/kortix-symbol.svg';

  return (
    <Image
        src={logoSrc}
        alt="Quriosity"
        width={size}
        height={size}
        className="flex-shrink-0"
      />
  );
}
