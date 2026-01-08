import { Emotion, Gesture } from '@/types/gesture';
import { Hand, Smile, Eraser, Undo2, Pencil } from 'lucide-react';

interface StatusPanelProps {
  gesture: Gesture;
  emotion: Emotion;
  isHandLoading: boolean;
  isEmotionLoading: boolean;
}

const gestureInfo: Record<Gesture, { label: string; icon: React.ReactNode; description: string }> = {
  draw: { 
    label: 'Drawing', 
    icon: <Pencil className="w-4 h-4" />,
    description: 'Index finger up'
  },
  undo: { 
    label: 'Undo', 
    icon: <Undo2 className="w-4 h-4" />,
    description: 'Index + Middle up'
  },
  clear: { 
    label: 'Clear', 
    icon: <Eraser className="w-4 h-4" />,
    description: 'Make a fist'
  },
  none: { 
    label: 'Ready', 
    icon: <Hand className="w-4 h-4" />,
    description: 'Show a gesture'
  },
};

const emotionLabels: Record<Emotion, string> = {
  happy: 'Happy',
  sad: 'Sad',
  angry: 'Angry',
  neutral: 'Neutral',
};

export default function StatusPanel({ gesture, emotion, isHandLoading, isEmotionLoading }: StatusPanelProps) {
  const gestureData = gestureInfo[gesture];

  return (
    <div className="status-panel space-y-4">
      <div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-2">
          <Hand className="w-3 h-3" />
          <span>Gesture</span>
        </div>
        {isHandLoading ? (
          <div className="gesture-indicator animate-pulse">Loading...</div>
        ) : (
          <div className={`gesture-indicator ${gesture !== 'none' ? 'gesture-indicator-active' : ''} flex items-center gap-2`}>
            {gestureData.icon}
            <span>{gestureData.label}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{gestureData.description}</p>
      </div>

      <div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-2">
          <Smile className="w-3 h-3" />
          <span>Emotion</span>
        </div>
        {isEmotionLoading ? (
          <div className="emotion-badge bg-secondary animate-pulse">Loading...</div>
        ) : (
          <div className={`emotion-badge emotion-badge-${emotion}`}>
            {emotionLabels[emotion]}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border">
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Controls</h4>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emotion-happy"></span>
            ☝️ Index finger = Draw
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emotion-sad"></span>
            ✌️ Two fingers = Undo
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emotion-angry"></span>
            ✊ Fist = Clear
          </li>
        </ul>
      </div>
    </div>
  );
}
