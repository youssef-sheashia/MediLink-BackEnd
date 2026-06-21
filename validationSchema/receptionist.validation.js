import { z } from "zod";
import { egyptianPhone, timeRegex } from "./shared.validation.js";

export const createreceptionistSchema = z
  .object({
    // ─── User fields ────────────────────────────────────────────────────────────
    firstName: z
      .string({ required_error: "first name is required" })
      .min(2, "first name must be at least 2 characters")
      .max(50, "first name must be at most 50 characters")
      .trim(),

    lastName: z
      .string({ required_error: "last name is required" })
      .min(2, "last name must be at least 2 characters")
      .max(50, "last name must be at most 50 characters")
      .trim(),
    notes: z.string().optional(),
    phone: egyptianPhone,

    password: z.string().superRefine((val, ctx) => {
      if (val.length < 8) {
        ctx.addIssue({
          code: "custom",
          message: "Password must be at least 8 characters long",
        });
      }

      if (!/[a-z]/.test(val)) {
        ctx.addIssue({
          code: "custom",
          message: "Password must contain at least one lowercase letter",
        });
      }

      if (!/[A-Z]/.test(val)) {
        ctx.addIssue({
          code: "custom",
          message: "Password must contain at least one uppercase letter",
        });
      }

      if (!/[0-9]/.test(val)) {
        ctx.addIssue({
          code: "custom",
          message: "Password must contain at least one number",
        });
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(val)) {
        ctx.addIssue({
          code: "custom",
          message: "Password must contain at least one special character",
        });
      }
    }),
    confirmPassword: z.string({
      required_error: "confirm password is required",
    }),

    gender: z.enum(["male", "female"], {
      required_error: "gender is required",
      invalid_type_error: "gender must be male or female",
    }),

    // ─── Profile fields ────────────────────────────────────────────────────
    education: z
      .string({ required_error: "education is required" })
      .min(2, "education must be at least 2 characters")
      .max(100, "education must be at most 100 characters")
      .trim(),

    status: z
      .string({ required_error: "status is required" })
      .min(2, "status must be at least 2 characters")
      .max(100, "status must be at most 100 characters")
      .trim(),

    workingDays: z
      .array(
        z.enum(
          [
            "السبت",
            "الاحد",
            "الاثنين",
            "الثلاثاء",
            "الاربعاء",
            "الخميس",
            "الجمعة",
          ],
          {
            invalid_type_error: "each working day must be a valid day name",
          },
        ),
      )
      .min(1, "at least one working day is required")
      .max(7, "working days cannot exceed 7"),

    startTime: z
      .string({ required_error: "start time is required" })
      .regex(timeRegex, "start time must be in HH:MM format (e.g. 09:00)"),
    birthDate: z
      .string({ required_error: "birth date is required" })
      .refine(
        (val) => !isNaN(Date.parse(val)),
        "birthDate must be a valid date",
      )
      .refine(
        (val) => new Date(val) < new Date(),
        "birthDate must be in the past",
      ),
    endTime: z
      .string({ required_error: "end time is required" })
      .regex(timeRegex, "end time must be in HH:MM format (e.g. 17:00)"),
  })
  // ─── Cross-field validations ───────────────────────────────────────────────────
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      const [startH, startM] = data.startTime.split(":").map(Number);
      const [endH, endM] = data.endTime.split(":").map(Number);
      return endH * 60 + endM > startH * 60 + startM;
    },
    { message: "end time must be after start time", path: ["endTime"] },
  );

export const receptionistUpdateSchema = z
  .object({
    // ─── User fields ────────────────────────────────────────────────────────────
    firstName: z
      .string()
      .min(2, "first name must be at least 2 characters")
      .max(20, "first name must be less than 20 characters")
      .trim()
      .optional(),

    lastName: z
      .string()
      .min(2, "last name must be at least 2 characters")
      .max(20, "last name must be less than 20 characters")
      .trim()
      .optional(),

    gender: z
      .enum(["male", "female"], {
        invalid_type_error: "gender must be male or female",
      })
      .optional(),

    birthDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), "birthDate must be a valid date")
      .refine((val) => new Date(val) < new Date(), "birthDate must be in the past")
      .optional(),
    notes: z.string().optional(),
    photo: z.string().url("Please provide a valid image URL").optional(),
    active: z.boolean().optional(),

    // ─── ReceptionistProfile fields ──────────────────────────────────────────────
    education: z
      .string()
      .min(2, "education must be at least 2 characters")
      .trim()
      .optional(),

    status: z
      .string()
      .min(2, "status must be at least 2 characters")
      .trim()
      .optional(),

    workingDays: z
      .array(
        z.enum([
          "السبت",
          "الاحد",
          "الاثنين",
          "الثلاثاء",
          "الاربعاء",
          "الخميس",
          "الجمعة",
        ], {
          invalid_type_error: "each working day must be a valid day name",
        })
      )
      .min(1, "at least one working day is required")
      .max(7, "working days cannot exceed 7")
      .optional(),

    startTime: z
      .string()
      .regex(timeRegex, "start time must be in HH:MM format (e.g. 09:00)")
      .optional(),

    endTime: z
      .string()
      .regex(timeRegex, "end time must be in HH:MM format (e.g. 17:00)")
      .optional(),
  })
  .strict()
  // ─── Safe Cross-field validations ───────────────────────────────────────────
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      const [startH, startM] = data.startTime.split(":").map(Number);
      const [endH, endM] = data.endTime.split(":").map(Number);
      return endH * 60 + endM > startH * 60 + startM;
    },
    { message: "end time must be after start time", path: ["endTime"] }
  );
