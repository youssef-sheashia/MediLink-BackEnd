import { z } from "zod";
import { egyptianPhone } from "./shared.validation.js";
import {medicineSchema} from "./shared.validation.js"

const dateString = z
  .string()
  .refine(
    (val) => !isNaN(Date.parse(val)),
    "must be a valid date (YYYY-MM-DD)",
  );

export const appointmentQuerySchema = z
  .object({
    date: dateString.optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    month: z.coerce
      .number({ invalid_type_error: "month must be a number" })
      .int()
      .min(1, "month must be between 1 and 12")
      .max(12, "month must be between 1 and 12")
      .optional(),

    year: z.coerce
      .number({ invalid_type_error: "year must be a number" })
      .int()
      .min(2000, "year seems too old")
      .max(2100, "year seems too far in future")
      .optional(),
  })
  .refine(
    (data) => {
      const hasStart = data.startDate !== undefined;
      const hasEnd = data.endDate !== undefined;
      return hasStart === hasEnd;
    },
    { message: "startDate and endDate must both be provided together" },
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    { message: "endDate must be after startDate", path: ["endDate"] },
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        const diff =
          (new Date(data.endDate) - new Date(data.startDate)) /
          (1000 * 60 * 60 * 24);
        return diff <= 7;
      }
      return true;
    },
    { message: "week range cannot exceed 7 days", path: ["endDate"] },
  )
  .refine(
    (data) => {
      const hasMonth = data.month !== undefined;
      const hasYear = data.year !== undefined;
      return hasMonth === hasYear;
    },
    { message: "month and year must both be provided together" },
  )
  .refine(
    (data) => {
      const isDay = data.date !== undefined;
      const isWeek = data.startDate !== undefined;
      const isMonth = data.month !== undefined;
      return isDay || isWeek || isMonth;
    },
    {
      message:
        "provide date (day), startDate+endDate (week), or month+year (month)",
    },
  )
  .refine(
    (data) => {
      const isDay = data.date !== undefined ? 1 : 0;
      const isWeek = data.startDate !== undefined ? 1 : 0;
      const isMonth = data.month !== undefined ? 1 : 0;
      return isDay + isWeek + isMonth === 1;
    },
    { message: "provide only one view type at a time: day, week, or month" },
  );

export const bookAppointmentSchema = z.object({
  doctorId: z
    .string({ required_error: "doctor id is required" })
    .regex(/^[a-f\d]{24}$/i, "invalid doctor id"),

  date: z
    .string({ required_error: "date is required" })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "invalid date format, use YYYY-MM-DD",
    }),

slotTime: z
  .string({ required_error: "slot time is required" })
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "slot time must be in HH:MM format"),

  reason: z
    .string({ required_error: "reason is required" })
    .trim()
    .min(3, "reason must be at least 3 characters")
    .max(300, "reason must be at most 300 characters"),
});

export const bookAppointmentSchemaByRecption = z
  .object({
    doctorId: z
      .string({ required_error: "doctor id is required" })
      .regex(/^[a-f\d]{24}$/i, "invalid doctor id"),

  date: z
    .string({ required_error: "date is required" })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "invalid date format, use YYYY-MM-DD",
    }),

  slotTime: z
    .string({ required_error: "slot time is required" })
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "slot time must be in HH:MM format"),

    firstName: z
      .string({ required_error: "first name is required" })
      .min(2, "first name must be at least 2 characters")
      .max(20, "first name must be less than 20 characters"),

    lastName: z
      .string({ required_error: "last name is required" })
      .min(2, "last name must be at least 2 characters")
      .max(20, "last name must be less than 20 characters"),
    phone: egyptianPhone,
    gender: z.enum(["male", "female"], {
      required_error: "Gender is required",
      invalid_type_error: "Gender must be 'male' or 'female'",
    }),
    day: z
      .number({
        required_error: "day is required",
        invalid_type_error: "day must be a number",
      })
      .int()
      .min(1, "day must be between 1 and 31")
      .max(31, "day must be between 1 and 31"),

    month: z
      .number({
        required_error: "month is required",
        invalid_type_error: "month must be a number",
      })
      .int()
      .min(1, "month must be between 1 and 12")
      .max(12, "month must be between 1 and 12"),

    year: z
      .number({
        required_error: "year is required",
        invalid_type_error: "year must be a number",
      })
      .int()
      .min(1900, "year must be after 1900")
      .max(new Date().getFullYear(), "year cannot be in the future"),
  })
  .refine(
    (data) => {
      const date = new Date(data.year, data.month - 1, data.day);
      return (
        date.getFullYear() === data.year &&
        date.getMonth() === data.month - 1 &&
        date.getDate() === data.day
      );
    },
    { message: "invalid birth date", path: ["day"] },
  )
  .refine(
    (data) => {
      const birthDate = new Date(data.year, data.month - 1, data.day);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 1 && age <= 120;
    },
    { message: "age must be between 1 and 120 years", path: ["year"] },
  );


export const completeAppointmentSchema = z.object({
  diagnosis: z
    .string({ required_error: "diagnosis is required" })
    .trim()
    .min(2, "diagnosis must be at least 2 characters")
    .max(200, "diagnosis must be at most 200 characters"),

  notes: z
    .string()
    .trim()
    .max(1000, "notes must be at most 1000 characters")
    .optional(),
  medicines: z
    .array(medicineSchema, { required_error: "medicines are required" })
    .min(1, "prescription must have at least one medicine"),
});
