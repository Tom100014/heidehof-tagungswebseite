import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UniversalIframeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  title: string;
  description?: string;
  allowMicrophone?: boolean;
  allowCamera?: boolean;
  allowPayment?: boolean;
  fallbackUrl?: string;
  customSandbox?: string;
}

const UniversalIframeModal = ({
  open,
  onOpenChange,
  src,
  title,
  description,
  allowMicrophone = false,
  allowCamera = false,
  allowPayment = false,
  fallbackUrl,
  customSandbox
}: UniversalIframeModalProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMobile = useIsMobile();

  // Enhanced sandbox attributes
  const getSandboxAttributes = () => {
    if (customSandbox) return customSandbox;
    
    const baseAttributes = [
      'allow-same-origin',
      'allow-scripts',
      'allow-popups',
      'allow-forms',
      'allow-top-navigation-by-user-activation',
      'allow-downloads'
    ];

    if (allowPayment) baseAttributes.push('allow-payment');
    
    return baseAttributes.join(' ');
  };

  // Enhanced allow attributes
  const getAllowAttributes = () => {
    const baseAttributes = [
      'accelerometer',
      'autoplay',
      'clipboard-write',
      'encrypted-media',
      'gyroscope',
      'picture-in-picture'
    ];

    if (allowMicrophone) baseAttributes.push('microphone');
    if (allowCamera) baseAttributes.push('camera');
    if (allowPayment) baseAttributes.push('payment');

    return baseAttributes.join('; ');
  };

  // Error detection and fallback
  useEffect(() => {
    if (!open) {
      setLoading(true);
      setError(false);
      setRetryCount(0);
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setLoading(false);
      setError(false);
    };

    const handleError = () => {
      setLoading(false);
      setError(true);
    };

    // X-Frame-Options detection
    const checkFrameAccess = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          setTimeout(() => {
            if (loading) {
              setLoading(false);
              setError(true);
            }
          }, 5000);
        }
      } catch (e) {
        // Cross-origin blocked - expected for external sites
      }
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);
    
    setTimeout(checkFrameAccess, 1000);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, [open, src, retryCount, loading]);

  const handleOpenExternal = () => {
    const url = fallbackUrl || src;
    window.open(url, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  };

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setRetryCount(prev => prev + 1);
    
    // Force iframe reload
    if (iframeRef.current) {
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = `${src}?retry=${retryCount + 1}`;
        }
      }, 100);
    }
  };

  // Responsive sizing
  const getModalClasses = () => {
    if (isMobile) {
      return "!max-w-none !w-[98vw] !h-[98vh] !m-1";
    }
    return "!max-w-none !w-[95vw] !h-[95vh]";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${getModalClasses()} p-0 bg-background overflow-hidden`}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {description && (
          <DialogDescription className="sr-only">{description}</DialogDescription>
        )}
        
        {/* Loading State */}
        {loading && !error && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Lade {title}...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-background z-10 flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-md">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-lg font-semibold">Inhalt kann nicht geladen werden</h3>
              <p className="text-sm text-muted-foreground">
                Die Seite kann nicht in einem eingebetteten Fenster angezeigt werden.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRetry} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Erneut versuchen
                </Button>
                <Button onClick={handleOpenExternal} size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Extern öffnen
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Iframe with enhanced attributes */}
        <iframe
          ref={iframeRef}
          src={`${src}${retryCount > 0 ? `?retry=${retryCount}` : ''}`}
          className="w-full h-full border-0 rounded-lg"
          title={title}
          allow={getAllowAttributes()}
          sandbox={getSandboxAttributes()}
          loading="eager"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none'
          }}
        />

        {/* Quick External Access Button */}
        {!error && (
          <Button
            onClick={handleOpenExternal}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UniversalIframeModal;