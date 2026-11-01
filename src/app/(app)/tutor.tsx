import { useState } from 'react';
import { View, ActivityIndicator, Pressable } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Brain, BookOpen, CalendarDays, Upload, FileText, Trash2 } from 'lucide-react-native';

import { AppText, Button, Card, Screen, SectionHeader } from '@/components/ui';
import { useApp } from '@/lib/store';
import {
  generateQuizFromText,
  generateFlashcardsFromText,
  summarizeNotes,
  type QuizQuestion,
  type Flashcard,
} from '@/lib/ai';
import { colors, radius, space } from '@/theme/tokens';

export default function TutorScreen() {
  const { currentStudent } = useApp();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const subjects = currentStudent?.subjects.map(s => s.subjectId) ?? [];

  const handleGenerate = async (action: 'quiz' | 'flashcards' | 'summary') => {
    if (!notes) return;
    setLoading(true);
    setResult(null);
    try {
      let output = '';
      if (action === 'quiz') {
        const quiz = await generateQuizFromText(notes, 3);
        output = JSON.stringify(quiz, null, 2);
      } else if (action === 'flashcards') {
        const cards = await generateFlashcardsFromText(notes, 3);
        output = JSON.stringify(cards, null, 2);
      } else {
        output = await summarizeNotes(notes);
      }
      setResult(output);
    } catch (e) {
      setResult(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFileName(result.name);
        if (result.uri) {
          const response = await fetch(result.uri);
          const text = await response.text();
          setNotes(text);
        }
      }
    } catch (e) {
      setResult(`Error picking document: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  return (
    <Screen scroll>
      <View style={{ paddingTop: space.lg, gap: space.xl }}>
        <View style={{ gap: 4 }}>
          <AppText variant="h1">AI Tutor</AppText>
          <AppText variant="caption" color={colors.muted}>
            Upload notes or PDFs, and get AI-powered study tools.
          </AppText>
        </View>

        {/* Upload area */}\n        <Card style={{ gap: space.md, alignItems: 'center' }}>
          <Pressable
            onPress={pickDocument}
            style={{
              width: '100%',
              paddingVertical: space.xl,
              borderRadius: radius.xl,
              borderWidth: 2,
              borderColor: colors.border,
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              gap: space.sm,
            }}>
            <Upload size={28} color={colors.primary} />
            <AppText variant="small" style={{ fontWeight: '600' }}>
              Upload notes or PDF
            </AppText>
            <AppText variant="caption" color={colors.muted}>
              PDF, Word, or text files
            </AppText>
          </Pressable>

          {fileName && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <FileText size={16} color={colors.success} />
              <AppText variant="small" style={{ flex: 1 }}>
                {fileName}
              </AppText>
              <Pressable onPress={() => { setNotes(null); setFileName(null); }}>
                <Trash2 size={16} color={colors.danger} />
              </Pressable>
            </View>
          )}
        </Card>

        {/* Action buttons */}
        <View style={{ gap: space.sm }}>
          <Button
            label="Generate Quiz"
            icon={<Brain size={18} color={colors.text} />}
            onPress={() => handleGenerate('quiz')}
            disabled={!notes}
          />
          <Button
            label="Generate Flashcards"
            variant="secondary"
            icon={<BookOpen size={18} color={colors.text} />}
            onPress={() => handleGenerate('flashcards')}
            disabled={!notes}
          />
          <Button
            label="Summarize Notes"
            variant="secondary"
            icon={<CalendarDays size={18} color={colors.text} />}
            onPress={() => handleGenerate('summary')}
            disabled={!notes}
          />
        </View>

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