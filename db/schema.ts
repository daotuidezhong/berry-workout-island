import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const checkins = sqliteTable("checkins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id").notNull(),
  date: text("date").notNull(),
  activity: text("activity").notNull(),
  category: text("category").notNull().default("其他"),
  minutes: integer("minutes"),
  mood: text("mood"),
  createdAt: text("created_at").notNull(),
});
