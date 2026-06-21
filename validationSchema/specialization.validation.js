import { z } from "zod";

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
    .max(1000, "fee cannot be bigger than one thousand"),
});
