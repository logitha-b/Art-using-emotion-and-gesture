import { useCallback, useRef, useState, useEffect } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import type { Gesture, Point } from '@/types/gesture';

interface UseHandGestureOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  onGestureChange?: (gesture: Gesture) => void;
  onDrawPoint?: (point: Point) => void;
  enabled?: boolean;
}

export function useHandGesture({ videoRef, onGestureChange, onDrawPoint, enabled = false }: UseHandGestureOptions) {
  const [gesture, setGesture] = useState<Gesture>('none');
  const [isLoading, setIsLoading] = useState(true);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const lastGestureRef = useRef<Gesture>('none');
  const gestureStabilityRef = useRef<number>(0);

  const detectGesture = useCallback((landmarks: any[]): Gesture => {
    if (!landmarks || landmarks.length === 0) return 'none';

    const hand = landmarks[0];
    
    // Finger tip and pip (middle joint) indices
    const fingerTips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky
    const fingerPips = [6, 10, 14, 18];
    
    // Check which fingers are extended
    const fingersExtended = fingerTips.map((tip, i) => {
      return hand[tip].y < hand[fingerPips[i]].y;
    });

    const [indexExtended, middleExtended, ringExtended, pinkyExtended] = fingersExtended;
    
    // Fist: no fingers extended
    if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return 'clear';
    }

    // Index finger only: draw
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return 'draw';
    }

    // Index + Middle fingers: undo
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      return 'undo';
    }

    return 'none';
  }, []);

  const onResults = useCallback((results: Results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const detectedGesture = detectGesture(results.multiHandLandmarks);
      
      // Stability check - require same gesture for 3 frames
      if (detectedGesture === lastGestureRef.current) {
        gestureStabilityRef.current++;
      } else {
        gestureStabilityRef.current = 0;
        lastGestureRef.current = detectedGesture;
      }

      if (gestureStabilityRef.current >= 3 && detectedGesture !== gesture) {
        setGesture(detectedGesture);
        onGestureChange?.(detectedGesture);
      }

      // Send drawing point when drawing
      if (detectedGesture === 'draw' && results.multiHandLandmarks[0]) {
        const indexTip = results.multiHandLandmarks[0][8];
        onDrawPoint?.({
          x: 1 - indexTip.x, // Mirror the x coordinate
          y: indexTip.y,
        });
      }
    } else {
      if (gesture !== 'none') {
        setGesture('none');
        onGestureChange?.('none');
      }
    }
  }, [detectGesture, gesture, onGestureChange, onDrawPoint]);

  useEffect(() => {
    if (!videoRef.current || !enabled) {
      setIsLoading(false);
      return;
    }

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    // Use requestAnimationFrame loop instead of Camera utility
    let animationId: number;
    let isProcessing = false;

    const processFrame = async () => {
      if (videoRef.current && handsRef.current && videoRef.current.readyState >= 2) {
        if (!isProcessing) {
          isProcessing = true;
          try {
            await handsRef.current.send({ image: videoRef.current });
          } catch (e) {
            console.error('Hand tracking error:', e);
          }
          isProcessing = false;
        }
      }
      animationId = requestAnimationFrame(processFrame);
    };

    // Wait for video to be ready
    const startProcessing = () => {
      if (videoRef.current?.readyState >= 2) {
        setIsLoading(false);
        processFrame();
      } else {
        videoRef.current?.addEventListener('loadeddata', () => {
          setIsLoading(false);
          processFrame();
        }, { once: true });
      }
    };

    startProcessing();

    return () => {
      cancelAnimationFrame(animationId);
      hands.close();
    };
  }, [videoRef, onResults, enabled]);

  return { gesture, isLoading };
}
