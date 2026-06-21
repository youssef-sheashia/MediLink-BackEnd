import { z } from "zod";
import { egyptianPhone, timeRegex } from "./shared.validation.js";

export const createDoctorSchema = z
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

    phone: egyptianPhone,
    notes: z.string().optional(),
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

    // ─── DoctorProfile fields ────────────────────────────────────────────────────
    specialization: z
      .string({ required_error: "specialization name is required" })
      .min(2, "Specialization name must be at least 2 characters long")
      .max(100, "Specialization name cannot exceed 100 characters")
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, {
        message: "Invalid specialization ID",
      }),
    experienceYears: z
      .number({
        required_error: "experience years is required",
        invalid_type_error: "experience years must be a number",
      })
      .int("experience years must be a whole number")
      .min(0, "experience years cannot be negative")
      .max(60, "experience years seems too high"),

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

export const updateDoctorSchema = z
  .object({
    // ─── User fields ──────────────────────────────────────────────────────────
    firstName: z.string().min(2).max(50).trim().optional(),
    lastName: z.string().min(2).max(50).trim().optional(),
    phone: z
      .string()
      .regex(/^01[0125][0-9]{8}$/, "phone must be a valid Egyptian number")
      .optional(),
    gender: z.enum(["male", "female"]).optional(),
    notes: z.string().optional(),
    birthDate: z
      .string()
      .refine(
        (val) => !isNaN(Date.parse(val)),
        "birthDate must be a valid date",
      )
      .refine(
        (val) => new Date(val) < new Date(),
        "birthDate must be in the past",
      )
      .optional(),

    // ─── Profile fields ───────────────────────────────────────────────────────
    specialization: z.string().min(2).max(100).trim().optional(),

    experienceYears: z.number().int().min(0).max(60).optional(),
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
        ]),
      )
      .min(1)
      .max(7)
      .optional(),
    startTime: z
      .string()
      .regex(timeRegex, "start time must be in HH:MM format")
      .optional(),
    endTime: z
      .string()
      .regex(timeRegex, "end time must be in HH:MM format")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const [startH, startM] = data.startTime.split(":").map(Number);
        const [endH, endM] = data.endTime.split(":").map(Number);
        return endH * 60 + endM > startH * 60 + startM;
      }
      return true; // skip if one or both are not provided
    },
    { message: "end time must be after start time", path: ["endTime"] },
  );
