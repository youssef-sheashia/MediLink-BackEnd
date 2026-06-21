import { z } from "zod";
import { egyptianPhone, timeRegex } from "./shared.validation.js";

export const ClinicInformationsSchema = z.object({
  name: z
    .string({ required_error: "clinic name is required" })
    .min(2, "clinic name must be at least 2 characters")
    .max(100, "clinic name must be at most 100 characters")
    .trim(),
  address: z
    .string({ required_error: "city is required" })
    .min(2, "city must be at least 2 characters")
    .trim(),

  description: z
    .string({ required_error: "description is required" })
    .min(10, "description must be at least 10 characters")
    .max(500, "description must be at most 500 characters")
    .trim(),
  phone: egyptianPhone,
  email: z
    .string({ required_error: "email is required" })
    .email("email must be a valid email address")
    .trim(),
});

export const updateScheduleSchema = z.object({
  appointmentDuration: z
    .number({
      required_error: "appointment duration is required",
      invalid_type_error: "duration must be a number",
    })
    .min(5, "duration must be at least 5 minutes")
    .max(180, "duration must be at most 180 minutes")
    .default(25),

  workingDays: z
    .array(
      z.object({
        day: z.enum(
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
            required_error: "day is required",
            invalid_type_error: "invalid day selection",
          }
        ),
        isActive: z
          .boolean({
            invalid_type_error: "isActive must be a boolean",
          })
          .default(false),
        startTime: z
          .string({
            invalid_type_error: "startTime must be a string",
          })
          .nullable()
          .default(null),
        endTime: z
          .string({
            invalid_type_error: "endTime must be a string",
          })
          .nullable()
          .default(null),
      })
    )
    .default([]),
});
