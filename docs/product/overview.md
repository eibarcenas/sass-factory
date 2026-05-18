# Product Overview

## What It Is

A multi-tenant SaaS platform where small businesses get a premium, themed landing page in minutes.
Each business configures their catalog, selects a visual template, and converts visitors via WhatsApp.
The platform operator (admin) manages all businesses from a central dashboard.

## Actors

```
┌─────────────────────────────────────────────────────────────────┐
│                        ACTORS                                   │
├────────────────┬────────────────────┬───────────────────────────┤
│  Super Admin   │  Business Owner    │  End Customer             │
│ (platform ops) │  (tenant)          │  (visitor)                │
├────────────────┼────────────────────┼───────────────────────────┤
│ Creates biz    │ Manages products   │ Views landing page        │
│ Sets templates │ Picks theme        │ Browses catalog           │
│ Moderates      │ Configures WA      │ Clicks WhatsApp CTA       │
│ Views global   │ Views analytics    │ Contacts business         │
│ analytics      │ Shares their link  │ directly                  │
└────────────────┴────────────────────┴───────────────────────────┘
```

---

## Business Model

### Why Clicks-as-Billing Is Fragile

```
❌ FRAGILE: Pay-per-WhatsApp-click
   ├── Unpredictable cost for businesses → resistance, churn
   ├── Easy to game (bots, self-clicks)
   ├── Hard to explain on an invoice
   ├── Spikes in clicks = punishment for business success (wrong incentive)
   └── No industry precedent → long sales cycle
```

### Recommended Model: Tiered Subscription + Clicks as Value Proof

Clicks are tracked NOT as billing units, but as **ROI evidence** to justify the subscription.
The invoice is always a fixed, predictable monthly amount. The analytics dashboard
shows businesses "you got 347 WhatsApp contacts this month — your subscription is paying off."

```
✅ SOLID: Fixed monthly subscription
   ├── Predictable for both parties
   ├── Industry standard (Shopify, Linktree, Squarespace)
   ├── Easy to invoice (one line: Plan X = $Y)
   ├── Clicks become a retention tool, not a billing meter
   └── Low churn: businesses see ROI in the dashboard
```

### Subscription Tiers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUBSCRIPTION TIERS                              │
├──────────────────┬─────────────────────┬────────────────────────────────┤
│  STARTER         │  PRO                │  GROWTH                        │
│  $9/month        │  $19/month          │  $39/month                     │
├──────────────────┼─────────────────────┼────────────────────────────────┤
│ 1 landing page   │ 1 landing page      │ Up to 5 landing pages          │
│ Up to 15 items   │ Unlimited items     │ Unlimited items                │
│ 3 templates      │ All templates       │ All templates                  │
│ Platform badge   │ No platform badge   │ White-label badge              │
│ Basic analytics  │ Full analytics      │ Full analytics + export        │
│ (30-day clicks)  │ (90-day + charts)   │ (all-time + per-product)       │
│ No price toggle  │ Price toggle        │ Price toggle                   │
│                  │ Custom slug         │ Custom slug + custom domain    │
│                  │                     │ Priority support               │
└──────────────────┴─────────────────────┴────────────────────────────────┘
```

### Revenue Projections

```
  100 clients × $9  avg =  $900/month   (all Starter)
  100 clients × $19 avg = $1,900/month  (all Pro)
  100 clients × $28 avg = $2,800/month  (realistic mix)

  Target month 12: 200 clients, $28 avg = $5,600 MRR
  Target month 24: 500 clients, $32 avg = $16,000 MRR
```

### Viral Loop

```
Visitor sees landing page
         │
         ▼
  "Powered by [Platform]" in footer  ← only on Starter (badge paid to remove)
         │
         ▼
  Visitor is also a business owner → clicks link
         │
         ▼
  Admin creates their landing → new paying client
         │
         └──────────────────► loop repeats
```

### Unit Economics

```
CAC:   ~$0 (viral footer + word of mouth, no paid ads)
Churn: target < 5%/month
       driver: businesses see WA contacts in dashboard → they stay
LTV:   $19/month × 24 months avg = $456 per Pro client
Payback period: immediate (no CAC)
```

---

## Template System

Templates are named visual presets. Each defines a default theme + enabled features.
A business selects one template; then can override individual theme values.

```
Template Registry (stored in platform-config/templates):

┌──────────────┬─────────────────────────────────────────────────┐
│ template ID  │ description + default theme                     │
├──────────────┼─────────────────────────────────────────────────┤
│ minimal      │ Clean white, single accent color, sans-serif    │
│ bold         │ Dark bg, high contrast, impactful type          │
│ elegant      │ Cream + gold, serif typography, refined layout  │
│ festive      │ Vibrant gradients, blobs, celebration vibe      │
│ kids         │ Rounded, colorful, playful                      │
│ nature       │ Greens + earth tones, organic shapes            │
└──────────────┴─────────────────────────────────────────────────┘

Each template ships with:
  - default theme object (colors, font)
  - default features array
  - hero variant (emoji-centered | image | gradient text)
```

### Dynamic Platform Name

```
Platform name stored in Firestore:
  platform-config/{env}/name  →  "Lokali" | "Pidemelo" | ...

Read at:
  - storefront footer ("Powered by {name}")
  - dashboard header logo
  - email templates

Updated by super admin via dashboard settings panel.
Never hardcoded in source code.
```

### Feature Flag — Price Visibility

```
settings.showPrices (per business, set by admin)
       │
       ├── false (default) → ItemCard renders with no price, only WhatsApp CTA
       └── true            → ItemCard renders price chip + WhatsApp CTA

Controlled from: features/toggle-setting/
Written to:      businesses/{id}/settings.showPrices
Read in:         storefront entities/item/ui/ItemCard
```
