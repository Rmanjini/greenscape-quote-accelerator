# Greenscape Pro - AI Agent Strategy

**Prepared by:** Manjini - **For:** isthispossible.ai / Greenscape Pro (Marcus Tate)

Greenscape Pro is not lead-constrained - Marcus said it twice on the call ("I cannot keep up with the leads I have"). Every dollar of leverage is therefore **downstream of the lead**: converting the demand they already pay $25-30K/month to generate. The ranking below follows the cash, not the founder's gut.

Baseline math I reuse: **~150 signed projects/yr, $28K avg project, ~30% funnel close, ~$4.2M revenue.**

---

## The 5 Agents (priority order)

### 1. Quote Accelerator - *site-walk notes -> review-ready proposal, same day* **(P0 - built)**
- Marcus pastes site-walk notes; AI extracts structured scope (items, quantities, units, confidence) and matches each to the priced catalog.
- **The model never owns the price.** It maps scope -> SKU; the app computes every dollar deterministically from the Postgres catalog. No confident match -> `needs_review`, price `null`.
- Human-in-the-loop: Marcus reviews flags and taps **Approve & Send** (from Telegram, on his phone).
- **Replaces/unblocks:** the 6-9 day manual proposal Marcus builds himself - the one task he named to "fire himself from" and the funnel's #1 bottleneck.
- **ROI:** They lose **35-40% of qualified opportunities to faster competitors** at this stage. Compressing 6-9 days -> same-day recovers even a third of that. At 150 projects x $28K, clawing back ~20 deals/yr ~ **$560K+ recovered revenue**, plus ~5-8 hrs/week of Marcus's time. Highest-leverage single intervention in the business.
- **Why #1:** biggest hole in the bucket, and it compounds - a faster quote lifts *every* downstream stage.

### 2. Closed-Lost Reactivation Agent - *personal re-engagement of 1,400 dead leads*
- Pulls context from GHL notes (what they wanted, when), drafts a Marcus-voiced "still thinking about your backyard?" message, sends via GHL SMS/email.
- Batches with human approval; routes warm replies back to the quote pipeline.
- **Replaces/unblocks:** Brittany's sporadic, un-systematic re-engagement blasts.
- **ROI:** 1,400 leads at a **2% re-close = 28 deals ~ $784K** latent revenue. Low build cost, low risk, fully independent of everything else.
- **Why here:** enormous $ for a small build - but it's a one-time-ish pile, whereas #1 fixes a recurring daily leak. It also *feeds* #1, so #1 must exist first.

### 3. Post-Sign Follow-up Agent - *automated HOA / permit / deposit chasing*
- Stage-aware sequences that nudge customers/boards on HOA submissions, permit revisions, and slow deposits; escalates to Jenna only on exceptions.
- **Replaces/unblocks:** Jenna's fully manual chasing of 8-12 stalled projects.
- **ROI:** 8-12 projects in limbo x $28K = **$224K-$336K of revenue delayed at any moment**; faster deposits improve cash, and freeing the calendar sooner improves crew utilization (idle crews are pure cost).

### 4. Build-Update Agent - *proactive progress updates during the job*
- Triggered by CompanyCam photo uploads / Jobber milestones; sends a Marcus-branded update so customers aren't in the dark.
- **Replaces/unblocks:** the daily "what's happening?" anxiety calls to Jenna, and Marcus's 30%-completion-rate Loom habit.
- **ROI:** kills a *daily* interruption stream and directly drives referrals - Marcus already gets them from the few updates he manages ("you're the only contractor who kept us informed"). Referrals are free CAC against a $25-30K/mo ad spend.

### 5. Small-Approvals Rulebook Agent - *encodes Marcus's framework for change orders / refunds / add-on pricing*
- Captures Marcus's decision rules once; answers Jenna's pricing/refund/add-on questions within guardrails, escalating only true exceptions.
- **Replaces/unblocks:** 5-10 Slack pings/day to Marcus - the third task he'd "fire himself from." Jenna: "I just need a rule book."
- **ROI:** ~1 hr/day of Marcus's attention back; also stops crews eating un-priced add-ons.
- **Why #5:** real but smaller, and it's an **interdependency play** - it reuses the exact catalog + pricing-rules engine built for #1, so it gets cheaper the moment the Quote Accelerator ships. Do it after, not instead.

---

## Two required answers

**Why is #1 my #1 - vs. the founder's stated #1?**
They happen to coincide (Marcus's stated #1 is also quoting) - but I'd hold this ranking with the mic off, purely on the math: it's the only item that recovers a *recurring* 35-40% loss on demand he's already paying for. Where I **do** push back is the rest of his order. His stated #4 (marketing/content) is a **non-problem** - he admitted he's quote-constrained, not lead-constrained, so a content agent would optimize a stage that isn't the bottleneck. And the closed-lost pile, which he treats as Brittany's occasional side-blast, is actually the **#2 highest-ROI play in the company** ($784K latent). His instincts are right at the top and miscalibrated below it.

**One agent I considered but left out of the top 5:**
The **Crew Coaching Agent** (Marcus's *stated* #3, the one he "personally cares about"). It's real money - 4 crews x ~1 miss/week x ~$500 ~ **$104K/yr** - but it's an order of magnitude below the quote-cycle revenue, and it's the **hardest to actually land**: it depends on installers adopting a tool mid-job in the Phoenix heat, which is an adoption problem, not an AI problem. High effort, low odds, small prize. Cut.

*Assumptions: close/loss rates from onboarding are approximate (Marcus doesn't track precisely); ROI figures use the midpoints he gave. GHL is treated as the system of record for all outbound, per Jenna's hard requirement.*
