import { z } from 'zod';


const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

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

    phone: z
      .string()
      .regex(/^(\+?2?0)?1[0-9]{8}$/, "please provide a valid egyptian phone number")
      .optional(),

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