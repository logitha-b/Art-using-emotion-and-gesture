import { useRef, useState, useCallback, useEffect } from 'react';
import DrawingCanvas, { DrawingCanvasRef } from '@/components/DrawingCanvas';
import StatusPanel from '@/components/StatusPanel';
import { useHandGesture } from '@/hooks/useHandGesture';
import { useEmotionDetection } from '@/hooks/useEmotionDetection';
import { EMOTION_COLORS, type Gesture, type Emotion, type Point } from '@/types/gesture';
import { Camera, Hand, AlertCircle, Video, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function GestureDrawingTab() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const [currentColor, setCurrentColor] = useState(EMOTION_COLORS.neutral);
  const [canvasSize, setCanvasSize] = useState({ width: 700, height: 500 });
  const lastActionRef = useRef<{ gesture: Gesture; time: number }>({ gesture: 'none', time: 0 });
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  const startCamera = useCallback(async () => {
    setCameraStatus('requesting');
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
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
          setCameraError('Camera permission denied.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('No camera found.');
        } else {
          setCameraError(`Camera error: ${error.message}`);
        }
      } else {
        setCameraError('Failed to access camera.');
      }
    }
  }, []);

  const handleEmotionChange = useCallback((emotion: Emotion) => {
    setCurrentColor(EMOTION_COLORS[emotion]);
  }, []);

  const handleGestureChange = useCallback((gesture: Gesture) => {
    const now = Date.now();
    const lastAction = lastActionRef.current;

    if (gesture === lastAction.gesture && now - lastAction.time < 500) return;

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

  const downloadCanvas = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'gesture-drawing.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  useEffect(() => {
    const updateCanvasSize = () => {
      const maxWidth = Math.min(window.innerWidth - 400, 800);
      const maxHeight = Math.min(window.innerHeight - 300, 600);
      setCanvasSize({
        width: Math.max(500, maxWidth),
        height: Math.max(350, maxHeight),
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emotion-happy to-emotion-angry flex items-center justify-center">
            <Hand className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Gesture Canvas</h2>
            <p className="text-sm text-muted-foreground">Draw with hand gestures • Colors follow your emotions</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={downloadCanvas} className="gap-2">
          <Download className="w-4 h-4" />
          Save Drawing
        </Button>
      </header>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Canvas */}
        <Card className="flex-1">
          <CardContent className="p-4 h-full flex items-center justify-center">
            <div className="canvas-container relative">
              <DrawingCanvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                currentColor={currentColor}
                isDrawing={gesture === 'draw'}
              />
              <div
                className="absolute bottom-4 right-4 w-8 h-8 rounded-full border-2 border-white/20 shadow-lg transition-colors duration-300"
                style={{ backgroundColor: currentColor }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="w-64 space-y-4">
          {/* Camera Preview */}
          <Card>
            <CardContent className="p-3">
              <div className="relative rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-[4/3] object-cover bg-muted"
                  style={{ display: cameraStatus === 'active' ? 'block' : 'none' }}
                />

                {cameraStatus === 'idle' && (
                  <div className="w-full aspect-[4/3] bg-muted flex flex-col items-center justify-center gap-2 p-3">
                    <Video className="w-8 h-8 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground text-center">Enable camera for gesture control</p>
                    <Button onClick={startCamera} size="sm" className="gap-2">
                      <Camera className="w-3 h-3" />
                      Enable
                    </Button>
                  </div>
                )}

                {cameraStatus === 'requesting' && (
                  <div className="w-full aspect-[4/3] bg-muted flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground">Requesting access...</p>
                  </div>
                )}

                {cameraStatus === 'error' && (
                  <div className="w-full aspect-[4/3] bg-muted flex flex-col items-center justify-center gap-2 p-3">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                    <p className="text-xs text-destructive text-center">{cameraError}</p>
                    <Button onClick={startCamera} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                )}

                {cameraStatus === 'active' && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-background/80 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">Live</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <StatusPanel
            gesture={gesture}
            emotion={emotion}
            isHandLoading={isHandLoading || !trackingEnabled}
            isEmotionLoading={isEmotionLoading || !trackingEnabled}
          />
        </div>
      </div>
    </div>
  );
}
