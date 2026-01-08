import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import type { QuizQuestion } from '@/types/notes';

interface QuizViewerProps {
  questions: QuizQuestion[];
}

export default function QuizViewer({ questions }: QuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (index: number) => {
    if (showResult) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    
    if (index === currentQuestion.correctIndex) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setIsComplete(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setIsComplete(false);
  };

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <div className="text-6xl">
          {percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '📚'}
        </div>
        <h3 className="text-2xl font-bold">Quiz Complete!</h3>
        <p className="text-lg text-muted-foreground">
          You scored <span className="text-primary font-semibold">{score}</span> out of{' '}
          <span className="font-semibold">{questions.length}</span> ({percentage}%)
        </p>
        <Button onClick={resetQuiz} className="gap-2 mt-4">
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="text-primary font-medium">Score: {score}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="p-4 rounded-lg bg-card border">
        <p className="text-lg font-medium">{currentQuestion.question}</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {currentQuestion.options.map((option, index) => {
          let variant: 'outline' | 'default' | 'destructive' = 'outline';
          let icon = null;

          if (showResult) {
            if (index === currentQuestion.correctIndex) {
              variant = 'default';
              icon = <CheckCircle2 className="w-4 h-4 text-green-400" />;
            } else if (index === selectedAnswer) {
              variant = 'destructive';
              icon = <XCircle className="w-4 h-4" />;
            }
          }

          return (
            <Button
              key={index}
              variant={variant}
              className="justify-start gap-2 h-auto py-3 px-4 text-left"
              onClick={() => handleAnswer(index)}
              disabled={showResult}
            >
              <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1">{option}</span>
              {icon}
            </Button>
          );
        })}
      </div>

      {/* Next Button */}
      {showResult && (
        <Button onClick={nextQuestion} className="mt-auto">
          {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
        </Button>
      )}
    </div>
  );
}
