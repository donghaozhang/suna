'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Image, Video, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaModel {
  id: string;
  label: string;
  type: 'image' | 'video';
  provider: string;
  description?: string;
}

const MEDIA_MODELS: MediaModel[] = [
  // fal.ai Image models (Recommended)
  {
    id: 'fal-ai/flux/dev',
    label: 'FLUX Dev',
    type: 'image',
    provider: 'fal.ai',
    description: 'FLUX development model - fast and high-quality image generation'
  },
  {
    id: 'fal-ai/flux/schnell',
    label: 'FLUX Schnell',
    type: 'image',
    provider: 'fal.ai',
    description: 'FLUX Schnell - ultra-fast image generation'
  },

  {
    id: 'fal-ai/stable-diffusion-v3-medium',
    label: 'Stable Diffusion 3',
    type: 'image',
    provider: 'fal.ai',
    description: 'Latest Stable Diffusion 3 model via fal.ai'
  },
  {
    id: 'fal-ai/photorealism',
    label: 'Photorealism',
    type: 'image',
    provider: 'fal.ai',
    description: 'Photorealistic image generation model'
  },
  // OpenAI Models
  {
    id: 'dalle-3',
    label: 'DALL-E 3',
    type: 'image',
    provider: 'OpenAI',
    description: 'Latest DALL-E model for high-quality image generation'
  },
  {
    id: 'dalle-2',
    label: 'DALL-E 2',
    type: 'image', 
    provider: 'OpenAI',
    description: 'Reliable DALL-E model for image generation'
  },
  // Other Image Models
  {
    id: 'midjourney-v6',
    label: 'Midjourney v6',
    type: 'image',
    provider: 'Midjourney',
    description: 'Latest Midjourney model for artistic image generation'
  },
  // fal.ai Video models
  {
    id: 'fal-ai/stable-video-diffusion',
    label: 'Stable Video Diffusion',
    type: 'video',
    provider: 'fal.ai',
    description: 'Video generation based on Stable Diffusion via fal.ai'
  },
  {
    id: 'fal-ai/runway-gen3',
    label: 'Runway Gen-3',
    type: 'video',
    provider: 'fal.ai',
    description: 'Runway Gen-3 video generation via fal.ai'
  },
  // Other Video Models
  {
    id: 'sora',
    label: 'Sora',
    type: 'video',
    provider: 'OpenAI',
    description: 'Advanced video generation model'
  },
  {
    id: 'pika-labs',
    label: 'Pika Labs',
    type: 'video',
    provider: 'Pika',
    description: 'AI video generation platform'
  }
];

interface MediaModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export const MediaModelSelector: React.FC<MediaModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedModelInfo = MEDIA_MODELS.find(model => model.id === selectedModel);
  const selectedLabel = selectedModelInfo?.label || 'Select Media Model';

  const handleSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  const getModelIcon = (type: 'image' | 'video') => {
    return type === 'image' ? 
      <Image className="w-3 h-3" /> : 
      <Video className="w-3 h-3" />;
  };

  const getModelTypeColor = (type: 'image' | 'video') => {
    return type === 'image' ? 
      'text-blue-600 dark:text-blue-400' : 
      'text-purple-600 dark:text-purple-400';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                className={cn(
                  "h-7 px-2 py-1 gap-1 text-xs border border-border/50 hover:border-border transition-colors",
                  "bg-background hover:bg-accent/20",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Palette className="w-3 h-3" />
                <span className="hidden sm:inline-block max-w-[100px] truncate">
                  {selectedLabel}
                </span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Select Image/Video Model</p>
          </TooltipContent>

          <DropdownMenuContent 
            align="end" 
            className="w-64 max-h-80 overflow-y-auto"
            sideOffset={4}
          >
            {/* Image Models Section */}
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/50">
              Image Models
            </div>
            {MEDIA_MODELS.filter(model => model.type === 'image').map((model) => (
              <DropdownMenuItem
                key={model.id}
                className="cursor-pointer px-3 py-2"
                onClick={() => handleSelect(model.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className={cn("flex items-center", getModelTypeColor(model.type))}>
                      {getModelIcon(model.type)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{model.label}</span>
                      <span className="text-xs text-muted-foreground">{model.provider}</span>
                    </div>
                  </div>
                  {selectedModel === model.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}

            {/* Video Models Section */}
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-t border-border/50 mt-1">
              Video Models
            </div>
            {MEDIA_MODELS.filter(model => model.type === 'video').map((model) => (
              <DropdownMenuItem
                key={model.id}
                className="cursor-pointer px-3 py-2"
                onClick={() => handleSelect(model.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className={cn("flex items-center", getModelTypeColor(model.type))}>
                      {getModelIcon(model.type)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{model.label}</span>
                      <span className="text-xs text-muted-foreground">{model.provider}</span>
                    </div>
                  </div>
                  {selectedModel === model.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}; 