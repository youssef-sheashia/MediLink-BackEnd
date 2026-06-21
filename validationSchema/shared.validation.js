import { z } from "zod";

export const egyptianPhone = z
  .string({
    required_error: "phone is required",
    invalid_type_error: "phone must be a string",
  })
  .trim()
  .regex(
    /^(?:\+20|0)?1[0125][0-9]{8}$/,
    "please provide a valid egyptian phone number",
  );

export const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
