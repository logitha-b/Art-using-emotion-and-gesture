import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, XCircle } from 'lucide-react';

interface QuickQuizProps {
  onClose: () => void;
}

const QUICK_QUESTIONS = [
  {
    question: 'What is 15 + 27?',
    options: ['42', '32', '52', '41'],
    correctIndex: 0,
  },
  {
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctIndex: 1,
  },
  {
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctIndex: 2,
  },
  {
    question: 'How many sides does a hexagon have?',
    options: ['5', '6', '7', '8'],
    correctIndex: 1,
  },
  {
    question: 'What color do you get when you mix blue and yellow?',
    options: ['Purple', 'Orange', 'Green', 'Brown'],
    correctIndex: 2,
  },
];

export default function QuickQuiz({ onClose }: QuickQuizProps) {
  const [question] = useState(() => 
    QUICK_QUESTIONS[Math.floor(Math.random() * QUICK_QUESTIONS.length)]
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
  };

  const isCorrect = selectedAnswer === question.correctIndex;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="relative max-w-md w-full mx-4 p-8 rounded-2xl bg-card border shadow-2xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🧠</div>
          <h2 className="text-xl font-bold">Quick Focus Quiz</h2>
          <p className="text-sm text-muted-foreground">
            Answer this question to refocus your attention
          </p>
        </div>

        {/* Question */}
        <div className="p-4 rounded-lg bg-secondary/50 mb-6">
          <p className="text-lg font-medium text-center">{question.question}</p>
        </div>

        {/* Options */}
        <div className="space-y-2 mb-6">
          {question.options.map((option, index) => {
            let variant: 'outline' | 'default' | 'destructive' = 'outline';
            let icon = null;

            if (showResult) {
              if (index === question.correctIndex) {
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
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => handleAnswer(index)}
                disabled={showResult}
              >
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 text-left">{option}</span>
                {icon}
              </Button>
            );
          })}
        </div>

        {/* Result */}
        {showResult && (
          <div className="text-center space-y-4">
            <div className={`text-2xl font-bold ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
              {isCorrect ? '🎉 Correct!' : '😅 Not quite!'}
            </div>
            <p className="text-sm text-muted-foreground">
              {isCorrect 
                ? 'Great job! Your focus is back on track.' 
                : `The correct answer was: ${question.options[question.correctIndex]}`}
            </p>
            <Button onClick={onClose}>
              Continue Learning
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
