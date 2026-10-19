import {
  boolean,
  doublePrecision,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "analista", "viewer"]);
export const alertSeverityEnum = pgEnum("alert_severity", [
  "critica",
  "alta",
  "media",
  "baja",
]);
export const deviceStatusEnum = pgEnum("device_status", [
  "online",
  "offline",
  "unknown",
]);

const softDeleteCols = {
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
  is_active: boolean("is_active").default(true).notNull(),
};

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  full_name: text("full_name"),
  role: userRoleEnum("role").default("viewer").notNull(),
  avatar_url: text("avatar_url"),
  ...softDeleteCols,
});

export const devices = pgTable("devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  node_id: text("node_id").notNull().unique(),
  device_type: text("device_type").default("esp32").notNull(),
  status: deviceStatusEnum("status").default("unknown").notNull(),
  last_seen_at: timestamp("last_seen_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  owner_id: uuid("owner_id"),
  ...softDeleteCols,
});

export const alerts = pgTable("alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  module: text("module").default("ids").notNull(),
  attack_type: text("attack_type"),
  severity: alertSeverityEnum("severity").default("media").notNull(),
  score: doublePrecision("score"),
  source_ip: text("source_ip"),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
  created_by: uuid("created_by"),
  ...softDeleteCols,
});

export const scans = pgTable("scans", {
  id: uuid("id").defaultRandom().primaryKey(),
  target_url: text("target_url").notNull(),
  scan_type: text("scan_type").default("phishing").notNull(),
  status: text("status").default("pending").notNull(),
  risk_level: text("risk_level"),
  findings: jsonb("findings").$type<unknown[]>().default([]),
  created_by: uuid("created_by"),
  ...softDeleteCols,
});

export const models = pgTable("models", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  algorithm: text("algorithm").notNull(),
  metrics: jsonb("metrics").$type<Record<string, number>>().default({}),
  is_deployed: boolean("is_deployed").default(false).notNull(),
  created_by: uuid("created_by"),
  ...softDeleteCols,
});

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  report_type: text("report_type").notNull(),
  summary: text("summary"),
  content: jsonb("content").$type<Record<string, unknown>>().default({}),
  created_by: uuid("created_by"),
  ...softDeleteCols,
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actor_id: uuid("actor_id"),
  action: text("action").notNull(),
  entity_table: text("entity_table").notNull(),
  entity_id: uuid("entity_id"),
  details: jsonb("details").$type<Record<string, unknown>>().default({}),
  ...softDeleteCols,
});
