# Catalog Platform Roadmap

Status: `TODO`

## Purpose

Build a digital catalog and lightweight storefront platform for businesses that want to publish products, share a catalog link, and convert buyers through WhatsApp. The product should feel like a simple Shopify-style storefront optimized for catalog browsing and direct messaging.

## Status Rules

- `TODO`: defined and ready to pick up.
- `WIP`: actively being implemented in a branch or PR.
- `DONE`: merged and verified.
- `BLOCKED`: waiting on access, decision, secret, or external dependency.

## Core Users

- Business owner: configures store profile, products, categories, WhatsApp number, and availability.
- Buyer: browses catalog, filters products, opens product detail, and starts WhatsApp conversation.
- Platform admin: manages stores, plans, feature flags, and support/audit views.

## MVP Scope

- Store profile with slug, logo, business name, contact info, address, and WhatsApp CTA.
- Product catalog with categories, images, prices, variants/options, availability, and featured products.
- Public storefront pages optimized for mobile sharing.
- WhatsApp deep links with product context and prefilled message.
- Owner admin panel for products, categories, store settings, and preview.
- Platform admin panel for tenants/stores, roles, billing readiness, and audit.
- Basic analytics events: product views, WhatsApp clicks, category views.

## Non-Goals For First MVP

- No full checkout or card payments.
- No inventory reservations.
- No shipping rates or tax automation.
- No marketplace aggregation across unrelated stores unless explicitly enabled later.

## Task Backlog

- [ ] `TODO` Audit current repo structure and identify reusable versus legacy code.
- [ ] `TODO` Define domain model: store, product, category, media, WhatsApp lead, owner user, platform user.
- [ ] `TODO` Define public storefront routes and SEO metadata requirements.
- [ ] `TODO` Define owner admin routes and role permissions.
- [ ] `TODO` Define platform admin routes and support workflows.
- [ ] `TODO` Define persistence strategy for stores, products, categories, leads, and audit.
- [ ] `TODO` Define image upload/storage strategy and validation limits.
- [ ] `TODO` Define WhatsApp message templates and tracking events.
- [ ] `TODO` Add Playwright MVP flows: owner creates product, buyer opens product, buyer clicks WhatsApp.
- [ ] `TODO` Add go/no-go checklist for real merchant onboarding.

## Acceptance Criteria

- A merchant can create a store, add products, publish a catalog link, and receive WhatsApp leads.
- A buyer can browse on mobile without login and contact the merchant in two taps or fewer from product detail.
- Admin actions are protected by auth, roles, and tenant isolation.
- MVP launch requires passing frontend/backend tests and Playwright buyer/admin flows.
