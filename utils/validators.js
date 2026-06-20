import { z } from "zod";
////////////////////////           constant Shemas      /////////////////////////
export const egyptianPhone = z
  .string({
    required_error: "phone is required",
    invalid_type_error: "phone must be a string",
  })
  .trim() // Removes accidental whitespace
  .regex(
    /^(?:\+20|0)?1[0125][0-9]{8}$/,
    "please provide a valid egyptian phone number",
  );
const passwordSchema = z
  .string({
    required_error: "password is required",
    invalid_type_error: "password must be a string",
  })
  .superRefine((val, ctx) => {
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
  });
const confirmPasswordSchema = z.string({
  required_error: "confirm password is required",
  invalid_type_error: "confirm password must be a string",
});
///////////////////////////////////////////////////// signUp Schema //////////////////////////////////

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
      required_error: "Gender is required",
      invalid_type_error: "Gender must be 'male' or 'female'",
    }),
    phone: egyptianPhone,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
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
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirm password do not match. Please try again",
    path: ["confirmPassword"],
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
  password: passwordSchema,
});
///////////////////////////////////////////////////// forget Schema //////////////////////////////////

export const forgetSchema = z.object({
  phone: egyptianPhone,
});
///////////////////////////////////////////////////// verifyOTP Schema //////////////////////////////////

export const verifyOTP_Schema = z.object({
  phone: egyptianPhone,
  otp: z
    .string({
      required_error: "otp code is required",
      invalid_type_error: "otp must be a string",
    })
    .min(1, "otp is required"),
});
///////////////////////////////////////////////////// reset password Schema //////////////////////////////////
export const resetPasswordSchema = z
  .object({
    phone: egyptianPhone,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirm password do not match. Please try again",
    path: ["confirmPassword"],
  });
///////////////////////////////////////////////////// update password Schema //////////////////////////////////
export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    newpassword: passwordSchema,
    confirmnewpassword: confirmPasswordSchema,
  })
  .refine((data) => data.newpassword === data.confirmnewpassword, {
    message: "passwords do not match",
    path: ["confirmnewpassword"],
  });
////////////////////////////////////////////////////////////////////////
export const specializationSchema = z.object({
  name: z
    .string({ required_error: "specialization name is required" })
    .min(2, "Specialization name must be at least 2 characters long")
    .max(100, "Specialization name cannot exceed 100 characters")
    .trim()
    .regex(
      /^[a-zA-Z\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+$/,
      {
        message:
          "Specialization name must contain only Arabic or English letters and spaces",
      },
    ),
  consultationFee: z
    .number({
      required_error: "consultation fee is required",
      invalid_type_error: "fee must be a number",
    })
    .min(0, "fee cannot be negative")
    .max(1000,"fee cannot be bigger than one thousouds"),
});
// validators/doctorValidator.js

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

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
    notes:z
      .string().optional(),
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
    notes:z.string().optional(),
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

const workingDaySchema = z
  .object({
    day: z.enum(
      ["السبت", "الاحد", "الاثنين", "الثلاثاء", "الاربعاء", "الخميس", "الجمعة"],
      { required_error: "day is required" },
    ),

    isActive: z.boolean({
      required_error: "isActive is required",
      invalid_type_error: "isActive must be a boolean",
    }),

    startTime: z
      .string()
      .regex(timeRegex, "startTime must be in HH:MM format")
      .nullable(),

    endTime: z
      .string()
      .regex(timeRegex, "endTime must be in HH:MM format")
      .nullable(),
  })
  .refine(
    (data) => {
      if (!data.isActive) return true;
      if (!data.startTime || !data.endTime) return false;
      const [sh, sm] = data.startTime.split(":").map(Number);
      const [eh, em] = data.endTime.split(":").map(Number);
      return eh * 60 + em > sh * 60 + sm;
    },
    {
      message:
        "active day must have valid start and end times, and end must be after start",
    },
  );
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
    notes:z.string().optional(),
    phone: z
      .string({ required_error: "phone is required" })
      .regex(
        /^01[0125][0-9]{8}$/,
        "phone must be a valid Egyptian number (e.g. 01012345678)",
      ),

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

    // ─── DoctorProfile fields ────────────────────────────────────────────────────
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

///////////////////////////////////////////////////////////////////////////////////////
const dateString = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  "must be a valid date (YYYY-MM-DD)", //"2026-04-13"
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
  // rule 1 — week view: startDate and endDate must come together
  .refine(
    (data) => {
      const hasStart = data.startDate !== undefined;
      const hasEnd = data.endDate !== undefined;
      return hasStart === hasEnd; // both or neither
    },
    { message: "startDate and endDate must both be provided together" },
  )
  // rule 2 — week view: endDate must be after startDate
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    { message: "endDate must be after startDate", path: ["endDate"] },
  )
  // rule 3 — week view: max 7 days range
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
  // rule 4 — month view: month and year must come together
  .refine(
    (data) => {
      const hasMonth = data.month !== undefined;
      const hasYear = data.year !== undefined;
      return hasMonth === hasYear; // both or neither
    },
    { message: "month and year must both be provided together" },
  )
  // rule 5 — must provide at least one view type
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
  // rule 6 — can't mix view types
  .refine(
    (data) => {
      const isDay = data.date !== undefined ? 1 : 0;
      const isWeek = data.startDate !== undefined ? 1 : 0;
      const isMonth = data.month !== undefined ? 1 : 0;
      return isDay + isWeek + isMonth === 1; // exactly one view
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
    })
    .refine((val) => new Date(val) >= new Date(new Date().setHours(0,0,0,0)), {
      message: "date cannot be in the past",
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
export const bookAppointmentSchemaByRecption = z.object({
  doctorId: z
    .string({ required_error: "doctor id is required" })
    .regex(/^[a-f\d]{24}$/i, "invalid doctor id"),

  date: z
    .string({ required_error: "date is required" })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "invalid date format, use YYYY-MM-DD",
    })
    .refine((val) => new Date(val) >= new Date(new Date().setHours(0,0,0,0)), {
      message: "date cannot be in the past",
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
      .max(new Date().getFullYear(), "year cannot be in the future")
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
