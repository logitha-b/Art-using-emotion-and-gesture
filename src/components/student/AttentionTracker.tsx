import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAttentionTracking } from '@/hooks/useAttentionTracking';
import { ATTENTION_INTERVENTIONS, ATTENTION_COLORS, type AttentionState } from '@/types/attention';
import { Camera, Eye, AlertCircle, Video, Brain, Wind, HelpCircle, Star } from 'lucide-react';
import BreathingExercise from './BreathingExercise';
import QuickQuiz from './QuickQuiz';

export default function AttentionTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [showIntervention, setShowIntervention] = useState(false);
  const [interventionType, setInterventionType] = useState<'breathing' | 'quiz' | null>(null);
  const [focusStreak, setFocusStreak] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const lastStateRef = useRef<AttentionState>('unknown');
  const stateStartTimeRef = useRef<number>(Date.now());

  const handleStateChange = useCallback((state: AttentionState) => {
    const now = Date.now();
    const duration = now - stateStartTimeRef.current;
    
    // Track focus time
    if (lastStateRef.current === 'focused') {
      setTotalFocusTime(prev => prev + duration);
    }
    
    stateStartTimeRef.current = now;
    lastStateRef.current = state;

    // Show interventions based on state
    if (state === 'distracted' && duration > 5000) {
      setInterventionType('quiz');
      setShowIntervention(true);
      setFocusStreak(0);
    } else if (state === 'restless') {
      setInterventionType('breathing');
      setShowIntervention(true);
      setFocusStreak(0);
    } else if (state === 'focused') {
      setFocusStreak(prev => prev + 1);
    }
  }, []);

  const { attentionState, isLoading, resetTracking } = useAttentionTracking({
    videoRef,
    onStateChange: handleStateChange,
    enabled: trackingEnabled,
  });

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

  const closeIntervention = () => {
    setShowIntervention(false);
    setInterventionType(null);
    resetTracking();
  };

  // Update focus time counter
  useEffect(() => {
    if (attentionState === 'focused' && trackingEnabled) {
      const interval = setInterval(() => {
        setTotalFocusTime(prev => prev + 1000);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [attentionState, trackingEnabled]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const intervention = attentionState !== 'unknown' ? ATTENTION_INTERVENTIONS[attentionState] : null;

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Focus Tracker</h2>
          <p className="text-sm text-muted-foreground">AI-powered attention monitoring with helpful interventions</p>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Camera Preview */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="relative flex-1 rounded-xl overflow-hidden bg-muted">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: cameraStatus === 'active' ? 'block' : 'none' }}
              />

              {cameraStatus === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                  <Video className="w-16 h-16 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">
                    Enable camera to start attention tracking
                  </p>
                  <Button onClick={startCamera} className="gap-2">
                    <Camera className="w-4 h-4" />
                    Start Tracking
                  </Button>
                </div>
              )}

              {cameraStatus === 'requesting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground">Requesting camera access...</p>
                </div>
              )}

              {cameraStatus === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                  <AlertCircle className="w-16 h-16 text-destructive" />
                  <p className="text-destructive text-center">{cameraError}</p>
                  <Button onClick={startCamera} variant="outline">
                    Try Again
                  </Button>
                </div>
              )}

              {/* Status Overlay */}
              {cameraStatus === 'active' && (
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 backdrop-blur-sm">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">Tracking Active</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  
                  <div
                    className="px-4 py-2 rounded-lg font-semibold text-sm backdrop-blur-sm"
                    style={{
                      backgroundColor: `${ATTENTION_COLORS[attentionState]}20`,
                      color: ATTENTION_COLORS[attentionState],
                      border: `1px solid ${ATTENTION_COLORS[attentionState]}40`,
                    }}
                  >
                    {attentionState.charAt(0).toUpperCase() + attentionState.slice(1)}
                  </div>
                </div>
              )}

              {/* Intervention Message */}
              {cameraStatus === 'active' && intervention && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="px-4 py-3 rounded-lg bg-background/90 backdrop-blur-sm border flex items-center gap-3">
                    <span className="text-2xl">{intervention.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{intervention.title}</p>
                      <p className="text-xs text-muted-foreground">{intervention.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Focus Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Focus Time</p>
                <p className="text-3xl font-bold text-primary">{formatTime(totalFocusTime)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Focus Streak</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  {focusStreak}
                  {focusStreak >= 5 && <span className="text-yellow-500">🔥</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setInterventionType('breathing');
                  setShowIntervention(true);
                }}
              >
                <Wind className="w-4 h-4" />
                Breathing Exercise
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setInterventionType('quiz');
                  setShowIntervention(true);
                }}
              >
                <HelpCircle className="w-4 h-4" />
                Quick Quiz
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>🟢 <strong>Focused:</strong> Eyes on screen, steady posture</p>
              <p>🟠 <strong>Distracted:</strong> Looking away or no face detected</p>
              <p>🔴 <strong>Restless:</strong> Drowsy or uncomfortable</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Intervention Modals */}
      {showIntervention && interventionType === 'breathing' && (
        <BreathingExercise onClose={closeIntervention} />
      )}
      {showIntervention && interventionType === 'quiz' && (
        <QuickQuiz onClose={closeIntervention} />
      )}
    </div>
  );
}
