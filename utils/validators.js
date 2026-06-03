import {z} from 'zod'
const egyptianPhone = z
  .string({ required_error: "phone is required", invalid_type_error: "phone must be a string" })
  .regex(/^(\+?2?0)?1[0125][0-9]{8}$/, "please provide a valid egyptian phone number");

export const signUpSchema = z.object({
  firstName: z.string({ required_error: "first name is required" })
    .min(2, "first name must be at least 2 characters")
    .max(20, "first name must be less than 20 characters"),

  lastName: z.string({ required_error: "last name is required" })
    .min(2, "last name must be at least 2 characters")
    .max(20, "last name must be less than 20 characters"),

  gender: z.enum(["male", "female"], { required_error: "gender is required" }),

  phone: egyptianPhone,

  password: z.string(
    { required_error: "password is required", invalid_type_error: "password must be a string" }
  )
    .min(8, "password must be at least 8 characters")
    .regex(/[A-Z]/, "password must contain at least one uppercase letter")
    .regex(/[0-9]/, "password must contain at least one number"),

  confirmpassword: z.string(
    { required_error: "please confirm your password", invalid_type_error: "password must be a string" }
  ),
  day: z.number({ required_error: "day is required", invalid_type_error: "day must be a number" })
    .int().min(1, "day must be between 1 and 31").max(31, "day must be between 1 and 31"),

  month: z.number({ required_error: "month is required", invalid_type_error: "month must be a number" })
    .int().min(1, "month must be between 1 and 12").max(12, "month must be between 1 and 12"),

  year: z.number({ required_error: "year is required", invalid_type_error: "year must be a number" })
    .int().min(1900, "year must be after 1900").max(new Date().getFullYear(), "year cannot be in the future"),

}).refine(
  (data) => data.password === data.confirmpassword,
  { message: "passwords do not match", path: ["confirmpassword"] }
)
.refine(
  (data) => {
    const date = new Date(data.year, data.month - 1, data.day);
    return (
      date.getFullYear() === data.year &&
      date.getMonth() === data.month - 1 &&
      date.getDate() === data.day
    );
  },
  { message: "invalid birth date", path: ["day"] }
)
.refine(
  (data) => {
    const birthDate = new Date(data.year, data.month - 1, data.day);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 1 && age <= 120;
  },
  { message: "age must be between 1 and 120 years", path: ["year"] }
);
///////////////////////////////////////////////////// login Schema //////////////////////////////////
export const loginSchema = z.object({
  phone: egyptianPhone,
  password: z.string(
    { required_error: "password is required", invalid_type_error: "password must be a string" }
  ).min(1, "password is required"),
});

export const verifyOTP_Schema = z.object({
  phone: egyptianPhone,
  otp: z.string({ required_error: "otp code is required", invalid_type_error: "otp must be a string" }).min(1, "otp is required"),
});