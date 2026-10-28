# StudyMate

**A Mobile Application for Academic Peer Matching and Collaborative Learning**

React Native (Expo) · TypeScript · Expo Router · Supabase-ready

---

## Status (Oct 28, 2026)

The full product flow is built and running:

- Onboarding, sign up, sign in, student verification
- Academic profile: course, year, bio, study preference, subjects, weekly availability
- Weighted matching deck with reciprocal skill exchange
- Mutual match (backend rule: both sides must choose **Study**)
- Guided chat — **no free-text input anywhere**
- Study sessions: online or **University Library only**, with a safety acknowledgement gate
- Block and report, with reports storing a message snapshot
- All state persists across reloads

**The data layer is currently local** (`src/lib/store.tsx` → AsyncStorage) because no Supabase credentials were provided yet. The model, rules, and action API mirror the intended Postgres schema, so swapping in Supabase is contained to that one module plus new `supabase/` SQL.

---

## Run it

```bash
cd C:\Users\kinle\StudyBuddy
npm install
npx expo start
```

- Press `w` for web, or scan the QR with Expo Go on a phone.
- Web is currently running at <http://localhost:8081>.

### Demo accounts

Sign in with any password. The email decides which seeded student you are:

| Email | Student | Why |
| --- | --- | --- |
| `alex@northbridge.edu` | Alex Morgan | Main demo account |
| `jamie@northbridge.edu` | Jamie Cruz | Reciprocal match with Alex |
| `maria@northbridge.edu` | Maria Santos | One-way help match |
| `sam@northbridge.edu` | Sam Rivera | Weaker availability overlap |

> **Profile → Switch demo user** lets you act as the other side of a match on one device. This is the fastest way to demo the mutual-match rule and accepting a session invite.

### 5-minute demo script

1. Launch → onboarding → **Log in** as Alex.
2. **Buddy** tab → Jamie Cruz, **90% match**, skill exchange: Alex teaches Programming 1, Jamie teaches Database Systems.
3. Tap **Study** → match screen (both sides already chose Study).
4. **Say hi** → guided chat. Only prompt chips, no keyboard.
5. **All messages → Study session → Let's schedule a study session.**
6. Pick **Database Systems**, a date, **In-person** → **Read safety notice** → **I understand** → **Send session invite**.
7. **Profile → Switch demo user → Jamie Cruz** → open the chat → **Accept session**.
8. Point out: status becomes **Confirmed**, a confirmation message is sent, and the session now appears on Home.
9. Back on Jamie's chat → **⋮ → Block user**. Alex disappears from Jamie's chats, deck, and sessions — and Alex can no longer see Jamie either.
10. **Profile → Reset demo data** to restore a clean state.

---

## Matching engine

`src/lib/matching.ts` — max 100 points:

| Signal | Max |
| --- | --- |
| Subject compatibility | 50 |
| Availability overlap | 15 |
| Study preference | 15 |
| Same course | 10 |
| Year level | 10 |

Subject score:
- **50** — reciprocal: each can help with something the other needs
- **30** — one-way help
- **15** — shared "want to study" only
- **0** — excluded (deck minimum is 30)

Blocked users are removed from the deck, chats, and sessions. Decisions are per-viewer and never exposed to the person who was passed on.

---

## Safety model

- **No free-text chat.** The composer is chips only; sessions are cards. In the Supabase schema this becomes a `messages` table with `template_id` + `payload jsonb` and **no `body` column**.
- **Library-only in-person.** The mode picker offers Library or Online; the location is not user-editable.
- **Safety acknowledgement.** In-person invites cannot be sent until the notice is acknowledged; the flag is stored with the session.
- **Blocking is mutual.** A block hides the pair from decks, conversations, and session lists on both sides.
- **Reports snapshot the message.** The report stores the rendered text and category at report time, so moderation does not need live access to the conversation.
- **Guided prompt catalog** — 38 prompts across 9 stages, stored in `src/lib/templates.ts` and designed to move to a read-only `message_templates` table.

---

## Code map

```
src/
  app/
    index.tsx                 auth-aware redirect
    welcome.tsx               onboarding
    sign-in.tsx  sign-up.tsx  verification.tsx
    edit-profile.tsx          subjects, availability, study preference
    (app)/                    tab shell
      home.tsx  buddy.tsx  chats.tsx  profile.tsx
    buddy-profile/[id].tsx    full academic profile + score breakdown
    chat/[id].tsx             guided chat, session cards, block/report
    match/[id].tsx            mutual-match celebration
    session/new.tsx           invite builder + safety gate
    session/[id].tsx          session detail / accept / complete
  components/
    ui/                       design system primitives
    tab-bar.tsx               custom floating tab bar
    report-sheet.tsx  safety-notice.tsx  confirm-dialog.tsx
  lib/
    types.ts  store.tsx  matching.ts  subjects.ts  templates.ts
  theme/tokens.ts             colors, type, spacing, radius
```

Design tokens follow the Figma file: Inter, `#3B4FE0` primary, `#FF5A4F` accent, `#F7F8FC` canvas, 20px cards, pill buttons.

---

## Next: Supabase

Needed to move from the local demo to the real backend:

1. A Supabase project URL and **anon** key (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`). The service-role key must never ship in the app.
2. Run the schema + RLS migration (tables: `profiles`, `subjects`, `profile_subjects`, `availability`, `decisions`, `matches`, `message_templates`, `messages`, `study_sessions`, `blocks`, `reports`, `verifications`).
3. Replace the local store methods with Supabase queries/RPCs. UI components do not change.

Deliberately excluded: AI features, video/voice, group study, payments, gamification, nationwide universities, live location, cloud file storage, free-text chat.

---

## Known limitations of the current build

- Data is per-device (AsyncStorage), not shared between phones.
- Verification auto-approves in demo mode; production uses a moderator-reviewed status.
- No email/password validation beyond basic form checks; Supabase Auth will own this.
- No push notifications or realtime sync yet.
