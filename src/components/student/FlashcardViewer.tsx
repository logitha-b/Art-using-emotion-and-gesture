import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { Flashcard } from '@/types/notes';

interface FlashcardViewerProps {
  flashcards: Flashcard[];
}

export default function FlashcardViewer({ flashcards }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = flashcards[currentIndex];

  const goNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 h-full">
      {/* Progress */}
      <div className="text-sm text-muted-foreground">
        Card {currentIndex + 1} of {flashcards.length}
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-md aspect-[3/2] cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`absolute inset-0 rounded-xl transition-transform duration-500 transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-6 flex items-center justify-center text-center backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-lg font-medium">{currentCard.front}</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 p-6 flex items-center justify-center text-center rotate-y-180 backface-hidden"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-lg">{currentCard.back}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Click card to flip</p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={reset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
