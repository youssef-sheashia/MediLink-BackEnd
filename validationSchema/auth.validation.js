import { z } from "zod";
import { egyptianPhone } from "./shared.validation.js";

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

export const loginSchema = z.object({
  phone: egyptianPhone,
  password: passwordSchema,
});

export const forgetSchema = z.object({
  phone: egyptianPhone,
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
