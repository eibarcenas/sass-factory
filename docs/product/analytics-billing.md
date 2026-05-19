# Analytics & Billing Panel

## Business Detail View

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dashboard  /  Businesses  /  Gorras Bebe & Kids                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [← Back]   Gorras Bebe & Kids          Status: ACTIVE  Plan: PRO  │
│                                         [Generate Invoice]          │
├──────────────────┬──────────────────────────────────────────────────┤
│  OVERVIEW        │  ANALYTICS                                       │
│                  │                                                  │
│  Slug: /gorras   │  Period: [Last 30d ▼]                            │
│  WA: +521...     │                                                  │
│  Items: 12       │   WhatsApp Clicks                                │
│  Plan: Pro       │   ┌─────────────────────────────────────────┐   │
│  Joined: Jan '26 │   │  347                                    │   │
│                  │   │  ████                                   │   │
│  [Edit]          │   │  ████ ███                               │   │
│  [Suspend]       │   │  ████ ███ ██ █████ ████                 │   │
│  [View Landing]  │   └─────────────────────────────────────────┘   │
│                  │   Mon Tue Wed Thu Fri Sat Sun                    │
│                  │                                                  │
│                  │   Top Products by Clicks                         │
│                  │   ┌────────────────────────────────────────┐    │
│                  │   │ Premium Cap          ████████  128     │    │
│                  │   │ Basic Cap            ██████     89      │    │
│                  │   │ Holiday Cap          ████        64      │    │
│                  │   └────────────────────────────────────────┘    │
└──────────────────┴──────────────────────────────────────────────────┘
```

## Invoice Generation

```
Trigger: admin clicks [Generate Invoice] on any business

Invoice data assembled from:
  business.name, business.slug
  business.plan → maps to price ($9 / $19 / $39)
  billingPeriod → current calendar month
  clicks count  → queried from clicks collection for period

Invoice modal:
┌──────────────────────────────────────────────────────┐
│                    INVOICE                           │
│                                                      │
│  To: Gorras Bebe & Kids                              │
│  Period: June 1 – June 30, 2026                      │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ Pro Plan (monthly)              $19.00       │   │
│  └──────────────────────────────────────────────┘   │
│                                    ─────────         │
│  TOTAL DUE                         $19.00 USD        │
│                                                      │
│  WhatsApp contacts this period: 347                  │
│  (included as value summary, not a billing line)     │
│                                                      │
│  [Print]   [Download PDF]   [Mark as Paid]           │
└──────────────────────────────────────────────────────┘

Status tracking:
  invoices/{businessId}/{year-month}
  ├── amount: number
  ├── plan: string
  ├── clickCount: number
  └── status: 'pending' | 'paid' | 'overdue'
```

## Analytics Data Flow

```
End customer clicks WhatsApp button on storefront
         │
         ▼
  track-whatsapp-click feature (client-side)
         │
         ├──────────────────────────────────────────┐
         ▼                                          ▼
  gtag('event', 'whatsapp_click', {...})    POST /api/clicks
  → GA4 (traffic insights, funnels)         {businessId, itemId}
                                                    │
                                                    ▼
                                           Firestore: clicks/{id}
                                                    │
                                                    ▼
                                           Admin dashboard:
                                           - clicks per day → line chart
                                           - clicks per item → bar chart
                                           - total period   → invoice

GA4 also auto-tracks (zero code):
  - page_view per slug visit
  - session_start, scroll depth
  - referral source (where traffic came from)
  - geography, device, browser
```

## What Each System Owns

```
GA4 (operator reads in GA4 / Firebase console):
  └── Platform-wide traffic intelligence
      Where do visitors come from? Which slugs get most views?
      Which city has most businesses? Conversion funnel analysis.

Firestore clicks collection (admin reads in dashboard):
  └── Per-business billing data
      How many WA clicks did THIS business get THIS month?
      Which product drove most clicks?
      → Used to generate invoice proof-of-value section.
```

## Charts Implementation

```
Library: Recharts (React-native, no D3 complexity)

widgets/analytics-charts/
├── ClicksTimelineChart    LineChart   — clicks per day (from Firestore)
├── TopProductsChart       HorizBar    — clicks by item (from Firestore)
├── PlanBreakdownChart     PieChart    — Starter/Pro/Growth split
└── MetricCard             KPI number  — total clicks, MRR, active count

Note: global traffic charts (all businesses, sessions) → embed GA4
      Data Studio / Looker Studio report inside dashboard iframe.
      No need to replicate what GA4 already does for free.
```

## Global Analytics View

```
/admin/analytics

┌─────────────────────────────────────────────────────────────────────┐
│  Platform Analytics         Period: [This Month ▼]                  │
├───────────┬───────────┬───────────┬─────────────────────────────────┤
│ 52        │ 8,341     │ $988/mo   │ 94%                             │
│ Businesses│ WA Clicks │ MRR       │ Active rate                     │
├───────────┴───────────┴───────────┴─────────────────────────────────┤
│  Total Clicks Over Time                                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                              ╭───╮           │  │
│  │                                     ╭───╮   │   │           │  │
│  │                            ╭───╮   │   │   │   │           │  │
│  │  ╭───╮  ╭───╮  ╭───╮      │   │   │   │   │   │           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│     Jan    Feb    Mar    Apr    May    Jun    Jul                   │
├─────────────────────────────────────────────────────────────────────┤
│  Businesses by Plan                                                 │
│  Starter ████████████████  28 (54%)                                 │
│  Pro     ██████████        18 (35%)                                 │
│  Growth  ████               6 (11%)                                 │
└─────────────────────────────────────────────────────────────────────┘
```
