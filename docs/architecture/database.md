# Database Architecture

> Decision: **Firestore Native mode** — SDK pure.

## Firestore Schema

```
businesses/{businessId}
├── id:               string
├── name:             string              "Gorras Bebe & Kids"
├── slug:             string (unique)     "gorras-bebe-kids"
├── type:             BusinessType        FOOD | BARBER | CLOTHING | KIDS | SERVICES | CRAFTS
├── ownerId:          string              Firebase Auth UID
├── status:           BusinessStatus      DRAFT | ACTIVE | PENDING_REVIEW | SUSPENDED | DELETED
├── plan:             PlanTier            STARTER | PRO | GROWTH
├── whatsappNumber:   string              "+521XXXXXXXXXX"
├── whatsappMessage:  string              "Hi, I'm interested in your catalog..."
├── template:         string              "minimal" | "bold" | "elegant" | "festive" | ...
├── theme: {
│     primary:        string              hex color
│     secondary:      string              hex color
│     accent:         string              hex color
│     background:     string              hex color
│     font:           string              Google Font name
│   }
├── features:         string[]            ["hero","catalog","how-to-buy","trust","testimonials"]
├── settings: {
│     showPrices:     boolean             toggled by admin — default false
│     showBadge:      boolean             "Powered by" footer — default true on free
│   }
├── metadata: {
│     title:          string              SEO title
│     description:    string              SEO description
│     ogImage:        string?             URL to OG image
│   }
├── createdAt:        Timestamp
├── updatedAt:        Timestamp
│
└── items/{itemId}
    ├── id:           string
    ├── businessId:   string              denormalized for queries
    ├── name:         string
    ├── description:  string?
    ├── price:        number?             null if not set
    ├── imageUrl:     string?             Cloud Storage URL
    ├── category:     string?             business-defined tag
    ├── whatsappMessage: string?          item-level override
    ├── active:       boolean
    ├── order:        number              display order
    └── createdAt:    Timestamp

users/{userId}
├── id:               string             Firebase Auth UID
├── phone:            string             "+521XXXXXXXXXX"
├── businessId:       string?            null if admin
└── createdAt:        Timestamp

Note: role is NOT stored in users/ — it lives in Firebase Custom Claims only.

clicks/{clickId}
├── businessId:       string
├── itemId:           string?            null = general page click
├── type:             ClickType          "whatsapp" | "page_view" | "share"
└── createdAt:        Timestamp

clicks_daily/{businessId_date}           ← pre-aggregation (no GROUP BY in Firestore)
├── businessId:       string
├── date:             string             "2026-01-15"
└── count:            number             total clicks for that day

slugs/{slug}                             ← O(1) uniqueness check collection
├── businessId:       string
└── createdAt:        Timestamp

reports/{reportId}
├── businessId:       string
├── reason:           string
├── status:           ReportStatus       "PENDING" | "REVIEWED" | "DISMISSED"
└── createdAt:        Timestamp

invoices/{businessId}/{year-month}
├── amount:           number
├── plan:             string
├── clickCount:       number
└── status:           'PENDING' | 'PAID' | 'OVERDUE'

audit_log/{logId}
├── event:            string             "business.deleted" | "business.suspended" | ...
├── businessId:       string?
├── actorId:          string?            admin UID who performed action
└── createdAt:        Timestamp
```

## Multi-Tenant Isolation

```
Every query is scoped by businessId:

  // correct
  db.collection('businesses').doc(businessId).collection('items')

  // NEVER query without tenant filter
  db.collection('items')
```

Firestore security rules enforce this at the database level — no business can read another's data.

## Required Composite Indexes

Declare all known compound query indexes in `infrastructure/firestore/firestore.indexes.json`.
Missing indexes cause runtime errors in production.

```
Query                                          Index required
─────────────────────────────────────────────────────────────────────
businesses WHERE status ORDER BY createdAt     (status ASC, createdAt DESC)
businesses WHERE status AND plan ORDER BY date (status ASC, plan ASC, createdAt DESC)
clicks_daily WHERE businessId ORDER BY date    (businessId ASC, date ASC)
clicks WHERE businessId ORDER BY createdAt     (businessId ASC, createdAt DESC)
```

## Slug Race Condition — Atomic Transaction Required

```typescript
// WRONG — race condition: two concurrent requests get same slug
const exists = await db.collection('businesses').where('slug', '==', slug).get()
if (exists.empty) await db.collection('businesses').add({ slug, ... })

// CORRECT — atomic check-and-create via dedicated slugs/ collection
await db.runTransaction(async (tx) => {
  const existing = await tx.get(db.collection('slugs').doc(slug))
  if (existing.exists) throw new Error('SLUG_TAKEN')
  tx.set(db.collection('slugs').doc(slug), { businessId })
  tx.set(db.collection('businesses').doc(businessId), { slug, ... })
})
// slugs/{slug} enables O(1) uniqueness checks without scanning businesses/
```

## Why Firestore Native Mode

```
Firestore Datastore mode  →  legacy API, no vector support
Firestore Native mode     →  vector() field type + findNearest() ✅
                              real-time listeners (onSnapshot)
                              Firebase Auth integration (Custom Claims in rules)
                              subcollections
                              MongoDB Compatibility layer (Enterprise, optional)
```

## MongoDB Compatibility Layer (Enterprise — optional)

Released 2025. Allows MongoDB drivers, mongosh, Mongoose, and MongoDB Compass to connect
directly to Firestore — no separate MongoDB Atlas cluster needed.

```
What this unlocks on top of Firestore Native:
  $group, $sum, $facet, $lookup   →  clicks grouped by day in one query
  $text                           →  basic full-text search on products
  MongoDB Compass                 →  GUI data browser against Firestore
  mongoose models                 →  reuse MongoDB ORMs if preferred
  mongosh                         →  ad-hoc analytics queries in shell

What stays Firestore-SDK-only:
  onSnapshot() real-time listeners
  Firestore security rules
  Firebase Auth integration
  findNearest() vector search
```

**Decision**: Use Firestore SDK pure (no MongoDB compat) for MVP.
One stack, one style. MongoDB compat is an optional Enterprise upgrade path.
See `docs/database-decision.md` for full analysis.

## Vector Search — Future Use Cases

Firestore Native `findNearest()` enables semantic queries without a separate vector DB:

```typescript
// 1. Template recommendation
//    "I sell handmade candles" → embed → find nearest template embedding
const embedding = await embedText(businessDescription)  // Claude or Vertex AI
const nearest = await db.collection('templates')
  .findNearest('embedding', embedding, { limit: 3, distanceMeasure: 'COSINE' })
  .get()

// 2. Similar businesses discovery (admin)
const nearest = await db.collection('businesses')
  .findNearest('embedding', targetEmbedding, { limit: 5 })
  .get()

// 3. Product semantic search on storefront
const nearest = await db.collection('businesses').doc(id).collection('items')
  .findNearest('embedding', queryEmbedding, { limit: 10 })
  .get()
```

Vector fields added to existing documents (null until worker deployed):
```
businesses/{businessId}  →  embedding: vector(768)
templates/{templateId}   →  embedding: vector(768)
items/{itemId}           →  embedding: vector(768)
```

**Sprint placement**: Sprint 6+ (not MVP). Schema includes field as null to avoid migration.

## Point-in-Time Recovery

Enable from day 1. Configured via Terraform module `modules/gcp/firestore`.

```
PITR:   7-day recovery window
Backup: daily export to gs://{project}-firestore-backups/ (30-day retention)
Cost:   ~$0.026/GB/month

Restore:
  gcloud firestore import gs://{project}-firestore-backups/{date}/
```
