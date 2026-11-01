import { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Brain, BookOpen, CalendarDays } from 'lucide-react-native';

import { AppText, Button, Card, Screen, SectionHeader } from '@/components/ui';
import { useApp } from '@/lib/store';
import { generateQuiz, generateFlashcards, generateStudyPlan, type QuizQuestion, type Flashcard, type StudyPlan } from '@/lib/ai';
import { colors, space } from '@/theme/tokens';

export default function TutorScreen() {
  const { currentStudent } = useApp();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const subjects = currentStudent?.subjects.map(s => s.subjectId) ?? [];

  const handleAction = async (action: 'quiz' | 'flashcards' | 'plan') => {
    setLoading(true);
    setResult(null);
    try {
      let output = '';
      if (action === 'quiz') {
        const quiz = await generateQuiz(subjects[0] || 'General', 'Fundamentals', 3);
        output = JSON.stringify(quiz, null, 2);
      } else if (action === 'flashcards') {
        const cards = await generateFlashcards(subjects[0] || 'General', 'Fundamentals', 3);
        output = JSON.stringify(cards, null, 2);
      } else {
        const plan = await generateStudyPlan(subjects[0] || 'General', ['Topic A', 'Topic B'], 2, []);
        output = JSON.stringify(plan, null, 2);
      }
      setResult(output);
    } catch (e) {
      setResult(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ paddingTop: space.lg, gap: space.xl }}>
        <View style={{ gap: 4 }}>
          <AppText variant="h1">AI Tutor</AppText>
          <AppText variant="caption" color={colors.muted}>
            Boost your study with AI-powered tools.
          </AppText>
        </View>

        <Card style={{ gap: space.md }}>
          <Button label="Generate Quiz" icon={<Brain size={18} color={colors.text} />} onPress={() => handleAction('quiz')} />
          <Button label="Generate Flashcards" variant="secondary" icon={<BookOpen size={18} color={colors.text} />} onPress={() => handleAction('flashcards')} />
          <Button label="Create Study Plan" variant="secondary" icon={<CalendarDays size={18} color={colors.text} />} onPress={() => handleAction('plan')} />
        </Card>

        {loading && <ActivityIndicator color={colors.primary} />}
        {result && (
          <Card>
            <SectionHeader title="Result" />
            <AppText variant="small" style={{ fontFamily: 'monospace' }}>{result}</AppText>
          </Card>
        )}
      </View>
      <View style={{ height: 110 }} />
    </Screen>
  );
}