import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const appsDir = "apps";
const terraformDir = "infrastructure/iterraform";
const canonicalPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*-(api|fe|mfe|webhook)$/;
const topicPattern = /^topic-[a-z0-9]+(?:-[a-z0-9]+)*-v[0-9]+$/;
const subscriptionPattern = /^sub-[a-z0-9]+(?:-[a-z0-9]+)*-v[0-9]+-to-[a-z0-9]+(?:-[a-z0-9]+)*-(api|webhook|fe|mfe)$/;
const eventTypePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*\.v[0-9]+$/;
const forbiddenParts = new Set([
  "app",
  "apps",
  "backend",
  "frontend",
  "server",
  "service",
  "web",
]);

const entries = readdirSync(appsDir)
  .filter((entry) => statSync(join(appsDir, entry)).isDirectory())
  .filter((entry) => !entry.startsWith(".") && entry !== "node_modules")
  .map((name) => ({ name, path: join(appsDir, name) }));

const appNames = entries.map((entry) => entry.name).sort();
const terraformNames = readdirSync(terraformDir)
  .filter((entry) => statSync(join(terraformDir, entry)).isDirectory())
  .filter((entry) => !entry.startsWith(".") && entry !== "_shared" && entry !== "modules")
  .sort();

const violations = [];

for (const { name, path } of entries) {
  if (!canonicalPattern.test(name)) {
    violations.push(`${path}: must end in -api, -fe, -mfe, or -webhook`);
    continue;
  }

  const baseParts = name.replace(/-(api|fe|mfe|webhook)$/, "").split("-");
  const ambiguousPart = baseParts.find((part) => forbiddenParts.has(part));
  if (ambiguousPart) {
    violations.push(`${path}: avoid generic segment '${ambiguousPart}'`);
  }
}

const missingInfra = appNames.filter((name) => !terraformNames.includes(name));
const extraInfra = terraformNames.filter((name) => !appNames.includes(name));

for (const name of missingInfra) {
  violations.push(`apps/${name}: missing mirrored infrastructure/terraform/${name}`);
}

for (const name of extraInfra) {
  violations.push(`infrastructure/terraform/${name}: missing mirrored apps/${name}`);
}

const pubsubTerraform = readFileSync(join(terraformDir, "_shared/app/pubsub-managed.tf"), "utf8");
const notificationsTerraform = readFileSync(join(terraformDir, "notifications-webhook/app/main.tf"), "utf8");
const eventFiles = [
  "apps/stores-api/app/domain/events.py",
  "apps/stores-api/app/domain/events.py",
  "apps/prospects-api/app/domain/events.py",
];

for (const [, topicName] of pubsubTerraform.matchAll(/name\s+=\s+"([^"]+)"/g)) {
  if (!topicPattern.test(topicName)) {
    violations.push(`Pub/Sub topic '${topicName}': must match topic-<domain>-<aggregate>-<fact>-v<version>`);
  }
  if (topicName.includes("catalog-mx")) {
    violations.push(`Pub/Sub topic '${topicName}': must not include product or project prefix`);
  }
}

for (const [, subscriptionName] of notificationsTerraform.matchAll(/name\s+=\s+"([^"]+)"/g)) {
  if (subscriptionName.startsWith("catalog-mx-")) continue;
  if (!subscriptionPattern.test(subscriptionName)) {
    violations.push(`Pub/Sub subscription '${subscriptionName}': must match sub-<domain>-<aggregate>-<fact>-v<version>-to-<subscriber>`);
  }
}

for (const eventFile of eventFiles) {
  const content = readFileSync(eventFile, "utf8");
  for (const [, eventType] of content.matchAll(/"type":\s+"([^"]+)"/g)) {
    if (!eventTypePattern.test(eventType)) {
      violations.push(`${eventFile}: event type '${eventType}' must match <domain>.<aggregate>.<fact>.v<version>`);
    }
  }
  for (const [, topicName] of content.matchAll(/"topic":\s+"([^"]+)"/g)) {
    if (!topicPattern.test(topicName)) {
      violations.push(`${eventFile}: topic '${topicName}' must match topic-<domain>-<aggregate>-<fact>-v<version>`);
    }
  }
}

if (violations.length) {
  console.error("Nomenclature violations:");
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  process.exit(1);
}

console.log("Nomenclature check passed.");
