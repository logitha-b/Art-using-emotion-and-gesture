import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import type { Emotion } from '@/types/gesture';

interface UseEmotionDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  onEmotionChange?: (emotion: Emotion) => void;
}

export function useEmotionDetection({ videoRef, onEmotionChange }: UseEmotionDetectionOptions) {
  const [emotion, setEmotion] = useState<Emotion>('neutral');
  const [isLoading, setIsLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadModels = useCallback(async () => {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      
      setModelsLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading face-api models:', error);
      setIsLoading(false);
    }
  }, []);

  const mapExpressionToEmotion = useCallback((expressions: faceapi.FaceExpressions): Emotion => {
    const { happy, sad, angry, neutral, surprised, fearful, disgusted } = expressions;
    
    // Find the dominant expression
    const expressionMap: Record<string, number> = {
      happy: happy,
      sad: sad + fearful,
      angry: angry + disgusted,
      neutral: neutral + surprised * 0.5,
    };

    let maxExpression: Emotion = 'neutral';
    let maxValue = 0;

    for (const [expr, value] of Object.entries(expressionMap)) {
      if (value > maxValue) {
        maxValue = value;
        maxExpression = expr as Emotion;
      }
    }

    return maxExpression;
  }, []);

  const detectEmotion = useCallback(async () => {
    if (!videoRef.current || !modelsLoaded) return;

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections) {
        const detectedEmotion = mapExpressionToEmotion(detections.expressions);
        if (detectedEmotion !== emotion) {
          setEmotion(detectedEmotion);
          onEmotionChange?.(detectedEmotion);
        }
      }
    } catch (error) {
      // Silently handle detection errors
    }
  }, [videoRef, modelsLoaded, emotion, mapExpressionToEmotion, onEmotionChange]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    if (!modelsLoaded || !videoRef.current) return;

    // Run detection every 200ms for smooth updates
    intervalRef.current = setInterval(detectEmotion, 200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [modelsLoaded, videoRef, detectEmotion]);

  return { emotion, isLoading };
}
