# InteriaAI — Master Build Prompt (v2)
*Rewritten for execution by an AI coding agent (Claude Code, Cursor, or similar). Original scope preserved — reorganized, de-conflicted, and made technically concrete.*

**Contents:** 0. For you, not the agent · 1. What changed, and why · 2. Non-negotiable ground rules · 3. Locked technical decisions · 4. Phase map · 5. Phase 0 — Foundation · 6. Phase 1 — MVP · 7. Phase 2 — Depth & retention · 8. Phase 3 — Advanced · 9. AI service architecture · 10. Database schema · 11. API surface · 12. Cross-cutting requirements · 13. Environment variables · 14. Definition of done · Appendix — section-to-phase map

---

## 0. For you, not the agent

This is a rewrite of your original InteriaAI spec. Nothing was cut — every one of your original 40 sections is accounted for in the appendix map at the end. What changed is *sequencing and precision*, not ambition.

**How to use it:**
- **Claude Code or similar (recommended):** save this whole file as `SPEC.md` in your repo root. First message to the agent: *"Read SPEC.md. Build Phase 0 completely, then stop and show me exactly how you verified the Phase 0 Definition of Done before touching Phase 1."* Repeat per phase. Agentic tools do dramatically better work verifying one phase at a time than when asked for "a complete production-ready app" with 40 simultaneous feature areas in a single pass — the latter reliably produces wide, shallow, half-working code, which is the opposite of what your original spec asked for.
- **Chat tool with no repo memory:** paste one phase section at a time, in order, as separate messages.

---

## 1. What changed, and why

- **Every "OR" was resolved.** *"Next.js API routes OR a separate backend service"* forces an agent to guess, and architecture guesses are expensive to undo. Decided in section 3.
- **40 simultaneous "production-ready" feature areas → 4 phases.** Phasing makes "production-ready" honestly achievable *per phase*, instead of a promise that can't be kept across all 40 at once.
- **The hardest technical requirement got a real answer.** A plain text-to-image call cannot "preserve room structure" — it invents a new room. Section 9 gives a real, currently-available technical approach instead of just restating the requirement.
- **Vague infra asks got named tools.** "Implement rate limiting" / "add i18n" / "add email" had no implementation attached. Now they do (section 3).
- **The database section got fields, not just table names** (section 10) — you can't write correct foreign keys or RLS from 18 table names alone.
- **A real inconsistency in your original got caught:** section 6's JSON example lists 5 score categories; section 7's prose lists 6 (adds Style Consistency). Fixed structurally in section 10 so it can't silently recur.

---

## 2. Non-negotiable ground rules (unchanged from your original)

- Real, working, end-to-end code only. No stub buttons, no fake progress, no placeholder logic anywhere a real implementation is feasible.
- All secrets stay server-side. Nothing with `SERVICE_ROLE`, AI API keys, or DB credentials ever ships to the client bundle.
- Server-side validation on every request, regardless of client-side validation.
- Every table has Row Level Security. Users see only their own data; admins get explicit admin policies, never a service-role bypass baked into normal app code.
- A phase is not "done" until its Definition of Done (section 14) passes. Don't start the next phase early.

---

## 3. Locked technical decisions

| Area | Decision | Why |
|---|---|---|
| Backend | **Next.js Route Handlers** (`app/api/**`), not a separate service | One deployable, one repo, ships to Vercel with no extra infra needed at this stage |
| Framework | Next.js 15+, App Router, TypeScript strict mode | Matches original spec |
| Data fetching / cache | **TanStack Query** on the client | Original spec named none; needed for the loading/error states required later |
| Forms + validation | **React Hook Form + Zod**, same Zod schemas reused server-side | One source of truth for validation, client and server |
| Client state | **Zustand** for light UI state (wizard steps, presentation-mode toggle) | TanStack Query already owns server state; don't duplicate it |
| DB / Auth / Storage | **Supabase** (Postgres + Auth + Storage) | Per original spec |
| Rate limiting | **Upstash Redis + `@upstash/ratelimit`** | Serverless-friendly; no standalone Redis box needed on Vercel |
| Transactional email | Supabase Auth's built-in templates for verification/reset in Phase 1; swap to **Resend** only once custom branded emails are actually needed | Don't build an email service before you need one |
| Static UI translation | **next-intl** | Handles the 7-locale UI strings (section 8) |
| Dynamic AI text translation | Ask the LLM to respond directly in the target language (pass `preferred_language` into the prompt) rather than generate-then-translate | Fewer moving parts, better quality — modern multilingual LLMs handle Kannada/Hindi/Telugu/Tamil/Malayalam/Marathi natively |
| Deployment | Vercel + Supabase | Per original spec |

**Three more ambiguities worth flagging, resolved:**

1. Your original lists both a `projects` table and a `rooms` table, but the "Create New Project" form (section 5) only ever captures *one room's* details. Resolved as: a **project** is a container (e.g. "My Apartment Renovation"); it holds one or more **rooms**. The create-project form creates a project *and* its first room in one step, so day-one UX matches your spec exactly, while the model still supports "organize into projects" (section 14 of the original) later without a migration.
2. The standalone `favorites` table is merged into `saved_designs.is_favorite` — a separate table would only ever duplicate a boolean that already belongs on `saved_designs`.
3. Section 6's JSON example lists 5 sub-scores; section 7's prose lists 6 (adds Style Consistency). Resolved by storing scores as **rows** in `analysis_scores` (`category` + `score`) instead of fixed columns (section 10) — the category list is just enum values, so this exact mismatch can't recur.

---

## 4. Phase map

| Phase | Ships | Original sections |
|---|---|---|
| **0 — Foundation** | Repo, DB schema, auth skeleton, storage buckets, AI provider abstraction. No end-user feature yet. | 1, 22, 23, 25 (skeleton), 26, 36, 37 |
| **1 — MVP** | The exact customer journey from the end of your original doc: sign up → create project → upload photo → AI analysis → scores → recommendations → generate one design → before/after → per-design budget → save → basic share → basic history. | 2 (basic), 3, 4, 5, 6, 7, 8, 9 (single variation), 10, 11, 20 (basic incl. on/off toggle), 24 (core routes), 27, 28 |
| **2 — Depth & retention** | Multiple design variations, standalone budget planner, 3-way comparison, full save/rename/delete/organize, filtered history, feedback capture, basic admin dashboard, usage limits, demo mode, presentation mode. | 12, 13, 14, 15, 16, 21 (basic), 33, 35, 38, 39 |
| **3 — Advanced** | Multi-language UI + AI output, chat assistant, voice interaction, deeper admin analytics, future-ready scaffolding (no fake integrations). | 17, 18, 19, 21 (advanced), 34 |

Cross-cutting requirements (responsive UI, visual design, accessibility, performance — originally sections 29–32) apply to every phase; they're specified once in section 12 instead of repeated four times.

---

## 5. Phase 0 — Foundation

**Goal:** nothing a user can click yet, but every later phase builds on real infrastructure instead of assumptions.

1. **Repo structure**, exactly per your original section 37: `app/`, `components/`, `lib/`, `lib/ai/`, `lib/supabase/`, `app/api/`, `types/`, `utils/`, `hooks/`, `public/`.
2. **Supabase project**: all tables from section 10 of this doc, RLS enabled with real policies written — not left as TODO — even though most tables are empty until Phase 1.
3. **Storage buckets**: `room-images`, `generated-designs`, `profile-images` — private by default, signed URLs for access, server-side file-type/size validation (never trust the client `accept=` attribute alone). Allowed types: JPG, JPEG, PNG, WEBP. Pick a max size (10MB unless you have a reason otherwise), store it in an env var, not a hard-coded constant.
4. **Auth skeleton**: Supabase Auth wired up (email/password + optional Google OAuth if its env vars are set), middleware protecting `/dashboard/**` and `/admin/**`.
5. **AI provider abstraction** (full design in section 9): create the interfaces and a working health-check call to each configured provider — no feature logic yet.
6. **`.env.example`** populated per section 13.

**Don't build dashboard UI yet.** Phase 0's only UI is a working login/signup page — auth has to exist before anything else does.

---

## 6. Phase 1 — MVP: the real customer journey

Word-for-word the journey your original spec ends with. If this works end-to-end with real AI calls, real database writes, and no dead buttons, you have a demoable product.

### 6.1 Landing page
Hero: **"Transform Your Home with AI."** Subtitle exactly as your original. Buttons *Analyze My Room* / *Explore Designs* must route to real, working pages, never `#`. Sections: How It Works, AI Features, Interior Styles, Budget Planning (static explainer until Phase 2's calculator exists, then link to it), Customer Reviews, FAQ, CTA, Footer. Keep this strong but don't gold-plate it yet — the dashboard flow is what proves the product works.

### 6.2 Auth
Sign up, log in, log out, forgot/reset password, email verification, Google login (feature-detected on its env vars — don't hard-fail if absent), protected `/dashboard`. Profile fields: name, email, phone, profile photo, preferred language, location, created date. Passwords never touch your own database — Supabase Auth owns them entirely.

### 6.3 Dashboard shell
Nav: Overview, My Projects, Room Analysis, AI Designs, Saved Designs, Compare Designs *(Phase 2)*, Budget Estimates, Design History, Profile, Settings. Overview cards — Total Projects, Rooms Analyzed, Designs Generated, Saved Designs — pulled from real counts via `GET /api/dashboard/stats`, never hard-coded. Real recent-projects and recent-recommendations lists. Responsive per section 12: sidebar (desktop) → collapsible sidebar (tablet) → bottom nav/mobile menu (mobile).

### 6.4 Create project + first room
Fields exactly as your original section 5: project name; home type (Apartment, Villa, Independent House, Office, Studio); room type (Living Room, Bedroom, Kitchen, Dining Room, Bathroom, Balcony, Office, Kids Room, Pooja Room, Other); dimensions (length/width/height); budget band (₹50k–1L, ₹1–3L, ₹3–5L, ₹5–10L, ₹10L+); preferred style (Modern, Minimalist, Luxury, Scandinavian, Traditional, Industrial, Contemporary, Bohemian, Japandi); color preferences; multiple photo upload (front/side/corner labels).

### 6.5 AI room analysis
On upload, call `POST /api/rooms/analyze`. Return the structured JSON from your original section 6, validated against a Zod schema before it's ever saved or shown. See section 9 for how the underlying AI call is implemented. Score language exactly as your original section 7 — **Excellent / Good / Could Be Improved / Needs Attention**, never "bad." Every sub-70 category gets a plain-language explanation plus a concrete, practical suggestion (your own example — *lighting improved by adding layered lighting near the seating area* — is the right register; keep it).

### 6.6 Recommendations
Per-category suggestions (furniture, lighting, wall colors, curtains, flooring, storage, decorations, plants, wall art, TV unit, sofa arrangement, dining arrangement, ceiling design) — every one includes a **why**, not just a **what**. A direct call to the text-generation provider (section 9) with the room analysis JSON as context.

### 6.7 Generate design (single variation for Phase 1)
User picks style, palette, budget, and design intensity (Light refresh / Moderate redesign / Complete redesign). One generated image for Phase 1 — multiple variations are Phase 2, once the core pipeline is proven reliable with one. Structural constraints (preserve layout, don't move doors/windows, respect style and budget) are handled at the provider level — section 9 — not by prompt wording alone.

### 6.8 Before/after
Side-by-side + slider comparison, fullscreen preview, zoom, download, save.

### 6.9 Design details + per-design budget estimate
Style, palette, furniture/lighting/materials/decor suggestions, and a budget breakdown exactly like your original example (Furniture / Lighting / Paint / Curtains / Decor / Other, with a min–max total) — labeled **"approximate"** in the UI itself, not just in this spec.

### 6.10 Save + basic share
Save creates a real `saved_designs` row. Share generates a real `/design/share/[token]` public page (before/after, room, style, score, budget, recommendations — no private customer info), with an on/off toggle owned by the customer.

### 6.11 History (basic)
A real, newest-first list of past analyses/designs for the signed-in user. Filtering and search are Phase 2 — Phase 1 just needs it correctly scoped to the current user via RLS, not merely hidden in the UI.

### 6.12 Loading & error states
Exactly your original sections 27–28: named progress steps during AI calls ("Uploading image… Analyzing room… Understanding furniture… Checking colors… Evaluating space… Preparing recommendations…") that reflect real request stages, never a fake timer; plain-language errors with a real Retry action for: upload failed, AI unavailable, invalid image, image too large, network error, generation failed, database error.

---

## 7. Phase 2 — Depth & retention

Build once Phase 1 genuinely works end-to-end.

- **Multiple design variations** (1/2/3) from the same inputs, now that the single-variation pipeline is proven.
- **Standalone budget planner** (original section 12): room type, size, quality tier (Budget/Standard/Premium/Luxury) → estimated ranges across Civil work, Painting, Electrical, Lighting, Furniture, Carpentry, Flooring, Curtains, Decor, False ceiling, with an editable quantity/price table and a live-recalculated total.
- **Design comparison** (up to 3): style, cost, palette, furniture, lighting, storage, AI score side by side, advantages/disadvantages called out.
- **Full save management**: rename, delete, favorite (`saved_designs.is_favorite`), organize into projects, download, share.
- **History with search & filter**: by room, style, budget, score, date, favorites.
- **Feedback**: 👍/👎 plus optional comment on every analysis/design result, persisted — not just logged to the console.
- **Free/paid usage limits**: enforced server-side against `usage_logs`; limits themselves live in config/env vars, never hard-coded in a frontend component (original section 35).
- **Basic admin dashboard**: users, projects, analyses, designs, and the five stat cards (Total Users, Active Users, Projects, AI Analyses, Designs Generated) from real queries.
- **Demo mode**: a `DEMO_MODE` flag pointing a demo account at seeded sample data, using the *real* dashboard/analysis/design pages — not a separate mock UI. Worth building as soon as Phase 1 ships, since it's what lets you demo the product before your AI budget/keys are fully finalized, without violating "no fake buttons."
- **Presentation mode**: full-screen, nav hidden, before/after slider + score + recommendations + budget in one clean view, for live customer demos.

---

## 8. Phase 3 — Advanced & differentiating

Higher effort-to-value or higher technical risk than everything above — build once the core product has real users and it's clear the investment is worth it.

- **Multi-language**: English, Kannada, Hindi, Telugu, Tamil, Malayalam, Marathi. Static UI via next-intl; AI-generated recommendations/chat answered directly in the user's `preferred_language` (section 3).
- **AI chat assistant** ("InteriaAI Assistant"): uses the current project's analysis/budget/style as context, backed by `chat_sessions`/`chat_messages`, streamed responses.
- **Voice interaction**: browser `SpeechRecognition`/`SpeechSynthesis`, feature-detected — if unsupported (notably Safari/iOS gaps and inconsistent regional-language voice support), the mic control simply doesn't render and text chat stays primary. This is a progressive enhancement, exactly as your original spec already frames it — don't block anything on it.
- **Deeper admin analytics**: usage charts, AI request volume/error rates, feedback aggregation.
- **Future-ready scaffolding** for marketplace, designer booking, AR/3D, contractor marketplace, payments: nullable columns or an unreferenced migration stub where genuinely cheap, otherwise just a short `FUTURE.md` note of the intended shape. No UI for any of it — per your original instruction not to fake these integrations.

---

## 9. AI service architecture

The part of your original spec with the most technical risk, so it gets the most detail. Everything else in this doc assumes these interfaces exist and are called consistently — no feature code should ever call an AI SDK directly.

### 9.1 Three provider interfaces, one factory

```
lib/ai/
  provider.ts          // factory: reads env vars, returns configured providers
  vision-analysis.ts    // VisionAnalysisProvider interface + implementations
  design-generator.ts   // ImageGenerationProvider interface + implementations
  chat.ts                // TextGenProvider interface + implementations (also powers recommendations + translation)
  recommendations.ts
  prompts.ts
  schemas.ts             // Zod schemas every AI response is validated against before persisting
```

- `VisionAnalysisProvider.analyze(images) → RoomAnalysis` — the room-photo-to-scored-JSON task (sections 6–7). Fundamentally a "look at an image, reason carefully, return structured JSON" task, which general-purpose multimodal LLMs with vision handle well. Validate against `schemas.ts`; retry once on failure before surfacing an error.
- `ImageGenerationProvider.generate(originalImage, style, palette, budget, intensity) → image[]` — the structure-preserving redesign task. See 9.2 — this is the one that needs real thought, not just "call an image API."
- `TextGenProvider.complete(context, prompt, language) → text` — powers recommendation explanations, the chat assistant, and dynamic-text translation through one pipeline instead of three.

Selected via env vars (`VISION_PROVIDER`, `IMAGE_GEN_PROVIDER`, `TEXT_PROVIDER`), so swapping a provider is a config change, never a code change — this is what "provider-independent" concretely means, not just an assertion.

### 9.2 The hard part: preserving room structure

A plain text-to-image call generates a brand-new room from a description — it has no idea where your walls, windows, or doors actually are. To satisfy "preserve room structure, don't move doors/windows" you need an **edit**, not a **generation**. Two real, current (2026) paths — pick one as the MVP default, keep the interface swappable:

- **Path A — general-purpose image-editing model.** Google's current Gemini image line ("Nano Banana"/"Nano Banana Pro") does instruction-based editing of an existing photo — adjusting style, materials, lighting, and furniture while leaving the rest of the composition intact — rather than pure text-to-image. Recommended MVP default: an established foundation-model provider with a stable public API and roadmap.
- **Path B — a specialized interior-redesign API.** Several vendors now offer "upload a room photo + style prompt → photorealistic redesigned photo, geometry preserved" as one REST call, removing the need to build and tune your own conditioning pipeline. Can get you to a working demo faster, at the cost of depending on a smaller vendor's uptime/pricing/roadmap instead of a major provider's. Worth evaluating against Path A once you have real usage data.

Whichever you pick:
- Always pass the **original photo** into the call as the base image being edited — never generate from the text prompt alone.
- Map "Light refresh / Moderate redesign / Complete redesign" to that provider's transformation-strength parameter, so the intensity selector actually does something.
- Label every result in the UI as an **AI-generated visualization**, not a guaranteed exact structural replica — even edit-based models can shift small details, and it's better to set that expectation with the customer than to over-promise based on this spec's wording.
- Persist the provider name and exact parameters used with every `design_generations` row, so a bad result is debuggable and reproducible.
- Per-image cost varies by provider/quality tier and changes often — confirm current pricing before finalizing the Phase 2 free/paid limits rather than assuming a number from this doc.

### 9.3 Validation

Every AI response — vision analysis JSON, generated recommendations, chat replies — is validated against a Zod schema in `schemas.ts` before it's saved or shown. On failure: one retry with a stricter prompt, then a user-facing "AI unavailable, please try again" state (6.12) — never a half-parsed object saved to the database.

---

## 10. Database schema

Field-level, not just table names, so RLS and foreign keys can be written correctly the first time. (Full SQL/migrations are for the agent to generate from this — this is the shape, not the DDL.)

| Table | Key fields | Relationships |
|---|---|---|
| `profiles` | `id` (=`auth.users.id`), `full_name`, `phone`, `avatar_url`, `preferred_language`, `location`, `role` (`user`/`admin`), `plan` (`free`/`paid`), `created_at`, `updated_at` | 1:1 with Supabase auth user |
| `projects` | `id`, `user_id`, `name`, `home_type`, `created_at`, `updated_at` | belongs to `profiles` |
| `rooms` | `id`, `project_id`, `room_type`, `length`, `width`, `height`, `budget_range`, `preferred_style`, `color_preferences` (jsonb) | belongs to `projects` |
| `room_images` | `id`, `room_id`, `storage_path`, `view_label` (front/side/corner), `created_at` | belongs to `rooms` |
| `analyses` | `id`, `room_id`, `room_image_id`, `overall_score`, `raw_ai_response` (jsonb), `created_at` | belongs to `rooms` |
| `analysis_scores` | `id`, `analysis_id`, `category` (space_utilization/lighting/color_harmony/furniture_layout/storage/style_consistency), `score`, `explanation` | belongs to `analyses` |
| `recommendations` | `id`, `analysis_id`, `category`, `suggestion`, `reasoning`, `created_at` | belongs to `analyses` |
| `design_generations` | `id`, `room_id`, `analysis_id` (nullable), `style`, `color_palette` (jsonb), `budget_range`, `design_intensity`, `provider_used`, `provider_params` (jsonb), `original_image_url`, `generated_image_urls` (jsonb array), `budget_breakdown` (jsonb: furniture/lighting/paint/curtains/decor/other), `estimated_total_min`, `estimated_total_max`, `status`, `created_at` | belongs to `rooms` |
| `saved_designs` | `id`, `user_id`, `design_generation_id`, `custom_name`, `is_favorite`, `created_at`, `updated_at` | belongs to `profiles` + `design_generations` |
| `budget_estimates` | `id`, `room_id`, `quality_level`, `total_min`, `total_max`, `created_at` | belongs to `rooms`; **Phase 2 standalone planner only** — see note below |
| `budget_items` | `id`, `budget_estimate_id`, `category` (civil_work/painting/electrical/lighting/furniture/carpentry/flooring/curtains/decor/false_ceiling), `min_amount`, `max_amount`, `user_edited` | belongs to `budget_estimates` |
| `shared_designs` | `id`, `design_generation_id`, `share_token` (unique), `is_enabled`, `view_count`, `created_at` | belongs to `design_generations` |
| `chat_sessions` | `id`, `user_id`, `project_id` (nullable), `created_at` | belongs to `profiles` |
| `chat_messages` | `id`, `chat_session_id`, `role` (`user`/`assistant`), `content`, `created_at` | belongs to `chat_sessions` |
| `feedback` | `id`, `user_id` (nullable), `target_type` (`analysis`/`design`/`general`), `target_id` (nullable), `rating` (`helpful`/`not_helpful`), `comment`, `created_at` | polymorphic, nullable FK |
| `usage_logs` | `id`, `user_id`, `action_type` (`analysis`/`generation`/`chat_message`), `metadata` (jsonb), `created_at` | belongs to `profiles`; drives Phase 2 usage limits and admin stats |

**Two schema notes:** `favorites` and `subscriptions` from your original list are intentionally not separate tables yet — favorites lives on `saved_designs.is_favorite`, and `plan` on `profiles` is enough until Phase 3 actually wires up billing. The per-design *quick* budget estimate (6.9) lives directly on `design_generations` as `budget_breakdown`/`estimated_total_*` — it's AI-authored and read-only. `budget_estimates`/`budget_items` is a separate, fully editable structure for the Phase 2 standalone planner, which uses a different category set entirely (Civil work, Painting, Electrical… vs. Furniture, Lighting, Paint…). These are two different features that happen to both produce a number in rupees; conflating their schemas would make both harder to build correctly.

**RLS pattern for every table above:** `auth.uid() = user_id` directly, or via a join up to the owning `project`/`room` for tables without their own `user_id`. Admin policies check `profiles.role = 'admin'` explicitly — the service-role key is used only in server-only code paths (AI callbacks, admin aggregate queries), never as a substitute for writing the real policy.

---

## 11. API surface

| Endpoint | Method | Notes |
|---|---|---|
| `/api/projects` | GET, POST | list / create |
| `/api/projects/:id` | GET, PATCH, DELETE | PATCH added — original omitted update |
| `/api/rooms/analyze` | POST | Phase 1 core |
| `/api/designs/generate` | POST | Phase 1 (single) → Phase 2 (variations) |
| `/api/designs` | GET | list |
| `/api/designs/save` | POST | |
| `/api/designs/:id` | PATCH, DELETE | PATCH added, for rename/favorite |
| `/api/budget/calculate` | POST | Phase 2 standalone planner |
| `/api/chat` | POST | Phase 3, streamed |
| `/api/share` | POST | creates/toggles a `shared_designs` row |
| `/api/feedback` | POST | Phase 2 |
| `/api/dashboard/stats` | GET | backs the overview cards |
| `/api/usage` | GET | Phase 2 — current usage vs. plan limit, so the frontend can honestly show "X of Y used" |

All: validated server-side with the same Zod schemas as the forms; proper status codes (400 validation, 401/403 auth, 404, 429 rate-limited, 500 with a logged-but-not-exposed error).

---

## 12. Cross-cutting requirements (apply to every phase)

- **Responsive**: sidebar (desktop) → collapsible sidebar (tablet) → bottom nav (mobile).
- **Visual design**: modern, elegant, minimal, architecture-inspired; large room imagery, soft shadows, rounded corners, generous whitespace; avoid gradients and animation for their own sake.
- **Accessibility**: keyboard navigation, labeled form fields, alt text on every room/design image, visible focus states, WCAG AA contrast, ARIA where semantic HTML isn't enough.
- **Performance**: `next/image` for every room/design photo, lazy-loaded below the fold, paginated list queries, short-TTL caching on read-heavy endpoints like dashboard stats.
- **Security**: rate limiting (Upstash) specifically on every AI-calling endpoint — these are the expensive ones — plus auth-gating generally; sanitize all user text before it reaches a prompt or the database; never return a stack trace or raw provider error body to the client.
- **Testing**: Vitest for unit tests on validation/schema logic (the Zod schemas in `lib/ai/schemas.ts` are the highest-value target); one Playwright end-to-end test covering the Phase 1 core loop. This catches real regressions faster than a large suite of shallow unit tests at this stage.

---

## 13. Environment variables (`.env.example`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_APP_URL=

VISION_PROVIDER=            # e.g. anthropic | google
IMAGE_GEN_PROVIDER=         # e.g. google | modelslab | meltflex
TEXT_PROVIDER=              # e.g. anthropic | openai

ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
OPENAI_API_KEY=
IMAGE_GEN_API_KEY=          # only if IMAGE_GEN_PROVIDER is a third-party vendor, not Google directly

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

FREE_TIER_ANALYSIS_LIMIT=5
FREE_TIER_GENERATION_LIMIT=3

DEMO_MODE=false
```

Never commit a filled-in `.env` — only `.env.example` with placeholders.

---

## 14. Definition of done

**Phase 0:** migrations run clean on a fresh Supabase project; RLS denies cross-user reads in a manual test; a signed-in user reaches `/dashboard` and a signed-out user is redirected; all three AI provider health checks succeed.

**Phase 1:** a brand-new user can sign up → create a project+room → upload a real photo → get a real analysis with scores and recommendations → generate one design → see before/after → see a budget estimate → save it → view it again after logging out and back in — zero console errors, zero dead buttons.

**Phase 2:** the same flow, plus: 3 variations generate correctly; the standalone budget calculator's totals update live when quantities/prices are edited; comparing 3 saved designs renders correctly; free-tier limits actually block the 6th analysis for a free user; demo mode shows a fully populated dashboard with no real AI key required.

**Phase 3:** switching `preferred_language` changes both static UI and a freshly generated recommendation's language; the chat assistant correctly answers using the current project's real analysis data; voice input works in Chrome and degrades to text-only, without error, in a browser that doesn't support `SpeechRecognition`.

---

## Appendix — original section → phase map

| Original # | Section | Phase |
|---|---|---|
| 1 | Tech stack | 0 |
| 2 | Landing page | 1 |
| 3 | Authentication | 1 |
| 4 | Customer dashboard | 1 |
| 5 | Create new project | 1 |
| 6 | AI room analysis | 1 |
| 7 | Good/needs-improvement scoring | 1 |
| 8 | AI recommendations | 1 |
| 9 | AI design generator | 1 (single) → 2 (variations) |
| 10 | Before/after comparison | 1 |
| 11 | Design details | 1 |
| 12 | Budget planner | 2 |
| 13 | Design comparison | 2 |
| 14 | Save designs | 2 |
| 15 | Design history | 2 |
| 16 | Search & filter | 2 |
| 17 | Multi-language | 3 |
| 18 | Voice assistant | 3 |
| 19 | AI chat assistant | 3 |
| 20 | Share page | 1 (basic + toggle) |
| 21 | Admin dashboard | 2 (basic) → 3 (advanced) |
| 22 | Database design | 0 |
| 23 | Storage | 0 |
| 24 | Backend API | 0 (skeleton) → 1 (core routes) |
| 25 | AI service architecture | 0 (skeleton) → all phases |
| 26 | Security | 0, then every phase |
| 27 | Error handling | 1 |
| 28 | Loading experience | 1 |
| 29 | Responsive UI | every phase |
| 30 | Premium UI design | every phase |
| 31 | Accessibility | every phase |
| 32 | Performance | every phase |
| 33 | Feedback system | 2 |
| 34 | Future-ready features | 3 (scaffolding only) |
| 35 | Free/paid usage | 2 |
| 36 | Environment variables | 0 |
| 37 | Project structure | 0 |
| 38 | Demo mode | 2 |
| 39 | Presentation mode | 2 |
| 40 | Final QA checklist | replaced by section 14 (per-phase) |
