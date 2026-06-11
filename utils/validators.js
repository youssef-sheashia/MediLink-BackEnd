import { z } from "zod";
export const egyptianPhone = z
  .string({
    required_error: "phone is required",
    invalid_type_error: "phone must be a string",
  })
  .regex(
    /^(\+?2?0)?1[0125][0-9]{8}$/,
    "please provide a valid egyptian phone number",
  );

export const signUpSchema = z
  .object({
    firstName: z
      .string({ required_error: "first name is required" })
      .min(2, "first name must be at least 2 characters")
      .max(20, "first name must be less than 20 characters"),

    lastName: z
      .string({ required_error: "last name is required" })
      .min(2, "last name must be at least 2 characters")
      .max(20, "last name must be less than 20 characters"),

    gender: z.enum(["male", "female"], {
      required_error: "gender is required",
    }),

    phone: egyptianPhone,

    password: z
      .string({
        required_error: "password is required",
        invalid_type_error: "password must be a string",
      })
      .min(8, "password must be at least 8 characters")
      .regex(/[A-Z]/, "password must contain at least one uppercase letter")
      .regex(/[0-9]/, "password must contain at least one number"),

    confirmpassword: z.string({
      required_error: "please confirm your password",
      invalid_type_error: "password must be a string",
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
  .refine((data) => data.password === data.confirmpassword, {
    message: "passwords do not match",
    path: ["confirmpassword"],
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
///////////////////////////////////////////////////// login Schema //////////////////////////////////
export const loginSchema = z.object({
  phone: egyptianPhone,
  password: z
    .string({
      required_error: "password is required",
      invalid_type_error: "password must be a string",
    })
    .min(1, "password is required"),
});

export const verifyOTP_Schema = z.object({
  phone: egyptianPhone,
  otp: z
    .string({
      required_error: "otp code is required",
      invalid_type_error: "otp must be a string",
    })
    .min(1, "otp is required"),
});

////////////////////////////////////////////////////////////////////////
// validators/doctorValidator.js

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM 24-hour format

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

    phone: z
      .string({ required_error: "phone is required" })
      .regex(
        /^01[0125][0-9]{8}$/,
        "phone must be a valid Egyptian number (e.g. 01012345678)",
      ),

    password: z
      .string({ required_error: "password is required" })
      .min(8, "password must be at least 8 characters")
      .regex(/[A-Z]/, "password must contain at least one uppercase letter")
      .regex(/[a-z]/, "password must contain at least one lowercase letter")
      .regex(/[0-9]/, "password must contain at least one number"),

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
      .string({ required_error: "specialization is required" })
      .min(2, "specialization must be at least 2 characters")
      .max(100, "specialization must be at most 100 characters")
      .trim(),

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
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
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
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
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
export const updatePasswordSchema = z
  .object({
    password: z
      .string({ required_error: "password is required" })
      .min(8, "password must be at least 8 characters"),
    newpassword: z
      .string({
        required_error: "password is required",
        invalid_type_error: "password must be a string",
      })
      .min(8, "password must be at least 8 characters")
      .regex(/[A-Z]/, "password must contain at least one uppercase letter")
      .regex(/[0-9]/, "password must contain at least one number"),

    confirmnewpassword: z.string({
      required_error: "please confirm your password",
      invalid_type_error: "password must be a string",
    }),
  })
  .refine((data) => data.newpassword === data.confirmnewpassword, {
    message: "passwords do not match",
    path: ["confirmpassword"],
  });
