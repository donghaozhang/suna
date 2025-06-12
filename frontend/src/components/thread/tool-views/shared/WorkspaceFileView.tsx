import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getMimeType, isImage, isVideo, isText, isPdf, isAudio } from '../utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileWarning, File as FileIcon, Image as ImageIcon, Video, FileText, FileAudio, ExternalLink, Download } from 'lucide-react';
import { useProject } from '@/hooks/react-query/threads/use-project';
import { Button } from '@/components/ui/button';
import { PdfRenderer } from '@/components/file-renderers/pdf-renderer';
import { CodeRenderer } from '@/components/file-renderers/code-renderer';

interface WorkspaceFileViewProps {
  filePath: string;
}

export const WorkspaceFileView: React.FC<WorkspaceFileViewProps> = ({ filePath }) => {
  const { session } = useAuth();
  const { project } = useProject();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [fileSize, setFileSize] = useState(0);

  useEffect(() => {
    if (!session || !project || !filePath) return;

    const fetchFile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabase = getSupabaseClient(session.access_token);
        const { data, error: fetchError } = await supabase.functions.invoke('get-sandbox-file-url', {
          body: {
            projectId: project.project_id,
            path: filePath,
          }
        });

        if (fetchError || data.error) {
          throw new Error(fetchError?.message || data.error);
        }

        const { signedURL, fileMetadata } = data;
        setFileUrl(signedURL);

        const fetchedMimeType = getMimeType(filePath);
        setMimeType(fetchedMimeType);
        setFileSize(fileMetadata?.size || 0);

        if (isText(fetchedMimeType)) {
          const response = await fetch(signedURL);
          if (response.ok) {
            let text = await response.text();
            if (text.length > 2000) {
              text = text.substring(0, 2000);
              setIsTruncated(true);
            }
            setFileContent(text);
          }
        }
      } catch (e: any) {
        setError(e.message || "Failed to fetch file.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFile();
  }, [filePath, session, project]);

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-md" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <FileWarning className="h-4 w-4" />
        <AlertTitle>Error Loading File</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const renderFile = () => {
    if (!fileUrl) return null;

    if (isImage(mimeType)) {
      return <img src={fileUrl} alt={filePath} className="max-w-full h-auto rounded-md object-contain" />;
    }
    if (isVideo(mimeType)) {
      return <video src={fileUrl} controls className="max-w-full h-auto rounded-md" />;
    }
    if (isAudio(mimeType)) {
      return <audio src={fileUrl} controls className="w-full" />;
    }
    if (isPdf(mimeType)) {
      return <PdfRenderer url={fileUrl} />;
    }
    if (isText(mimeType)) {
      return <CodeRenderer content={fileContent || ''} filePath={filePath} />;
    }
    
    return (
      <div className="flex items-center gap-2 p-2 border rounded-md">
        <FileIcon className="h-6 w-6" />
        <span className="font-mono text-sm">{filePath}</span>
      </div>
    );
  };

  return (
    <div className="p-2 border rounded-lg bg-secondary/30 relative group">
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button variant="ghost" size="icon" asChild>
          <a href={fileUrl || '#'} download={filePath.split('/').pop()} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </div>
      <div className='flex items-center justify-center'>
        {renderFile()}
      </div>
      <div className="text-xs text-muted-foreground mt-1 text-center font-mono">
        {filePath} ({ (fileSize / 1024).toFixed(2) } KB)
      </div>
    </div>
  );
}; 