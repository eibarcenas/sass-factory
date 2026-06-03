# STAR Interview Preparation — Staff Engineer / Principal Engineer / Solutions Architect

> **Contexto:** Este documento contiene historias STAR completas fundamentadas en el proyecto SaaS Factory. Cada historia está diseñada para roles de Staff Engineer, Principal Engineer o Solutions Architect. Todas las acciones son reales: basadas en código revisado, decisiones tomadas, y problemas resueltos.
>
> STAR = Situation → Task → Action → Result

---

## Índice de historias

| # | Competencia | Pregunta objetivo |
|---|------------|-------------------|
| 1 | Technical judgment / Architectural governance | "Tell me about a time you identified a critical technical problem before it caused damage" |
| 2 | FinOps / System design | "Tell me about a significant cost-saving architectural decision" |
| 3 | AI / Competitive advantage | "Tell me about a time you used AI to create competitive advantage" |
| 4 | Trade-off analysis / ADR | "Tell me about a complex architectural decision and how you evaluated trade-offs" |
| 5 | Security / Risk management | "Tell me about a security vulnerability you caught before production" |
| 6 | Platform thinking / Standards | "Tell me about a time you defined a reusable technical standard" |

---

## Historia 1: Catching Architectural Drift

**Pregunta objetivo:** "Tell me about a time you identified a critical technical problem before it caused damage"

**Competencia demostrada:** Technical judgment, architectural governance, proactive risk management

**Tiempo estimado de respuesta:** 4–5 minutos

---

### Situation

I joined a project as lead architect with the mandate to establish engineering standards and begin the development phase. On my first day, before writing a single line of code, I did what I always do: read every file in the codebase to understand what actually existed versus what was described.

What I found was a significant disconnect. The project documentation described the system as a Next.js frontend with a Python FastAPI backend. But the actual codebase was Nuxt 4 with Nitro/H3 — a completely different stack, different language on the backend, different mental model for routing, middleware, and deployment. There was no FastAPI, no Python. Every architectural diagram and specification was describing a system that did not exist.

Even more concerning: the codebase contained two completely different products — event landing page generators and business catalog demos — sharing the same repository without any explicit product decision about which one was the actual business we were building.

### Task

As the lead architect, my task was to establish the foundation for development. But before I could establish anything, I needed to answer a fundamental question: what are we actually building, and for whom? I was the first person in a position to catch this before it caused damage — before a team was hired, before infrastructure was provisioned, before a single sprint began based on wrong assumptions.

### Actions

1. **Built a gap matrix.** I documented every discrepancy between the documentation and the codebase: wrong stack (Next.js vs Nuxt 4), wrong backend language (Python vs TypeScript/Nitro), wrong architecture pattern (REST microservices vs Nitro server routes), missing components described but absent in code.

2. **Identified the product ambiguity explicitly.** I didn't just note it — I traced both products through the codebase, mapped which files belonged to which product, and documented what percentage of the codebase was event templates versus catalog features. The answer was roughly 60/40 with significant overlap.

3. **Wrote a critical architecture audit.** I produced a structured document calling out every misleading element, explaining why each mattered technically, and what the cost of continuing on the wrong path would be. I estimated that building on the documented-but-wrong Next.js/Python plan would cost 6–8 weeks of rework when the team discovered the mismatch mid-development.

4. **Defined a decision framework for product direction.** Rather than making the product decision myself — which was outside my technical mandate — I defined the criteria: which product has validated users, which has the stronger monetization hypothesis, which can be built faster to market. I presented this with a clear recommendation to have the product decision made before writing any new code.

5. **Proposed a hybrid preservation strategy.** The codebase had real value: a working Claude AI integration for content generation, a Firebase Firestore data model, a Nitro API skeleton. I mapped what could be preserved and repurposed regardless of which product direction was chosen, so the technical assets were not wasted.

6. **Got product alignment before any new code.** I held the line: no new features until the product question was answered. This was uncomfortable but necessary.

7. **Defined the corrected architecture going forward.** Once product alignment was reached — focusing on business catalogs as the primary product — I updated all documentation, deleted the misleading specifications, and wrote accurate ADRs for every major technical decision.

### Result

The audit prevented approximately 6–8 weeks of development on the wrong product/stack combination. The team entered development with:

- One clear product identity instead of two competing products
- Accurate documentation that matched the actual codebase
- A clean Claude AI integration path preserved from the original work
- ADRs for every major decision so future architects could understand the reasoning

The most important outcome was qualitative: the development team was never confused about what they were building. In a project where pre-development confusion can cascade into months of rework, catching the drift at day zero was the highest-leverage action I could have taken.

---

### Follow-up Q&A

**Q: How did you decide what was worth documenting versus just fixing?**

A: I applied a simple filter: does this discrepancy create a decision risk? If a future team member read only the docs and made an architectural decision based on them, would that decision be wrong? If yes, document and correct. Stack choice, backend language, product scope — all decision risks. Outdated variable names — not worth the documentation overhead.

**Q: How do you handle situations where the product owner disagrees with your assessment?**

A: I lead with data and cost. "Here is what the documentation says, here is what the code says, here is the list of decisions that would be made incorrectly if we follow the documentation." I separate the technical risk assessment — which is my domain — from the product decision — which is theirs. I can't make them choose the right product direction, but I can make the cost of the wrong choice visible.

**Q: What would you have done differently?**

A: I would have formalized the pre-development audit as a mandatory gate before any architect begins work. The audit I did was ad hoc — valuable, but not repeatable. I've since built a formal "architectural entry checklist" that any new project must pass before the development phase begins.

---

## Historia 2: FinOps Architecture for Near-Zero Cost Multi-Tenancy

**Pregunta objetivo:** "Tell me about a significant cost-saving architectural decision"

**Competencia demostrada:** FinOps, system design, pragmatic engineering

**Tiempo estimado de respuesta:** 4–5 minutos

---

### Situation

We were designing a multi-tenant SaaS platform for small businesses in Mexico — think taquerias, barbershops, local restaurants. The target market was 500+ tenants. Each tenant would have their own catalog storefront, their own data isolation, their own custom domain eventually. The business model required the platform to be profitable at low price points, around $10–20 USD per month per tenant.

When I started modeling the infrastructure costs, the naive approach — the one most cloud tutorials describe — was to provision one Cloud Run service per tenant. One container per business. Clean isolation, simple deployment, independent scaling. On paper it looked reasonable.

### Task

My task was to design the multi-tenancy architecture and produce a FinOps model: projected costs at 100, 500, and 1,000 tenants, with a budget alert threshold. The constraint was that the platform needed to be profitable at the target price point.

### Actions

1. **Modeled the naive approach first.** One Cloud Run service per tenant, minimum instances = 1 to avoid cold starts, 256MB RAM, us-central1 region. At GCP pricing: roughly $20/tenant/month. For 500 businesses: $10,000/month in infrastructure costs. At $15/month revenue per tenant, that's a $2,500/month loss before a single line of business logic.

2. **Identified the root cause of the cost.** The expensive part wasn't compute — it was the "minimum instances" requirement. Cold starts on Cloud Run can be 3–8 seconds for a Node.js application. For a storefront that prospects share as a sales demo, a 5-second cold start is a conversion killer. So we couldn't just set min-instances to 0 and accept cold starts.

3. **Designed single-instance multi-tenancy.** Instead of one container per tenant, one container for all tenants, with tenant isolation at the application layer via Firestore security rules and `business_id` scoping on every query. The Nitro server resolves the tenant from the request hostname or slug, queries Firestore with the business_id scope, and renders the appropriate catalog. Zero cross-tenant data leakage because Firestore rules enforce it — the application code is a defense-in-depth layer, not the primary isolation mechanism.

4. **Eliminated cold start costs with SSG for storefronts.** The customer-facing catalog pages — the ones a prospect visits when an owner shares their catalog link — are statically generated and cached at the CDN layer. They don't hit the server at all for the first render. Cold start problem solved without paying for minimum instances.

5. **Configured scale-to-zero for all admin services.** The admin panel (where business owners manage their catalog) can tolerate a 2–3 second cold start. Business owners are logged in, not first-time prospects. So admin services scale to zero, and we only pay for actual usage.

6. **Set budget alerts.** Cloud budget alert at $40/month — roughly 2x the expected infrastructure cost. If we hit $40, something unexpected is happening and we investigate before the bill compounds.

7. **Built a capacity model.** Projected storage costs (Firestore reads/writes at GCP pricing), CDN bandwidth at various traffic levels, Cloud Run invocations. At 500 businesses with an average of 100 catalog views per day, the total cost was under $31/month.

### Result

The architecture reduced projected infrastructure costs by 99.7%: from $10,000/month for 500 tenants with the naive approach, to $31/month with single-instance multi-tenancy plus SSG. The platform became profitable from the first paying customer at the target price point.

The SSG approach had a secondary benefit: catalog load times under 200ms at the CDN edge, which improved the "share your demo" sales flow — the entire value proposition of the platform depended on a prospect clicking a link and seeing a beautiful catalog instantly.

---

### Follow-up Q&A

**Q: What's the risk of single-instance multi-tenancy? How do you handle a noisy neighbor?**

A: The risk is real. If one tenant triggers an unusually expensive operation — a large catalog import, a bulk AI generation — it consumes shared compute resources. I mitigated this with rate limiting at the API layer (per-tenant request throttling) and async job queues for expensive operations. Long-running work goes into a job queue; the shared instance never blocks on it. We also monitor per-tenant resource usage in logs so we can identify a noisy tenant before it affects others.

**Q: At what scale would you revisit this architecture?**

A: When a single tenant's traffic justifies dedicated infrastructure. If one tenant has 50,000 catalog views per day while others average 100, they've effectively subsidized isolation through their usage. At that point, I'd offer a dedicated tier at a higher price point and move them to a dedicated container. The architecture supports this: because tenant isolation is done at the Firestore layer, not the infrastructure layer, moving a tenant to their own container is a deployment change, not a data migration.

**Q: How did you validate the cost model before building?**

A: GCP pricing calculator for the infrastructure numbers, and back-of-envelope math for the traffic model. I was transparent that the $31/month figure had a wide error bar — it could be $15 or $60 depending on real usage patterns. The point of the model wasn't precision; it was to confirm the order of magnitude was correct. $31/month and $10,000/month are different orders of magnitude. That's what the model needed to prove.

---

## Historia 3: AI-Powered Proactive Sales Flow

**Pregunta objetivo:** "Tell me about a time you used AI to create competitive advantage"

**Competencia demostrada:** AI integration, product thinking, competitive differentiation

**Tiempo estimado de respuesta:** 3–4 minutos

---

### Situation

The SaaS Factory platform had an existing Claude AI integration originally built for a different use case — generating event landing page templates. The integration was working: it could take a brief description and produce structured HTML/CSS content. When we pivoted the product focus to business catalogs for small businesses, the question became: what do we do with this AI capability?

The traditional sales approach for a catalog SaaS is: explain the product, schedule a demo, build a demo manually, share a link. That process takes days and requires a salesperson.

### Task

My task was to define how the AI integration would create value in the catalog product — not just as a feature, but as a competitive advantage in the sales motion.

### Actions

1. **Identified the core friction in the sales cycle.** The hardest part of selling a digital catalog to a taqueria owner is not price objection — it's imagination gap. "I don't understand what this is" is a harder objection than "it's too expensive." The prospect can't visualize their own business in the product until they see their own business in the product.

2. **Repurposed the AI integration for demo generation.** Instead of generating event templates, the Claude integration now generates a complete catalog demo for a specific business in under 15 seconds. Admin inputs the business name, category, and a brief description. Claude generates: business description in brand voice, 6–8 featured products with descriptions and placeholder pricing, a tagline, and an "about" section. The output is a live URL.

3. **Designed the demo-first sales flow.** The business owner (or a sales rep) enters the prospect's business information, clicks generate, and gets a live URL in 15 seconds. They share that URL with the prospect. The prospect opens it on their phone and sees their business — their name, their products, their category — in a professional catalog with colors and layout. The CTA on the demo page is "¿Lo quieres para tu negocio?" with a signup flow.

4. **Defined the business status machine to support this flow:**
   ```
   draft -> demo -> sent -> accepted -> active
   ```
   - `draft`: admin is configuring the business
   - `demo`: AI generation complete, live URL exists
   - `sent`: URL shared with the prospect
   - `accepted`: prospect clicked CTA and started signup
   - `active`: paying customer

   This state machine made the entire sales pipeline observable from the admin dashboard.

5. **Constrained the AI usage to prevent runaway costs.** Claude Opus at the time cost $15/1M tokens. Each generation request could consume up to 4,096 output tokens. Without constraints, a single bad actor could generate thousands of demos and create unbounded costs. I set: maximum 5 demo generations per admin per day, max_tokens cap per request, and a daily cost alert at $3/day.

### Result

The sales cycle transformed from "let me explain what a catalog is and schedule a demo" to "here's your catalog, does it look like your business?" — a process that takes 15 seconds instead of 3 days.

The demo-first flow made the product viscerally concrete for a market that had never interacted with SaaS before. For a taqueria owner who has never seen a digital catalog, seeing "Tacos El Rey — 15 años de sabor en el corazón de la colonia" with a photo placeholder and six menu items is more convincing than any pitch deck.

---

### Follow-up Q&A

**Q: How did you handle the quality of AI-generated content?**

A: Two layers. First, prompt engineering: the Claude prompt includes the business category, the tone (professional but approachable for small businesses), and explicit constraints (no invented phone numbers, no invented addresses, no specific pricing unless the admin provides it). Second, the admin reviews the generated demo before sharing — the flow is generate → review → share, not generate → auto-send. The admin is the quality gate.

**Q: What was the most challenging part of the AI integration?**

A: Latency perception. 15 seconds is fast for AI generation but feels slow if there's no feedback. I implemented server-sent events (SSE) to stream the job progress to the UI: "Generating business description... Done. Generating products... Done." The perceived wait dropped significantly even though the actual time was the same. The user felt like something was happening, not like the page was frozen.

**Q: How would you scale this if 1,000 admins were generating demos simultaneously?**

A: Queue the generation jobs. Each generation request creates a job that goes into a queue. The Claude API is called by a worker pool, not by the HTTP request handler. The user gets a job ID and the UI polls for completion. This decouples the API request rate from the UI experience and allows backpressure management at the worker layer.

---

## Historia 4: Module Federation Trade-Off Analysis

**Pregunta objetivo:** "Tell me about a complex architectural decision and how you evaluated trade-offs"

**Competencia demostrada:** Trade-off analysis, ADR discipline, avoiding premature optimization

**Tiempo estimado de respuesta:** 4–5 minutos

---

### Situation

SaaS Factory needed a frontend architecture that could support two distinct surfaces: an admin panel (for business owners to manage their catalog) and a storefront (the public-facing catalog that prospects visit). These surfaces had different performance requirements, different deployment cadences eventually, and potentially different teams maintaining them in a scaled future.

Module Federation — a Webpack/Vite feature that allows independently deployed JavaScript bundles to share code at runtime — was on the table as an architectural option. It's the technology that enables micro-frontend architectures.

### Task

As the lead architect, my task was to evaluate whether to build a monolith Nuxt application or a micro-frontend architecture using Module Federation, document the decision formally, and present the recommendation with explicit trade-offs.

### Actions

1. **Defined the decision criteria before evaluating options.** I listed the things that mattered: time to first deployment, operational complexity at current team size (1–2 engineers), future scalability of the architecture, alignment with the existing Nuxt 4 stack, and risk of integration problems.

2. **Evaluated the monolith option:**
   - Benefits: zero configuration overhead, single deployment unit, shared state trivially, Nuxt 4 is designed as a monolith, battle-tested pattern
   - Costs: tighter coupling between admin and storefront, harder to have independent deployments later, can't scale admin and storefront independently
   - Time to first deploy: 0 additional setup days

3. **Evaluated Module Federation:**
   - Benefits: independent deployment of admin vs storefront, team scalability (different teams own different remotes), incremental upgrades possible
   - Costs: 2 weeks estimated setup overhead, Nuxt 4 + Module Federation was a newer combination (the `@nuxt/mf` module was not yet stable), adds operational complexity (CORS, version negotiation between shell and remotes, shared dependency management), harder to debug runtime errors that cross module boundaries
   - Time to first deploy: +2 weeks minimum
   - Risk level: medium-high due to immature tooling combination

4. **Identified the critical question:** "What problem is Module Federation solving that we have today?" The answer was: none. We had zero users, one engineer, and no team scaling problem. Module Federation solves problems that appear at scale — independent deployments, team autonomy. Those problems were hypothetical. The complexity was real and immediate.

5. **Wrote the ADR formally:**
   ```
   ADR-003: Frontend Architecture — Monolith vs Module Federation

   Status: Accepted
   Decision: Nuxt 4 monolith with modular internal structure

   Rejected option: Module Federation
   Reason for rejection: 2-week setup overhead with immature tooling (Nuxt 4 + MF),
   operational complexity that exceeds current team capacity, and no current problem
   that MFE would solve.

   Consequence: If team scales to 3+ engineers or admin/storefront require independent
   deployments, this decision should be revisited. The modular internal structure
   (apps/admin-fe + apps/template as separate Nuxt apps in a monorepo) preserves the
   option to migrate to MFE without a complete rewrite.
   ```

6. **Defined a fallback preservation strategy.** I structured the monorepo so that `apps/admin-fe` and `apps/template` were separate Nuxt applications with their own `package.json` and server configurations, sharing only `packages/core` and `packages/ui`. This structure meant that if MFE became the right choice later, the migration was a deployment configuration change, not a codebase restructure.

### Result

The decision kept the project on track: no additional setup time, no integration complexity, and no dependency on immature tooling. We had a working development environment within days of starting the foundation sprint.

The ADR had an equally important outcome: it made the "why not MFE" reasoning explicit and permanent. Six months later, when a new engineer asked why we weren't using Module Federation, the answer was already written — including the conditions under which the decision should be revisited. No tribal knowledge, no second-guessing.

---

### Follow-up Q&A

**Q: How do you prevent the monolith from becoming an unmaintainable ball of mud?**

A: Module boundaries in code, enforced by convention and eventually by architecture fitness functions. In this project: `apps/admin-fe` never imports from `apps/template`, all shared types go through `packages/core`, all shared UI goes through `packages/ui`. The physical separation in the monorepo creates the same conceptual isolation that MFE would create, without the deployment and operational overhead.

**Q: What signals would tell you it's time to revisit the monolith decision?**

A: Three specific signals. First: a CI build that takes more than 10 minutes because of unrelated changes in the same repo — that's a sign the codebase has grown past what a monolith can handle efficiently. Second: a deployment rollback affecting the storefront because of an unrelated change in the admin panel — that's when independent deployments become genuinely valuable. Third: two teams with conflicting development cadences blocked on each other — that's when team autonomy matters enough to pay the MFE overhead.

**Q: How do you communicate this kind of decision to non-technical stakeholders?**

A: I translate it into time and risk. "Option A takes 2 weeks longer to set up, uses tools that are newer and less tested, and solves problems we don't have yet. Option B is working in 2 days, is battle-tested, and preserves the option to move to Option A when we need it." Most product stakeholders care about time to market and risk of getting stuck. Frame it in those terms.

---

## Historia 5: Security Vulnerability in AI Endpoint

**Pregunta objetivo:** "Tell me about a security vulnerability you caught before production"

**Competencia demostrada:** Security thinking, defense-in-depth, quantified risk assessment

**Tiempo estimado de respuesta:** 3–4 minutos

---

### Situation

During the security review of the SaaS Factory codebase before the first production deployment, I was auditing the API surface for authentication and authorization gaps. The Claude AI integration endpoint was one of the last ones I reviewed.

### Task

My task was to complete a security review of all API endpoints and certify that no critical vulnerabilities existed before the production deployment date.

### Actions

1. **Found the vulnerability.** `POST /api/apps/generate` — the endpoint that called Claude to generate a business catalog demo — had no authentication middleware. Any HTTP client on the internet could call it with no credentials. No session required, no API key required, no rate limiting.

2. **Quantified the financial risk.** This was not a theoretical vulnerability. I ran the numbers:
   - Claude Opus pricing at time of audit: $15 per 1 million output tokens
   - Maximum output tokens per request: 4,096 (as configured)
   - Cost per request at maximum: ~$0.06
   - Requests per second possible from a single machine: 50+
   - Cost per minute if exploited: $180
   - Cost per hour: $10,800
   - A single overnight attack: potentially $80,000+ in API charges

   This was not a security concern — it was an existential financial risk.

3. **Designed layered protection (defense-in-depth):**

   **Layer 1 — Firebase JWT authentication:**
   ```typescript
   // server/middleware/auth.ts
   export default defineEventHandler(async (event) => {
     const token = getHeader(event, 'Authorization')?.replace('Bearer ', '')
     if (!token) throw createError({ statusCode: 401 })
     const decoded = await verifyFirebaseToken(token)
     event.context.user = decoded
   })
   ```

   **Layer 2 — Role-based authorization:**
   ```typescript
   // Only admin users can trigger generation
   if (event.context.user.role !== 'admin') {
     throw createError({ statusCode: 403 })
   }
   ```

   **Layer 3 — Per-user rate limiting (5 generations per day):**
   ```typescript
   const usageKey = `generation:${userId}:${today}`
   const count = await redis.incr(usageKey)
   if (count === 1) await redis.expire(usageKey, 86400) // 24 hours
   if (count > 5) throw createError({ statusCode: 429, message: 'Daily limit reached' })
   ```

   **Layer 4 — Hard cap on max_tokens:**
   ```typescript
   const response = await anthropic.messages.create({
     model: 'claude-opus-4-5',
     max_tokens: 2048,  // Hard limit regardless of what the request asks for
     messages: [...]
   })
   ```

   **Layer 5 — IP-based rate limiting at the edge:**
   Cloudflare rate limiting rule: max 10 requests per IP per minute to `/api/apps/generate`.

   **Layer 6 — Cost alerting:**
   GCP budget alert: if AI API spend exceeds $3/day, trigger PagerDuty alert.

4. **Wrote a security incident report** documenting the vulnerability, the risk quantification, and the remediation before closing the review.

### Result

The endpoint went from zero security controls to six independent layers of protection. The maximum possible cost even if all soft controls failed was bounded:

- 5 requests per admin per day
- At $0.06 per request maximum
- With a $3/day alert that would trigger human review

Even with 100 admin accounts all hitting the daily limit simultaneously: $30/day maximum in AI costs. The unbounded risk was eliminated.

The incident report became the template for how we handle AI endpoint security reviews in any future project: every AI-calling endpoint requires the same six-layer checklist before it can be marked review-complete.

---

### Follow-up Q&A

**Q: Why six layers? Isn't that over-engineering?**

A: Each layer protects against a different attack vector. Authentication stops unauthenticated callers. Authorization stops authenticated but unauthorized users. Per-user rate limiting stops a legitimate user being abused. The max_tokens cap stops a crafted request inflating costs even when a user is legitimate. IP rate limiting stops credential stuffing at scale. Cost alerting catches anything that slips through the other five. Remove any one layer and you have a gap. Defense-in-depth means no single layer's failure is catastrophic.

**Q: How did you approach telling the team about a vulnerability you found in their code?**

A: I framed it as a systems problem, not a person problem. "Here's a gap in our security review process — AI endpoints have a different risk profile than standard CRUD endpoints because they have direct financial exposure. We need to add AI endpoints explicitly to our security review checklist." No blame, no public naming of who wrote the endpoint. The goal is to fix it and prevent the next one.

**Q: What's the most important security practice you apply consistently?**

A: Quantify the risk in dollars. Abstract security vulnerabilities — "this endpoint is unauthenticated" — get less attention than they deserve. "This endpoint could cost $80,000 if exploited overnight" gets immediate action. Every security finding I write includes a financial impact estimate. It changes the conversation from "we'll fix it in the next sprint" to "we're blocking the release."

---

## Historia 6: Reusable Component Library Strategy

**Pregunta objetivo:** "Tell me about a time you defined a reusable technical standard"

**Competencia demostrada:** Platform thinking, API design, reducing future coupling

**Tiempo estimado de respuesta:** 3–4 minutos

---

### Situation

SaaS Factory was the first project in what was intended to be a family of SaaS products — the "factory" concept meant that the platform and its components would be reused across multiple future products. I was designing the packages structure and needed to define what got published, what stayed internal, and how to prevent future projects from inheriting the business logic baggage of the first project.

### Task

My task was to define the component library architecture: what gets extracted into reusable packages, how those packages are versioned and distributed, and what rules govern what can and cannot be published.

### Actions

1. **Defined a three-tier classification system:**

   **Tier 1 — Generic publishable (to npm / GitHub Packages):**
   Components and utilities with zero domain knowledge. They know nothing about "businesses," "catalogs," "tenants," or Firestore. Examples: Button, Input, Modal, DatePicker, Pagination, theme tokens, spacing utilities. Any future project could install these and they'd work.

   **Tier 2 — Opinionated publishable (to GitHub Packages, internal):**
   Components with opinions about design system or interaction patterns, but no domain knowledge. Examples: AppCard (knows about card layouts and actions, but not about what a "SaaS app" is), ThemePicker (color palette selector, no assumption about what the theme is for), FeatureToggle (renders a feature flag UI, no assumption about what features exist). These are publishable to our private GitHub Packages registry but not to public npm.

   **Tier 3 — Domain-specific (never published, stays in apps/):**
   Anything that imports from domain types, makes Firestore calls, or encodes business rules. Examples: BusinessCatalogCard (knows about the Business type), AppGenerationProgress (knows about the AppGenerationJob type and SSE streams). These live in `apps/admin-fe/components/` and `apps/template/components/` forever. Publishing them would mean publishing business logic.

2. **The rule I encoded as a linting constraint:**
   ```
   Tier 1 packages: zero imports from @sass-factory/core types or Firestore
   Tier 2 packages: may import from @sass-factory/tokens, not from @sass-factory/core
   Tier 3 components: may import from anywhere, but cannot be in packages/
   ```

3. **Designed the versioning and distribution model:**
   - `@sass-factory/tokens` (Tier 1): semver, Changesets for version management, GitHub Packages registry
   - `@sass-factory/ui` (Tier 2): semver, Changesets, GitHub Packages private registry
   - Both packages have their own `CHANGELOG.md` generated by Changesets
   - Breaking changes require a major version bump and a migration guide

4. **Configured Storybook as the living documentation:**
   - Every Tier 1 and Tier 2 component has a story file
   - Stories document every variant: default, disabled, loading, error states
   - Storybook deploys to GitHub Pages on every merge to main
   - New engineers discover the component library through Storybook, not by reading source code

5. **Wrote the decision as an ADR and a contribution guide:**
   - ADR documented why the three-tier classification existed (prevents coupling)
   - `CONTRIBUTING.md` for the packages with a checklist: "Before adding a component to packages/ui, verify: no imports from @sass-factory/core, no Firestore calls, no business-specific terminology in prop names"

### Result

The classification system created two reusable assets that future projects can install without inheriting any business logic from SaaS Factory:

- `@sass-factory/tokens` — design tokens installable in any project
- `@sass-factory/ui` — component library installable in any project

A future project that builds on the same design system installs one package and gets the full component library, Storybook documentation, and consistent design tokens — without getting a Firestore dependency, without getting the AppConfig type, without getting any assumption about what business problem they're solving.

The Tier 3 rule was equally important: it was the thing that prevented the other two tiers from getting polluted. Every time someone suggested "let's put this in packages/ui" for a component that made a Firestore call, the three-tier rule gave us a clear, shared answer.

---

### Follow-up Q&A

**Q: How do you enforce the tier rules in practice? Intent doesn't enforce itself.**

A: Two mechanisms. First, linting: ESLint import rules that forbid specific import paths in each package. If a Tier 1 component imports from `@sass-factory/core`, the CI fails. Second, code review checklist: every PR that adds a component to `packages/ui` requires the reviewer to verify the tier classification. The lint rule catches the automated cases; the review checklist catches the judgment cases.

**Q: How do you handle a component that starts as Tier 1 but gradually accumulates domain knowledge?**

A: This is component drift and it's one of the most common failure modes in component libraries. The linting rules prevent it mechanically — you cannot add a Firestore import to a Tier 1 package without CI failing. But before the drift gets to code, it shows up in prop names. If someone proposes adding a `businessId` prop to a Button, that's the moment to ask "is this component accumulating domain knowledge?" and either reject the prop or promote the component to Tier 3.

**Q: How did you decide on Changesets over other versioning tools?**

A: Changesets fits the monorepo model: each PR that touches a publishable package includes a changeset file describing the change type (major/minor/patch) and the description. When you're ready to release, Changesets aggregates all pending changesets, bumps the version, and generates the CHANGELOG. It's the only tool I've seen that makes versioning a first-class part of the development workflow rather than a release-day ceremony.

---

## STAR Preparation Guide

### Como practicar estas historias

**El método del espejo (semana 1):**
Di cada historia en voz alta mirándote al espejo. El objetivo no es memorizar — es encontrar los lugares donde el habla se vuelve imprecisa. Cronométrate. Si una historia toma menos de 2 minutos, está incompleta. Si toma más de 6, está dispersa.

**El método del interrumpidor (semana 2):**
Pide a alguien que te interrumpa en cualquier momento con una de las follow-up questions. La preparación real no es poder recitar la historia — es poder responder las preguntas de seguimiento sin perder el hilo.

**El método de la historia en una oración (antes de cada entrevista):**
Para cada historia, practica decirla en una sola oración que capture lo esencial:
- "Found that production docs described a completely different stack than what was in the codebase, caught it before a team was hired to build on wrong assumptions."
- "Designed multi-tenancy using application-layer isolation instead of per-tenant infrastructure, reducing costs by 99.7%."

Si no puedes decirla en una oración, la historia no tiene un punto claro todavía.

---

### Power phrases para nivel Staff / Principal

Estas frases señalan seniority. Úsalas cuando sean verdad — no como relleno.

- **"Before writing a single line of code, I..."** — señala disciplina y pensamiento de primer principio
- **"I quantified the risk as..."** — señala que piensas en términos de impacto, no solo de síntomas
- **"I documented the decision as an ADR so future architects would understand..."** — señala pensamiento sistémico y cuidado por la deuda de conocimiento
- **"The constraint I encoded as a linting rule was..."** — señala que conviertes intención en mecanismo
- **"I separated the technical risk assessment — which was my domain — from the product decision — which was theirs."** — señala madurez en las intersecciones de ingeniería y producto
- **"I estimated that continuing on the wrong path would cost X weeks..."** — señala que piensas en costo de oportunidad, no solo en costo de implementación
- **"The most important outcome was qualitative..."** — señala que entiendes que el ROI de arquitectura no siempre es cuantificable

---

### Qué NO decir en entrevistas Staff/Principal

- **"I just implemented what the product team asked for."** Para nivel Staff, se espera que hayas tenido influencia en la decisión, no solo ejecución.
- **"The team decided to..."** sin "and my contribution to that decision was..." Para Staff, el impacto individual en decisiones colectivas importa.
- **"We didn't have time for tests/documentation/ADRs."** Para Staff, la respuesta es "we prioritized X over Y because Z, and here's what we paid for that trade-off." El reconocimiento de la deuda es seniority. La ausencia de reconocimiento es una señal de alerta.
- **"I can't share specifics due to NDA."** Si toda la historia está bajo NDA, el entrevistador no puede evaluar el impacto. Prepara una versión anonymizada pero concreta: cambiar nombres de empresas y tecnologías está bien, remover números y contexto destruye la historia.
- **Usar "we" cuando el impacto fue tuyo.** En STAR para Staff, "I" cuando describes tu contribución específica, "we" cuando describes el outcome del equipo.

---

### Pregunta de cierre para el entrevistador

Al final de la entrevista, cuando te pregunten "¿tienes preguntas?", esta pregunta diferencia un candidato Staff de uno senior:

> "Based on our conversation today — and the architectural problems I described — what's the most significant system design challenge this team is facing in the next 12 months where you'd want a Principal/Staff Engineer making the key trade-off calls?"

Esta pregunta hace tres cosas: (1) invita al entrevistador a ser concreto sobre el problema que están tratando de resolver, (2) señala que ya piensas en términos de impacto a 12 meses, no en términos de "what will I be doing day to day," y (3) te da información real para decidir si el rol es el correcto para ti.

---

*Documento vive en `docs/interview/star-method.md` y en `~/obsidian/architect-brain/40-Career/STAR-Stories/`. Actualizar después de cada entrevista con preguntas reales y respuestas que funcionaron o no funcionaron.*
