import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Sparkles, FileText, CreditCard, HelpCircle, Loader2, Upload, X } from 'lucide-react';
import type { AIMode, Flashcard, QuizQuestion } from '@/types/notes';
import FlashcardViewer from './FlashcardViewer';
import QuizViewer from './QuizViewer';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromPDF } from '@/lib/pdfParser';

export default function StudyNotes() {
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [activeMode, setActiveMode] = useState<AIMode | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a PDF under 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsParsing(true);
    setUploadedFile(file.name);

    try {
      const text = await extractTextFromPDF(file);
      
      if (!text.trim()) {
        toast({
          title: 'No text found',
          description: 'The PDF appears to be empty or contains only images.',
          variant: 'destructive',
        });
        setUploadedFile(null);
      } else {
        setContent(text);
        toast({
          title: 'PDF loaded!',
          description: `Extracted ${text.length.toLocaleString()} characters from "${file.name}"`,
        });
      }
    } catch (error) {
      console.error('PDF parsing error:', error);
      toast({
        title: 'Failed to parse PDF',
        description: 'Could not extract text from the PDF file.',
        variant: 'destructive',
      });
      setUploadedFile(null);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateContent = async (mode: AIMode) => {
    if (!content.trim()) {
      toast({
        title: 'No content',
        description: 'Please upload a PDF or paste study material first.',
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
          body: JSON.stringify({ content: content.slice(0, 15000), mode }),
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
          <p className="text-sm text-muted-foreground">Upload a PDF or paste notes to generate summaries, flashcards & quizzes</p>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Input Section */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Study Material
              </span>
              {uploadedFile && (
                <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded">
                  📄 {uploadedFile}
                  <button onClick={clearFile} className="hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            {/* Upload Area */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Extracting text from PDF...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      <span className="text-primary font-medium">Upload PDF</span> or drag and drop
                    </span>
                  </>
                )}
              </label>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              <span>or paste text below</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Textarea
              placeholder="Paste your study notes, textbook content, or any learning material here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 min-h-[150px] resize-none"
            />
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => generateContent('summary')}
                disabled={isLoading || isParsing}
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
                disabled={isLoading || isParsing}
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
                disabled={isLoading || isParsing}
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
