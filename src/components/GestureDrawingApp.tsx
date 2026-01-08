import { useRef, useState, useCallback, useEffect } from 'react';
import DrawingCanvas, { DrawingCanvasRef } from './DrawingCanvas';
import StatusPanel from './StatusPanel';
import { useHandGesture } from '@/hooks/useHandGesture';
import { useEmotionDetection } from '@/hooks/useEmotionDetection';
import { EMOTION_COLORS, type Gesture, type Emotion, type Point } from '@/types/gesture';
import { Camera, Sparkles, AlertCircle, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GestureDrawingApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const [currentColor, setCurrentColor] = useState(EMOTION_COLORS.neutral);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const lastActionRef = useRef<{ gesture: Gesture; time: number }>({ gesture: 'none', time: 0 });
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  const startCamera = useCallback(async () => {
    setCameraStatus('requesting');
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraStatus('active');
        setTrackingEnabled(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraStatus('error');
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('No camera found. Please connect a webcam.');
        } else if (error.name === 'NotReadableError') {
          setCameraError('Camera is in use by another application.');
        } else {
          setCameraError(`Camera error: ${error.message}`);
        }
      } else {
        setCameraError('Failed to access camera. Please try again.');
      }
    }
  }, []);

  const handleEmotionChange = useCallback((emotion: Emotion) => {
    setCurrentColor(EMOTION_COLORS[emotion]);
  }, []);

  const handleGestureChange = useCallback((gesture: Gesture) => {
    const now = Date.now();
    const lastAction = lastActionRef.current;
    
    if (gesture === lastAction.gesture && now - lastAction.time < 500) {
      return;
    }

    if (gesture === 'undo') {
      canvasRef.current?.undo();
      lastActionRef.current = { gesture, time: now };
    } else if (gesture === 'clear') {
      canvasRef.current?.clear();
      lastActionRef.current = { gesture, time: now };
    }
  }, []);

  const handleDrawPoint = useCallback((point: Point) => {
    canvasRef.current?.addPoint(point);
  }, []);

  const { gesture, isLoading: isHandLoading } = useHandGesture({
    videoRef,
    onGestureChange: handleGestureChange,
    onDrawPoint: handleDrawPoint,
    enabled: trackingEnabled,
  });

  const { emotion, isLoading: isEmotionLoading } = useEmotionDetection({
    videoRef,
    onEmotionChange: handleEmotionChange,
    enabled: trackingEnabled,
  });

  useEffect(() => {
    const updateCanvasSize = () => {
      const maxWidth = Math.min(window.innerWidth - 400, 1000);
      const maxHeight = Math.min(window.innerHeight - 200, 700);
      setCanvasSize({
        width: Math.max(600, maxWidth),
        height: Math.max(400, maxHeight),
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emotion-happy to-emotion-angry flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gesture Canvas</h1>
            <p className="text-sm text-muted-foreground">Draw with hand gestures • Colors follow your emotions</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto flex gap-6">
        {/* Canvas Area */}
        <div className="flex-1">
          <div className="canvas-container">
            <DrawingCanvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              currentColor={currentColor}
              isDrawing={gesture === 'draw'}
            />
            
            {/* Color indicator */}
            <div 
              className="absolute bottom-4 right-4 w-8 h-8 rounded-full border-2 border-white/20 shadow-lg transition-colors duration-300"
              style={{ backgroundColor: currentColor }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 space-y-4">
          {/* Camera Preview */}
          <div className="camera-preview">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-[4/3] object-cover bg-muted"
                style={{ display: cameraStatus === 'active' ? 'block' : 'none' }}
              />
              
              {/* Camera not started */}
              {cameraStatus === 'idle' && (
                <div className="w-full aspect-[4/3] bg-muted flex flex-col items-center justify-center gap-3 p-4">
                  <Video className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Camera access needed for gesture and emotion detection
                  </p>
                  <Button onClick={startCamera} size="sm" className="gap-2">
                    <Camera className="w-4 h-4" />
                    Enable Camera
                  </Button>
                </div>
              )}

              {/* Requesting permission */}
              {cameraStatus === 'requesting' && (
                <div className="w-full aspect-[4/3] bg-muted flex flex-col items-center justify-center gap-3 p-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground text-center">
                    Please allow camera access...
                  </p>
                </div>
              )}

              {/* Error state */}
              {cameraStatus === 'error' && (
                <div className="w-full aspect-[4/3] bg-muted flex flex-col items-center justify-center gap-3 p-4">
                  <AlertCircle className="w-10 h-10 text-destructive" />
                  <p className="text-sm text-destructive text-center">
                    {cameraError}
                  </p>
                  <Button onClick={startCamera} variant="outline" size="sm" className="gap-2">
                    Try Again
                  </Button>
                </div>
              )}

              {/* Live indicator */}
              {cameraStatus === 'active' && (
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm">
                  <Camera className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Live</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                </div>
              )}
            </div>
          </div>

          {/* Status Panel */}
          <StatusPanel
            gesture={gesture}
            emotion={emotion}
            isHandLoading={isHandLoading || !trackingEnabled}
            isEmotionLoading={isEmotionLoading || !trackingEnabled}
          />
        </div>
      </main>
    </div>
  );
}
