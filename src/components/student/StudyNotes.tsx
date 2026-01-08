import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Sparkles, FileText, CreditCard, HelpCircle, Loader2 } from 'lucide-react';
import type { AIMode, Flashcard, QuizQuestion } from '@/types/notes';
import FlashcardViewer from './FlashcardViewer';
import QuizViewer from './QuizViewer';
import { useToast } from '@/hooks/use-toast';

export default function StudyNotes() {
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<AIMode | null>(null);
  const { toast } = useToast();

  const generateContent = async (mode: AIMode) => {
    if (!content.trim()) {
      toast({
        title: 'No content',
        description: 'Please paste or type some study material first.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setActiveMode(mode);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ content, mode }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limited. Please try again in a moment.');
        }
        if (response.status === 402) {
          throw new Error('AI credits exhausted. Please add credits.');
        }
        throw new Error('Failed to generate content');
      }

      const data = await response.json();

      if (mode === 'summary') {
        setSummary(data.result);
      } else if (mode === 'flashcards') {
        setFlashcards(data.result);
      } else if (mode === 'quiz') {
        setQuiz(data.result);
      }

      toast({
        title: 'Generated!',
        description: `Your ${mode} is ready.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setActiveMode(null);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Study Notes</h2>
          <p className="text-sm text-muted-foreground">Paste your notes to generate summaries, flashcards & quizzes</p>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Input Section */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Study Material
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <Textarea
              placeholder="Paste your study notes, textbook content, or any learning material here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 min-h-[200px] resize-none"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => generateContent('summary')}
                disabled={isLoading}
                variant="outline"
                className="gap-2"
              >
                {isLoading && activeMode === 'summary' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Summarize
              </Button>
              <Button
                onClick={() => generateContent('flashcards')}
                disabled={isLoading}
                variant="outline"
                className="gap-2"
              >
                {isLoading && activeMode === 'flashcards' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Flashcards
              </Button>
              <Button
                onClick={() => generateContent('quiz')}
                disabled={isLoading}
                variant="outline"
                className="gap-2"
              >
                {isLoading && activeMode === 'quiz' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <HelpCircle className="w-4 h-4" />
                )}
                Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="flex flex-col overflow-hidden">
          <Tabs defaultValue="summary" className="flex-1 flex flex-col">
            <CardHeader className="pb-0">
              <TabsList className="w-full">
                <TabsTrigger value="summary" className="flex-1 gap-2">
                  <Sparkles className="w-3 h-3" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="flex-1 gap-2">
                  <CreditCard className="w-3 h-3" />
                  Flashcards
                </TabsTrigger>
                <TabsTrigger value="quiz" className="flex-1 gap-2">
                  <HelpCircle className="w-3 h-3" />
                  Quiz
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pt-4">
              <TabsContent value="summary" className="mt-0 h-full">
                {summary ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground/90">{summary}</p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Click "Summarize" to generate a summary
                  </div>
                )}
              </TabsContent>
              <TabsContent value="flashcards" className="mt-0 h-full">
                {flashcards.length > 0 ? (
                  <FlashcardViewer flashcards={flashcards} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Click "Flashcards" to generate flashcards
                  </div>
                )}
              </TabsContent>
              <TabsContent value="quiz" className="mt-0 h-full">
                {quiz.length > 0 ? (
                  <QuizViewer questions={quiz} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Click "Quiz" to generate a quiz
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
