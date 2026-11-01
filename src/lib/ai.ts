import Constants from 'expo-constants';

const API_KEY = (Constants.expoConfig?.extra?.ANTHROPIC_API_KEY as string) ?? process.env.ANTHROPIC_API_KEY ?? '';
const MODEL = 'claude-sonnet-4-20250514';

export const isAIConfigured = Boolean(API_KEY);

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
  hint?: string;
}

export interface StudyPlanEntry {
  day: string;
  focus: string;
  activities: string[];
}

export interface StudyPlan {
  title: string;
  entries: StudyPlanEntry[];
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? '';
  return text.trim();
}

export async function generateQuiz(
  subject: string,
  topic: string,
  count: number,
): Promise<QuizQuestion[]> {
  const systemPrompt =
    'You are an expert educator. Generate study quizzes for university students. ' +
    'Return ONLY valid JSON — no markdown, no explanation. ' +
    'Format: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..."}]}';

  const userPrompt = `Generate ${count} multiple-choice questions about "${topic}" in the subject "${subject}".
Each question must have exactly 4 options, one correct answer, and a brief explanation.
Make the questions appropriate for a university-level student.`;

  const raw = await callClaude(systemPrompt, userPrompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse quiz response');

  const parsed = JSON.parse(jsonMatch[0]) as { questions: QuizQuestion[] };
  return parsed.questions;
}

export async function generateFlashcards(
  subject: string,
  topic: string,
  count: number,
): Promise<Flashcard[]> {
  const systemPrompt =
    'You are an expert educator. Generate study flashcards for university students. ' +
    'Return ONLY valid JSON — no markdown, no explanation. ' +
    'Format: {"cards": [{"front": "...", "back": "...", "hint": "..."}]}';

  const userPrompt = `Generate ${count} flashcards about "${topic}" in the subject "${subject}".
Each card has a "front" (concept/question) and a "back" (answer/explanation).
Include a short "hint" for cards that need one.
Make the cards useful for self-quizzing before exams.`;

  const raw = await callClaude(systemPrompt, userPrompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse flashcard response');

  const parsed = JSON.parse(jsonMatch[0]) as { cards: Flashcard[] };
  return parsed.cards;
}

export async function generateStudyPlan(
  subject: string,
  topics: string[],
  weeks: number,
  availability: { day: number; start: string; end: string }[],
): Promise<StudyPlan> {
  const systemPrompt =
    'You are an expert study coach. Generate a study plan for university students. ' +
    'Return ONLY valid JSON — no markdown, no explanation. ' +
    'Format: {"title": "...", "entries": [{"day": "Monday", "focus": "...", "activities": ["..."]}]}';

  const availText = availability
    .map((a) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][a.day] + ' ' + a.start + '-' + a.end)
    .join(', ');

  const userPrompt = `Create a ${weeks}-week study plan for "${subject}" covering these topics: ${topics.join(', ')}.
The student is available at: ${availText}.
Each entry should have a day, a focus topic, and 2-3 short activities.
Spread topics across the weeks and keep the workload realistic.`;

  const raw = await callClaude(systemPrompt, userPrompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse study plan response');

  const parsed = JSON.parse(jsonMatch[0]) as StudyPlan;
  return parsed;
}

// ---------------------------------------------------------------------------
// Text-based generation — for uploaded notes / PDFs
// ---------------------------------------------------------------------------

export async function generateQuizFromText(
  text: string,
  count: number,
): Promise<QuizQuestion[]> {
  const systemPrompt =
    'You are an expert educator. Generate study quizzes for university students. ' +
    'Return ONLY valid JSON — no markdown, no explanation. ' +
    'Format: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..."}]}';

  const userPrompt = `Based on the following notes, generate ${count} multiple-choice questions.
Each question must have exactly 4 options, one correct answer, and a brief explanation.
Make the questions appropriate for a university-level student.

NOTES:
${text.slice(0, 8000)}`;

  const raw = await callClaude(systemPrompt, userPrompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse quiz response');

  const parsed = JSON.parse(jsonMatch[0]) as { questions: QuizQuestion[] };
  return parsed.questions;
}

export async function generateFlashcardsFromText(
  text: string,
  count: number,
): Promise<Flashcard[]> {
  const systemPrompt =
    'You are an expert educator. Generate study flashcards for university students. ' +
    'Return ONLY valid JSON — no markdown, no explanation. ' +
    'Format: {"cards": [{"front": "...", "back": "...", "hint": "..."}]}';

  const userPrompt = `Based on the following notes, generate ${count} flashcards.
Each card has a "front" (concept/question) and a "back" (answer/explanation).
Include a short "hint" for cards that need one.
Make the cards useful for self-quizzing before exams.

NOTES:
${text.slice(0, 8000)}`;

  const raw = await callClaude(systemPrompt, userPrompt);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse flashcard response');

  const parsed = JSON.parse(jsonMatch[0]) as { cards: Flashcard[] };
  return parsed.cards;
}

export async function summarizeNotes(text: string): Promise<string> {
  const systemPrompt =
    'You are a study assistant. Summarize the following notes concisely for a university student. ' +
    'Focus on key concepts, definitions, and important facts. Return plain text.';

  const userPrompt = `Summarize these notes:\n\n${text.slice(0, 8000)}`;

  return callClaude(systemPrompt, userPrompt);
}