import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { saveProgress } from '../utils/storage';

interface VideoPlayerProps {
  videoUrl: string;
  contentId: string;
  episodeId?: string;
  title: string;
  subTitle?: string;
  initialTime?: number;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, contentId, episodeId, title, subTitle, initialTime = 0, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [resumeTime] = useState(initialTime); 
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect if url is a direct file or needs an iframe
  const isGoogleDrive = videoUrl.includes('drive.google.com');
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const isDropboxDirect = videoUrl.includes('dl.dropboxusercontent.com');

  const isDirectFile = !isGoogleDrive && !isYouTube && (
    isDropboxDirect ||
    videoUrl.toLowerCase().endsWith('.mp4') || 
    videoUrl.toLowerCase().endsWith('.webm') || 
    videoUrl.toLowerCase().endsWith('.ogg')
  );

  // --- Fullscreen & Orientation Logic ---
  useEffect(() => {
    const enterFullScreenAndLockOrientation = async () => {
      try {
        const element = containerRef.current;
        if (!element) return;

        // 1. Tentar entrar em Fullscreen (Android / Desktop)
        if (!document.fullscreenElement) {
            try {
                if (element.requestFullscreen) {
                  await element.requestFullscreen();
                } else if ((element as any).webkitRequestFullscreen) {
                  await (element as any).webkitRequestFullscreen(); // Safari/iOS antigo
                } else if ((element as any).msRequestFullscreen) {
                  await (element as any).msRequestFullscreen(); // IE/Edge
                }
            } catch (fsErr) {
                // Fullscreen pode ser bloqueado se não houver interação do usuário ou iframe sandbox
                // Silenciosamente ignorar
            }
        }

        // 2. iOS Safari especifico para tag video
        if (isDirectFile && videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
           (videoRef.current as any).webkitEnterFullscreen();
        }

        // 3. Tentar travar a rotação em Paisagem (Android)
        // Isso geralmente requer que já esteja em fullscreen e context seguro (https/localhost)
        // Em iframes/sandbox (StackBlitz/CodeSandbox), isso falha frequentemente.
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (err) {
            // Silenciosamente ignorar erros de bloqueio de orientação
            // Isso evita mensagens de erro "sandbox" no console
          }
        }

        // 4. Forçar Play (Autoplay check)
        if (isDirectFile && videoRef.current) {
            try {
                await videoRef.current.play();
            } catch (err) {
                // Autoplay bloqueado pelo navegador
            }
        }

      } catch (err) {
        // Catch geral para evitar crash
      }
    };

    // Pequeno delay para garantir que o componente montou e a animação terminou
    const timer = setTimeout(() => {
        enterFullScreenAndLockOrientation();
    }, 100);

    return () => {
      clearTimeout(timer);
      // Sair do fullscreen e destravar rotação ao fechar
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      if (screen.orientation && (screen.orientation as any).unlock) {
        try {
            (screen.orientation as any).unlock();
        } catch (e) {}
      }
    };
  }, [isDirectFile]);

  // --- Logic for Direct Files (<video>) ---
  const handleLoadedMetadata = () => {
    if (isDirectFile && videoRef.current) {
        if (resumeTime > 0) {
            videoRef.current.currentTime = resumeTime;
        }
        // Tentar tocar novamente quando carregar metadados
        videoRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (isDirectFile && videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(() => {
        if (currentTime > 5) {
             saveProgress(contentId, currentTime, episodeId);
        }
      }, 2000);
    }
  };
  
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Controls Visibility
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove); // Mobile touch support
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex flex-col justify-center items-center w-full h-[100dvh] overflow-hidden"
    >
      {/* Back Button Overlay */}
      <div 
        className={`absolute top-0 left-0 w-full p-4 md:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-[110] ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button 
          onClick={onClose}
          className="flex items-center gap-4 text-white hover:text-gray-300 pointer-events-auto"
        >
          <ArrowLeft size={28} className="drop-shadow-lg" />
          <div className="drop-shadow-md">
            <h2 className="text-lg md:text-2xl font-bold leading-tight">{title}</h2>
            {subTitle && <p className="text-gray-300 text-xs md:text-sm">{subTitle}</p>}
          </div>
        </button>
      </div>

      {isDirectFile ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain bg-black"
            controls
            autoPlay
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            crossOrigin="anonymous" 
          />
          {resumeTime > 0 && videoRef.current && videoRef.current.currentTime < 1 && (
            <div className="absolute bottom-20 left-10 bg-black/80 px-4 py-2 rounded text-white animate-fade-in pointer-events-none z-[105]">
              Retomando...
            </div>
          )}
        </>
      ) : (
        <iframe 
          src={videoUrl} 
          className="w-full h-full border-0 bg-black" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          title={title}
        ></iframe>
      )}
    </div>
  );
};

export default VideoPlayer;