import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Hand, Brain, GraduationCap } from 'lucide-react';
import StudyNotes from './StudyNotes';
import GestureDrawingTab from './GestureDrawingTab';
import AttentionTracker from './AttentionTracker';

export default function StudentApp() {
  const [activeTab, setActiveTab] = useState('notes');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">StudyBuddy</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Learning for Everyone</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card/50">
          <div className="max-w-7xl mx-auto px-6">
            <TabsList className="h-14 bg-transparent gap-2">
              <TabsTrigger
                value="notes"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4"
              >
                <BookOpen className="w-4 h-4" />
                Study Notes
              </TabsTrigger>
              <TabsTrigger
                value="drawing"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4"
              >
                <Hand className="w-4 h-4" />
                Gesture Drawing
              </TabsTrigger>
              <TabsTrigger
                value="attention"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4"
              >
                <Brain className="w-4 h-4" />
                Focus Tracker
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto h-full">
            <TabsContent value="notes" className="mt-0 h-full">
              <StudyNotes />
            </TabsContent>
            <TabsContent value="drawing" className="mt-0 h-full">
              <GestureDrawingTab />
            </TabsContent>
            <TabsContent value="attention" className="mt-0 h-full">
              <AttentionTracker />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
