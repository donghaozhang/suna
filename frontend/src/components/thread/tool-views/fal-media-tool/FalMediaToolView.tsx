import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, ImageOff, CheckCircle, AlertTriangle, Loader2, Download, ZoomIn, ZoomOut, ExternalLink, Palette, Sparkles } from 'lucide-react';
import { ToolViewProps } from '../types';
import { formatTimestamp } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, truncateString } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkspaceFileView } from '../shared/WorkspaceFileView';

interface FalMediaData {
  success?: boolean;
  images?: string[];
  videos?: string[];
  saved_files?: string[];
  request_id?: string;
  error?: string;
}

function SafeGeneratedImage({ 
  src, 
  alt, 
  filePath, 
  className,
  isWorkspaceFile = false 
}: { 
  src: string; 
  alt: string; 
  filePath?: string;
  className?: string;
  isWorkspaceFile?: boolean;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const { session } = useAuth();

  useEffect(() => {
    const setupImage = async () => {
      if (isWorkspaceFile && filePath && src.includes('/sandboxes/')) {
        // For workspace files, use authenticated fetch
        try {
          const response = await fetch(src, {
            headers: {
              'Authorization': `Bearer ${session?.access_token}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to load image: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setImgSrc(url);
        } catch (err) {
          console.error('Error loading workspace image:', err);
          setError(true);
        }
      } else {
        // For external URLs (fal.ai), use direct src
        setImgSrc(src);
      }
    };
    
    setupImage();
    setError(false);
    
    return () => {
      if (imgSrc && imgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imgSrc);
      }
    };
  }, [src, session?.access_token, isWorkspaceFile, filePath]);

  const handleZoomToggle = () => {
    setIsZoomed(!isZoomed);
    setZoomLevel(1);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
    if (!isZoomed) setIsZoomed(true);
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imgSrc) return;
    
    const link = document.createElement('a');
    link.href = imgSrc;
    link.download = filePath?.split('/').pop() || 'generated_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64 bg-gradient-to-b from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 shadow-inner">
        <div className="bg-white dark:bg-black/30 p-3 rounded-full shadow-md mb-3">
          <ImageOff className="h-8 w-8 text-rose-500 dark:text-rose-400" />
        </div>
        <p className="text-sm font-medium">Unable to load generated image</p>
        <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-1 max-w-xs text-center break-all">
          {filePath || src}
        </p>
      </div>
    );
  }

  if (!imgSrc) {
    return (
      <div className="flex py-8 flex-col items-center justify-center w-full h-64 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900/50 dark:to-zinc-800/30 rounded-lg border-zinc-200 dark:border-zinc-700/50 shadow-inner">
        <div className="space-y-2 w-full max-w-md py-8">
          <Skeleton className="h-8 w-8 rounded-full mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-64 w-full rounded-lg mt-4" />
          <div className="flex justify-center gap-2 mt-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "overflow-hidden transition-all duration-300 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 mb-3",
        isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
      )}>
        <div className="relative flex items-center justify-center">
          <img
            src={imgSrc}
            alt={alt}
            onClick={handleZoomToggle}
            className={cn(
              "max-w-full object-contain transition-all duration-300 ease-in-out",
              isZoomed 
                ? "max-h-[80vh]" 
                : "max-h-[500px] hover:scale-[1.01]",
              className
            )}
            style={{
              transform: isZoomed ? `scale(${zoomLevel})` : 'none',
            }}
            onError={() => setError(true)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between w-full px-2 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 shadow-sm">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Generated
        </Badge>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-md bg-white dark:bg-zinc-800"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-mono px-2 text-zinc-700 dark:text-zinc-300 min-w-12 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-md bg-white dark:bg-zinc-800"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-md bg-white dark:bg-zinc-800"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          
          {!isWorkspaceFile && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md bg-white dark:bg-zinc-800"
              onClick={(e) => {
                e.stopPropagation();
                window.open(src, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function parseFalMediaData(content: string | object | undefined | null): FalMediaData | null {
  if (!content) return null;
  
  try {
    let data: any = typeof content === 'string' ? JSON.parse(content) : content;
    
    return {
      success: data.success,
      images: data.images || [],
      videos: data.videos || [],
      saved_files: data.saved_files || [],
      request_id: data.request_id,
      error: data.error || '',
    };
  } catch (error) {
    console.error('[FalMediaToolView] Error parsing fal media data:', error);
    if (typeof content === 'string') {
        // Fallback for plain text success message
        if (content.includes("Successfully generated and saved")) {
            const filePaths = content.match(/- (generated_images\/.*)/g)?.map(m => m.substring(2));
            return { success: true, saved_files: filePaths };
        }
    }
    return null;
  }
}

export function FalMediaToolView({
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
  name,
  project,
}: ToolViewProps) {
  const [mediaData, setMediaData] = useState<FalMediaData | null>(null);

  useEffect(() => {
    const data = parseFalMediaData(toolContent);
    setMediaData(data);
  }, [toolContent]);

  const constructWorkspaceImageUrl = (filePath: string) => {
    if (!project?.sandbox?.id) return '';
    
    let normalizedPath = filePath;
    if (!normalizedPath.startsWith('/workspace')) {
      normalizedPath = `/workspace/${normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath}`;
    }
    
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/sandboxes/${project.sandbox.id}/files/content?path=${encodeURIComponent(normalizedPath)}`;
  };

  if (isStreaming) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
              <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">AI Image Generation</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTimestamp(assistantTimestamp)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs font-medium">Generating...</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900/50 dark:to-zinc-800/30 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="space-y-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  Creating your image...
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  This may take a few moments
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSuccess || !mediaData?.success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-medium">AI Image Generation Failed</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTimestamp(toolTimestamp)}
              </p>
            </div>
            <Badge variant="destructive" className="text-xs">
              Error
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              {mediaData?.error || 'Failed to generate image. Please try again.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const savedFiles = mediaData.saved_files || [];
  const externalImages = mediaData.images || [];
  const hasImages = savedFiles.length > 0 || externalImages.length > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
            <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">AI Image Generated Successfully</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTimestamp(toolTimestamp)}
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {hasImages ? (
          <div className="space-y-4">
            {/* Display saved workspace files first */}
            {savedFiles.map((filePath, index) => {
              const imageUrl = constructWorkspaceImageUrl(filePath);
              return (
                <div key={`saved-${index}`} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    <span>Saved to workspace: {filePath}</span>
                  </div>
                  <WorkspaceFileView filePath={filePath} />
                </div>
              );
            })}
            
            {/* Display external URLs if no saved files */}
            {savedFiles.length === 0 && externalImages.map((imageUrl, index) => (
              <div key={`external-${index}`} className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ExternalLink className="h-4 w-4" />
                  <span>External image URL</span>
                </div>
                <SafeGeneratedImage
                  src={imageUrl}
                  alt={`Generated image ${index + 1}`}
                  isWorkspaceFile={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Image generation completed but no images were returned.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 