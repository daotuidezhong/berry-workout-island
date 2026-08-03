import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const checkins = sqliteTable("checkins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id").notNull(),
  date: text("date").notNull(),
  activity: text("activity").notNull(),
  minutes: integer("minutes"),
  calories: integer("calories"),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idx_checkins_device_date").on(table.deviceId, table.date)]);
