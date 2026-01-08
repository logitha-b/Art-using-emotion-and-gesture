import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface BreathingExerciseProps {
  onClose: () => void;
}

const PHASES = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'] as const;
const PHASE_DURATIONS = [4, 4, 4, 4]; // seconds

export default function BreathingExercise({ onClose }: BreathingExerciseProps) {
  const [cycle, setCycle] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(PHASE_DURATIONS[0]);
  const [isComplete, setIsComplete] = useState(false);

  const totalCycles = 3;

  useEffect(() => {
    if (isComplete) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Move to next phase
          const nextPhaseIndex = (phaseIndex + 1) % PHASES.length;
          
          if (nextPhaseIndex === 0) {
            // Completed one cycle
            if (cycle + 1 >= totalCycles) {
              setIsComplete(true);
              return 0;
            }
            setCycle(cycle + 1);
          }
          
          setPhaseIndex(nextPhaseIndex);
          return PHASE_DURATIONS[nextPhaseIndex];
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phaseIndex, cycle, isComplete]);

  const phase = PHASES[phaseIndex];
  const progress = ((cycle * 4 + phaseIndex) / (totalCycles * 4)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="relative max-w-md w-full mx-4 p-8 rounded-2xl bg-card border shadow-2xl text-center">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>

        {isComplete ? (
          <>
            <div className="text-6xl mb-4">🧘</div>
            <h2 className="text-2xl font-bold mb-2">Well Done!</h2>
            <p className="text-muted-foreground mb-6">
              You completed the breathing exercise. You should feel more calm and focused now.
            </p>
            <Button onClick={onClose}>Continue Learning</Button>
          </>
        ) : (
          <>
            <div className="text-4xl mb-6">🌬️</div>
            <h2 className="text-xl font-bold mb-2">Deep Breathing</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Cycle {cycle + 1} of {totalCycles}
            </p>

            {/* Breathing Circle */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <div
                className={`absolute inset-0 rounded-full border-4 border-primary/30 transition-transform duration-1000 ${
                  phase === 'Breathe In' ? 'scale-100' : phase === 'Breathe Out' ? 'scale-75' : ''
                }`}
                style={{
                  transform: phase === 'Breathe In' 
                    ? 'scale(1.2)' 
                    : phase === 'Breathe Out' 
                    ? 'scale(0.8)' 
                    : 'scale(1)',
                }}
              />
              <div
                className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center transition-transform duration-1000"
                style={{
                  transform: phase === 'Breathe In' 
                    ? 'scale(1.15)' 
                    : phase === 'Breathe Out' 
                    ? 'scale(0.85)' 
                    : 'scale(1)',
                }}
              >
                <div className="text-center">
                  <p className="text-lg font-semibold text-primary">{phase}</p>
                  <p className="text-4xl font-bold">{countdown}</p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
