import { router, useLocalSearchParams } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  Chip,
  Header,
  Input,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { useApp } from '@/lib/store';
import {
  COURSES,
  DAY_LABELS,
  STUDY_PREF_LABEL,
  SUBJECTS,
  SUBJECT_KIND_HINT,
  YEARS,
  subjectLabel,
  to12h,
} from '@/lib/subjects';
import type { Availability, StudyPref, SubjectEntry, SubjectKind } from '@/lib/types';
import { colors, space } from '@/theme/tokens';

const KINDS: SubjectKind[] = ['can_help', 'need_help', 'want_study'];
const KIND_TITLE: Record<SubjectKind, string> = {
  can_help: 'I can help with',
  need_help: 'I need help with',
  want_study: 'I want to study',
};

const START_TIMES = ['08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
const DURATIONS = [1, 2, 3];

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h ?? 0) + hours;
  return `${String(total % 24).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}`;
}

export default function EditProfileScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { currentStudent, updateProfile, saveSubjects, saveAvailability } = useApp();

  const [name, setName] = useState(currentStudent?.profile.name ?? '');
  const [course, setCourse] = useState(currentStudent?.profile.course ?? COURSES[0]!);
  const [year, setYear] = useState(currentStudent?.profile.year ?? 2);
  const [studyPref, setStudyPref] = useState<StudyPref>(currentStudent?.profile.studyPref ?? 'either');
  const [bio, setBio] = useState(currentStudent?.profile.bio ?? '');

  const [entries, setEntries] = useState<SubjectEntry[]>(currentStudent?.subjects ?? []);
  const [blocks, setBlocks] = useState<Availability[]>(currentStudent?.availability ?? []);

  const [day, setDay] = useState(1);
  const [start, setStart] = useState('18:00');
  const [duration, setDuration] = useState(2);

  if (!currentStudent) return null;

  const toggle = (subjectId: string, kind: SubjectKind) => {
    setEntries((prev) => {
      const exists = prev.some((e) => e.subjectId === subjectId && e.kind === kind);
      if (exists) return prev.filter((e) => !(e.subjectId === subjectId && e.kind === kind));
      return [...prev, { subjectId, kind }];
    });
  };

  const addBlock = () => {
    const end = addHours(start, duration);
    const exists = blocks.some((b) => b.day === day && b.start === start && b.end === end);
    if (exists) return;
    setBlocks((prev) => [...prev, { day, start, end }]);
  };

  const save = () => {
    updateProfile({ name: name.trim() || currentStudent.profile.name, course, year, studyPref, bio: bio.trim() });
    saveSubjects(entries);
    saveAvailability(blocks);
    if (from === 'setup') router.replace('/home');
    else router.back();
  };

  return (
    <Screen scroll>
      <Header
        title="Academic profile"
        subtitle="This is what potential buddies see"
        onBack={() => router.back()}
      />

      <View style={{ gap: space.lg }}>
        <Card>
          <SectionHeader title="About you" />
          <Input label="Full name" value={name} onChangeText={setName} />
          <Input
            label="Short bio"
            value={bio}
            onChangeText={setBio}
            placeholder="What do you study, and how do you like to work?"
            multiline
            maxLength={140}
          />
        </Card>

        <Card>
          <AppText variant="label" color={colors.muted}>
            COURSE
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {COURSES.map((c) => (
              <Chip key={c} label={c.replace('BS ', '')} active={course === c} onPress={() => setCourse(c)} />
            ))}
          </View>

          <AppText variant="label" color={colors.muted} style={{ marginTop: space.sm }}>
            YEAR LEVEL
          </AppText>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {YEARS.map((y) => (
              <Chip key={y} label={`Year ${y}`} active={year === y} onPress={() => setYear(y)} />
            ))}
          </View>

          <AppText variant="label" color={colors.muted} style={{ marginTop: space.sm }}>
            STUDY PREFERENCE
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {(['online', 'in_person', 'either'] as StudyPref[]).map((p) => (
              <Chip key={p} label={STUDY_PREF_LABEL[p]} active={studyPref === p} onPress={() => setStudyPref(p)} />
            ))}
          </View>
        </Card>

        {KINDS.map((kind) => (
          <Card key={kind}>
            <SectionHeader title={KIND_TITLE[kind]} />
            <AppText variant="caption" color={colors.muted}>
              {SUBJECT_KIND_HINT[kind]}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {SUBJECTS.map((s) => {
                const active = entries.some((e) => e.subjectId === s.id && e.kind === kind);
                return (
                  <Chip
                    key={s.id}
                    label={s.code}
                    active={active}
                    onPress={() => toggle(s.id, kind)}
                    tone={kind === 'can_help' ? 'success' : kind === 'need_help' ? 'primary' : 'default'}
                  />
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {entries
                .filter((e) => e.kind === kind)
                .map((e) => (
                  <AppText key={`${kind}-${e.subjectId}`} variant="caption" color={colors.muted}>
                    {subjectLabel(e.subjectId)}
                  </AppText>
                ))}
            </View>
          </Card>
        ))}

        <Card>
          <SectionHeader title="Weekly availability" />
          <AppText variant="caption" color={colors.muted}>
            Simple time blocks help matching. Add the windows you can reliably study.
          </AppText>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {DAY_LABELS.map((label, i) => (
              <Chip key={label} label={label} active={day === i} onPress={() => setDay(i)} />
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {START_TIMES.map((t) => (
              <Chip key={t} label={to12h(t)} active={start === t} onPress={() => setStart(t)} />
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            {DURATIONS.map((d) => (
              <Chip
                key={d}
                label={`${d} hr`}
                active={duration === d}
                onPress={() => setDuration(d)}
              />
            ))}
          </View>

          <Button
            label={`Add ${DAY_LABELS[day]} ${to12h(start)}–${to12h(addHours(start, duration))}`}
            variant="secondary"
            icon={<Plus size={16} color={colors.primary} />}
            onPress={addBlock}
          />

          <View style={{ gap: space.sm, marginTop: space.sm }}>
            {blocks.length ? (
              blocks.map((b, i) => (
                <View
                  key={`${b.day}-${b.start}-${i}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.surfaceAlt,
                    borderRadius: 14,
                    paddingVertical: 10,
                    paddingHorizontal: space.md,
                  }}>
                  <AppText variant="small">
                    {DAY_LABELS[b.day]} · {to12h(b.start)}–{to12h(b.end)}
                  </AppText>
                  <Pressable
                    hitSlop={8}
                    onPress={() => setBlocks((prev) => prev.filter((_, idx) => idx !== i))}>
                    <X size={16} color={colors.muted} />
                  </Pressable>
                </View>
              ))
            ) : (
              <AppText variant="caption" color={colors.muted}>
                No time blocks yet.
              </AppText>
            )}
          </View>
        </Card>
      </View>

      <View style={{ marginTop: space.xxl, gap: space.sm }}>
        <Button label="Save profile" onPress={save} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>

      <View style={{ height: 40 }} />
    </Screen>
  );
}
