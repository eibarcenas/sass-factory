# UI Wireframes

All wireframes are mobile-first (375px base). Final implementation uses Tailwind CSS 4.

---

## Storefront — End Customer

Public page. No login required.

```
┌─────────────────────────────────────────┐  ← 375px mobile
│  [Logo/Business Name]         [WA icon] │  ← sticky nav
├─────────────────────────────────────────┤
│                                         │
│         GORRAS BEBE & KIDS              │  ← hero
│    The best baby caps in MX             │
│                                         │
│   [  Contact on WhatsApp  ]             │  ← main CTA
│                                         │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░           │  ← hero image / animated blob
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░           │
│                                         │
├─────────────────────────────────────────┤
│  Our Products                           │  ← catalog
│                                         │
│  ┌─────────┐  ┌─────────┐             │
│  │  ░░░░░  │  │  ░░░░░  │             │  ← product cards
│  │  ░░░░░  │  │  ░░░░░  │             │
│  │         │  │         │             │
│  │ Basic   │  │ Premium │             │
│  │ Cap     │  │ Cap     │             │
│  │ $120    │  │ $180    │  ← visible  │  ← price optional
│  │         │  │         │    if admin │
│  │[WA CTA] │  │[WA CTA] │    enables │
│  └─────────┘  └─────────┘             │
│                                         │
│  ┌─────────┐  ┌─────────┐             │
│  │  ░░░░░  │  │  ░░░░░  │             │
│  │  ...    │  │  ...    │             │
│  └─────────┘  └─────────┘             │
│                                         │
├─────────────────────────────────────────┤
│  How to buy?                            │  ← how-to-buy
│                                         │
│  ①─────────②─────────③               │  ← horizontal scroll
│  Choose    Write us   Receive at       │
│  your cap  on WA      your door        │
│                                         │
├─────────────────────────────────────────┤
│  ★ 4.9   │  +500 orders  │  5 years   │  ← trust strip
├─────────────────────────────────────────┤
│  What our customers say                 │  ← testimonials (if feature active)
│                                         │
│  "Excellent quality and fast delivery"  │
│   — Maria G.                            │
│                                         │
├─────────────────────────────────────────┤
│  Powered by [Platform name]             │  ← viral loop footer
└─────────────────────────────────────────┘

[ WhatsApp floating button ]  ← sticky bottom-right, always visible
```

**Product Card — detail**
```
┌─────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░  │  ← image (next/image, WebP, lazy)
│  ░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░  │
├─────────────────────────┤
│ Basic Cap               │  ← name
│ Perfect for babies      │  ← description (max 2 lines)
│ 0-12 months             │
│                         │
│ $120 MXN                │  ← price (hidden if showPrices: false)
│                         │
│ [ Contact on WhatsApp ] │  ← opens wa.me with custom message
└─────────────────────────┘
```

---

## Dashboard — Business Owner Panel

Login via OTP (phone). Owner sees only THEIR business.

### Login

```
┌─────────────────────────────────────────┐
│                                         │
│         [Platform logo]                 │
│                                         │
│  Enter your WhatsApp number             │
│  ┌───────────────────────────────────┐  │
│  │ +52 │ 55 1234 5678               │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [ Send SMS code ]                      │
│                                         │
│  ─────────── or ───────────             │
│                                         │
│  [ Continue with Google ]               │  ← Sprint 2+
│                                         │
└─────────────────────────────────────────┘
```

### Owner Home

```
┌──────────────────────────────────────────────────────┐
│  [Logo]              Gorras Bebe & Kids    [Sign out] │  ← header
├──────────────────────────────────────────────────────┤
│                                                      │
│  Your landing is active                              │
│  platform.com/gorras-bebe-kids                       │
│  [ Copy link ]  [ View landing ]  [ Share ]          │
│                                                      │
├──────────────────┬───────────────────────────────────┤
│  This week       │  This month     │  All time        │
│  ┌────────────┐  │ ┌────────────┐  │ ┌────────────┐  │
│  │     47     │  │ │    183     │  │ │    1,204   │  │
│  │   clicks   │  │ │   clicks   │  │ │   clicks   │  │
│  │  WhatsApp  │  │ │  WhatsApp  │  │ │  WhatsApp  │  │
│  └────────────┘  │ └────────────┘  │ └────────────┘  │
├──────────────────┴───────────────────────────────────┤
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │ Products │ │Appearance│ │ Settings │ │ Stats  │  │  ← tabs
│  └──────────┘ └──────────┘ └──────────┘ └────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Tab: Products

```
┌──────────────────────────────────────────────────────┐
│  Products                           [ + Add item ]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────┬─────────────────┬────────┬────────┬─────┐ │
│  │ Img  │ Name            │ Price  │ Status │ ... │ │  ← table
│  ├──────┼─────────────────┼────────┼────────┼─────┤ │
│  │ ░░░  │ Basic Cap       │ $120   │ Active │ ··· │ │
│  │ ░░░  │ Premium Cap     │ $180   │ Active │ ··· │ │
│  │ ░░░  │ Christmas Cap   │ $220   │ Hidden │ ··· │ │
│  └──────┴─────────────────┴────────┴────────┴─────┘ │
│                                                      │
│  Drag to reorder                                     │  ← drag handle
└──────────────────────────────────────────────────────┘

Add/Edit product modal:
┌──────────────────────────────────────┐
│  New product                     [✕] │
├──────────────────────────────────────┤
│  Image                               │
│  ┌──────────────────────────────┐   │
│  │   [+] Upload image           │   │  ← drag & drop or click
│  │   JPG, PNG, WebP — max 5MB   │   │
│  └──────────────────────────────┘   │
│                                      │
│  Product name *                      │
│  ┌──────────────────────────────┐   │
│  │ Basic Cap                    │   │
│  └──────────────────────────────┘   │
│                                      │
│  Description                         │
│  ┌──────────────────────────────┐   │
│  │ Perfect for babies 0-12...   │   │
│  └──────────────────────────────┘   │
│                                      │
│  Price (optional)                    │
│  ┌──────────────────────────────┐   │
│  │ $120                         │   │
│  └──────────────────────────────┘   │
│                                      │
│  Custom WhatsApp message             │
│  ┌──────────────────────────────┐   │
│  │ Hi, I'm interested in the   │   │
│  │ Basic Cap...                 │   │
│  └──────────────────────────────┘   │
│  (empty = uses business default)     │
│                                      │
│  [ Cancel ]        [ Save ]          │
└──────────────────────────────────────┘
```

### Tab: Appearance

```
┌──────────────────────────────────────────────────────┐
│  Appearance                                          │
├───────────────────────┬──────────────────────────────┤
│  Template             │                              │
│                       │     Live preview             │
│  ○ Minimal            │  ┌────────────────────────┐ │
│  ● Bold         ←sel  │  │  ░ GORRAS BEBE & KIDS  │ │
│  ○ Elegant            │  │  ░░░░░░░░░░░░░░░░░░░░  │ │
│  ○ Festive            │  │  [Contact WhatsApp]    │ │
│  ○ Kids               │  │  ─────────────────     │ │
│  ○ Nature             │  │  □ Cap    □ Cap         │ │
│                       │  └────────────────────────┘ │
│  Colors               │                              │
│  Primary   [■■■■■■]   │  (real-time iframe)          │
│  Accent    [■■■■■■]   │                              │
│  Background[■■■■■■]   │                              │
│                       │                              │
│  Font                 │                              │
│  [Inter         ▼]    │                              │
│                       │                              │
│  Active sections      │                              │
│  [✓] Hero             │                              │
│  [✓] Catalog          │                              │
│  [✓] How to buy       │                              │
│  [✓] Stats            │                              │
│  [ ] Testimonials     │                              │
│  [ ] Countdown        │                              │
│                       │                              │
│  [ Save changes ]     │                              │
└───────────────────────┴──────────────────────────────┘
```

### Tab: Stats (simplified owner view)

```
┌──────────────────────────────────────────────────────┐
│  Stats — last 30 days                                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Clicks per day                                      │
│  30 ┤                          ╭─╮                  │
│  20 ┤               ╭──╮  ╭──╯ │ ╰──                │  ← LineChart
│  10 ┤    ╭──╮  ╭──╯    ╰──╯                         │
│   0 └────────────────────────────────── days         │
│      1    7    14   21   28   30                     │
│                                                      │
│  Top products by clicks                              │
│  Premium Cap  ████████████████  89 clicks           │
│  Basic Cap    ████████████       61 clicks           │  ← HorizBar
│  Holiday Cap  ████               33 clicks           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Dashboard — Global Admin Panel

Login via email/password. Admin sees all businesses.

### Business List

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Admin Logo]                                  admin@plat.com [↓]   │
├──────┬───────────────────────────────────────────────────────────────┤
│      │  Businesses    Reports (3)    Platform    Analytics           │  ← nav
│  🏠  │                                                               │
│  📋  ├───────────────────────────────────────────────────────────────┤
│  ⚠️  │  Businesses                            [ + New business ]    │
│  📊  │                                                               │
│  ⚙️  │  Search... [__________________]  Status[▼]  Plan[▼]  Type[▼] │
│      │                                                               │
│      │  ┌──────┬──────────────────┬────────┬────────┬──────┬──────┐ │
│      │  │      │ Name             │ Plan   │ Status │Clicks│  ... │ │
│      │  ├──────┼──────────────────┼────────┼────────┼──────┼──────┤ │
│      │  │ ░░░  │ Gorras Bebe&Kids │ Pro    │ ACTIVE │ 1204 │  ··· │ │
│      │  │ ░░░  │ Barberia Cortes  │ Starter│ ACTIVE │  347 │  ··· │ │
│      │  │ ░░░  │ Floreria Bloom   │ Growth │ ACTIVE │ 2891 │  ··· │ │
│      │  │ ░░░  │ Tacos El Guero   │ Starter│ DRAFT  │    0 │  ··· │ │
│      │  │ ░░░  │ Dulceria Azucar  │ Pro    │ SUSPEN │   89 │  ··· │ │
│      │  └──────┴──────────────────┴────────┴────────┴──────┴──────┘ │
│      │                                                               │
│      │  Showing 1-20 of 47          [ < Previous ]  [ Next > ]      │
└──────┴───────────────────────────────────────────────────────────────┘
```

### Business Detail (analytics + billing)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [←] Gorras Bebe & Kids          Status: ACTIVE    Plan: PRO        │
│       platform.com/gorras-bebe-kids                                  │
│       [ View landing ] [ Edit ] [ Suspend ] [ Generate Invoice ]    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │    1,204     │ │     183      │ │     47       │ │   $19/mo   │ │
│  │ total clicks │ │ clicks/month │ │ clicks/week  │ │    plan    │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │
│                                                                      │
│  Clicks per day — last 30 days                                      │
│  40 ┤                                    ╭─╮                        │
│  30 ┤                       ╭──╮    ╭───╯ │ ╰──                     │
│  20 ┤         ╭──╮    ╭────╯    ╰───╯                               │
│  10 ┤  ╭──╮  ╯    ╰──╯                                              │
│   0 └────────────────────────────────────────── days                │
│                                                                      │
│  Top products                    Owner                              │
│  Premium Cap   ████████  89      Name:  Unassigned (admin-created) │
│  Basic Cap     ██████    61      Plan:  Pro — $19/month            │
│  Holiday Cap   ████      33      Since: 2026-03-15                 │
│                                   Last payment: 2026-05-01          │
└──────────────────────────────────────────────────────────────────────┘

Invoice modal:
┌──────────────────────────────────────────┐
│  Invoice — May 2026                  [✕] │
├──────────────────────────────────────────┤
│  Business:  Gorras Bebe & Kids           │
│  Period:    May 2026                     │
│  Plan:      Pro                          │
│                                          │
│  ────────────────────────────────────   │
│  Pro Subscription              $19.00    │
│  ────────────────────────────────────   │
│  Total                         $19.00 USD│
│                                          │
│  Value generated this month:             │
│  • 183 WhatsApp contacts                 │
│  • 3 most-clicked products               │
│                                          │
│  [ Print ]  [ Mark as paid ]             │
└──────────────────────────────────────────┘
```

### Global Analytics

```
┌──────────────────────────────────────────────────────────────────────┐
│  Global Analytics                                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │
│  │    47     │ │  $623/mo  │ │  38,291   │ │   91.5%   │           │
│  │ active    │ │    MRR    │ │ WA clicks │ │  active   │           │
│  │ businesses│ │ estimated │ │ this month│ │   rate    │           │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │
│                                                                      │
│  MRR by plan                     Businesses by type                 │
│         ╭───╮                    Clothing   ████████  34%           │
│  $623  │   │                    Barber     █████     22%           │
│        │   │  ╭──╮             Food       ████      18%           │
│        │   │  │  │  ╭──╮      Services   ███       14%           │
│        └───┘  └──┘  └──┘      Other      ██        12%           │
│        Pro  Starter Growth                                          │
│                                                                      │
│  Total clicks — last 90 days                                        │
│  1500┤                                              ╭──             │
│  1000┤                          ╭──────────────────╯               │
│   500┤          ╭───────────────╯                                   │
│     0└────────────────────────────────────────────── days           │
└──────────────────────────────────────────────────────────────────────┘
```

### Reports Queue (moderation)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Pending reports (3)                                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ ⚠️  Gorras Bebe & Kids                    2026-05-06 10:32  │    │
│  │  Reason: "Wrong WhatsApp number"                            │    │
│  │  Reported by: anonymous customer                            │    │
│  │                                                             │    │
│  │  [ View landing ]  [ Suspend business ]  [ Dismiss ]       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ ⚠️  Tacos El Guero                        2026-05-05 18:11  │    │
│  │  Reason: "Inappropriate product content"                    │    │
│  │  [ View landing ]  [ Suspend business ]  [ Dismiss ]       │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```
