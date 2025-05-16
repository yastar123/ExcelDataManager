import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Record schema for Excel import/export
export const records = pgTable("records", {
  id: serial("id").primaryKey(),
  standardid: text("standardid").notNull().unique(),
  tanggal: date("tanggal").notNull(),
  actual: text("actual").notNull(),
  kategori: text("kategori").notNull(),
  status: text("status").notNull(),
  keterangan: text("keterangan"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRecordSchema = createInsertSchema(records).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertRecord = z.infer<typeof insertRecordSchema>;
export type Record = typeof records.$inferSelect;

// Zod schema for validating Excel data
export const excelRowSchema = z.object({
  standardid: z.string().min(1, "Standard ID is required"),
  tanggal: z.string().refine(
    (val) => {
      // Check if it's a valid date in YYYY-MM-DD format
      return /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val));
    }, 
    { message: "Invalid date format. Use YYYY-MM-DD" }
  ),
  actual: z.string().min(1, "Actual value is required"),
  kategori: z.string().min(1, "Kategori is required"),
  status: z.string().min(1, "Status is required"),
  keterangan: z.string().optional(),
});

export type ExcelRow = z.infer<typeof excelRowSchema>;

// Schema for export filter
export const exportFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  columns: z.array(z.string()),
});

export type ExportFilter = z.infer<typeof exportFilterSchema>;

// Schema for validation response
export const validationResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(
    z.object({
      row: z.number(),
      errors: z.array(z.string()),
    })
  ),
  preview: z.array(z.any()),
});

export type ValidationResponse = z.infer<typeof validationResponseSchema>;
