import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import type { AttentionState, AttentionData } from '@/types/attention';

interface UseAttentionTrackingOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  onStateChange?: (state: AttentionState) => void;
  enabled?: boolean;
}

export function useAttentionTracking({ videoRef, onStateChange, enabled = false }: UseAttentionTrackingOptions) {
  const [attentionState, setAttentionState] = useState<AttentionState>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const historyRef = useRef<AttentionData[]>([]);
  const lastFaceDetectedRef = useRef<number>(Date.now());
  const blinkCountRef = useRef<number>(0);
  const lastEyeStateRef = useRef<boolean>(true);

  const loadModels = useCallback(async () => {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      
      setModelsLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading face-api models:', error);
      setIsLoading(false);
    }
  }, []);

  const analyzeAttention = useCallback((
    landmarks: faceapi.FaceLandmarks68,
    expressions: faceapi.FaceExpressions,
    detection: faceapi.FaceDetection
  ): AttentionState => {
    const now = Date.now();
    
    // Check if face is centered (looking at screen)
    const box = detection.box;
    const centerX = box.x + box.width / 2;
    const videoWidth = videoRef.current?.videoWidth || 640;
    const isCentered = Math.abs(centerX - videoWidth / 2) < videoWidth * 0.25;
    
    // Check eye openness using landmarks
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    const getEyeOpenness = (eye: faceapi.Point[]) => {
      const height = Math.abs(eye[1].y - eye[5].y + eye[2].y - eye[4].y) / 2;
      const width = Math.abs(eye[3].x - eye[0].x);
      return height / width;
    };
    
    const leftOpenness = getEyeOpenness(leftEye);
    const rightOpenness = getEyeOpenness(rightEye);
    const avgOpenness = (leftOpenness + rightOpenness) / 2;
    
    // Track blink rate
    const eyesOpen = avgOpenness > 0.15;
    if (lastEyeStateRef.current && !eyesOpen) {
      blinkCountRef.current++;
    }
    lastEyeStateRef.current = eyesOpen;
    
    // Calculate blink rate per minute from history
    const historyWindow = historyRef.current.filter(h => now - h.timestamp < 60000);
    
    // Analyze expressions
    const { neutral, happy, sad, surprised } = expressions;
    
    // Determine attention state
    if (!isCentered) {
      return 'distracted';
    }
    
    if (avgOpenness < 0.12 || sad > 0.3) {
      return 'restless'; // Drowsy or uncomfortable
    }
    
    if (blinkCountRef.current > 30 && historyWindow.length > 10) {
      blinkCountRef.current = 0;
      return 'restless'; // High blink rate indicates fatigue
    }
    
    if ((neutral > 0.4 || happy > 0.3) && isCentered && avgOpenness > 0.18) {
      return 'focused';
    }
    
    if (surprised > 0.3 || !isCentered) {
      return 'distracted';
    }
    
    return 'focused';
  }, [videoRef]);

  const detectAttention = useCallback(async () => {
    if (!videoRef.current || !modelsLoaded || videoRef.current.readyState < 2) return;

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const now = Date.now();

      if (detections) {
        lastFaceDetectedRef.current = now;
        
        const state = analyzeAttention(
          detections.landmarks,
          detections.expressions,
          detections.detection
        );
        
        // Add to history
        historyRef.current.push({
          state,
          confidence: detections.detection.score,
          timestamp: now,
        });
        
        // Keep only last 30 seconds
        historyRef.current = historyRef.current.filter(h => now - h.timestamp < 30000);
        
        // Stabilize state - require 3 consecutive same states
        const recentStates = historyRef.current.slice(-5).map(h => h.state);
        const stableState = recentStates.filter(s => s === state).length >= 3 ? state : attentionState;
        
        if (stableState !== attentionState) {
          setAttentionState(stableState);
          onStateChange?.(stableState);
        }
      } else {
        // No face detected for 3 seconds = distracted
        if (now - lastFaceDetectedRef.current > 3000 && attentionState !== 'distracted') {
          setAttentionState('distracted');
          onStateChange?.('distracted');
        }
      }
    } catch (error) {
      // Silently handle detection errors
    }
  }, [videoRef, modelsLoaded, attentionState, analyzeAttention, onStateChange]);

  useEffect(() => {
    if (enabled) {
      loadModels();
    }
  }, [loadModels, enabled]);

  useEffect(() => {
    if (!modelsLoaded || !videoRef.current || !enabled) return;

    intervalRef.current = setInterval(detectAttention, 300);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [modelsLoaded, videoRef, detectAttention, enabled]);

  const resetTracking = useCallback(() => {
    historyRef.current = [];
    blinkCountRef.current = 0;
    setAttentionState('unknown');
  }, []);

  return { attentionState, isLoading, resetTracking };
}
