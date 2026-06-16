import { z } from "zod";

const medicineSchema = z.object({
  name: z
    .string({ required_error: "medicine name is required" })
    .trim()
    .min(2, "medicine name must be at least 2 characters")
    .max(100, "medicine name must be at most 100 characters"),

  dose: z
    .string({ required_error: "medicine dose is required" })
    .trim()
    .min(1, "dose is required")
    .max(50, "dose must be at most 50 characters"),

  frequency: z
    .string({ required_error: "medicine frequency is required" })
    .trim()
    .min(1, "frequency is required")
    .max(100, "frequency must be at most 100 characters"),

  duration: z
    .string({ required_error: "medicine duration is required" })
    .trim()
    .min(1, "duration is required")
    .max(50, "duration must be at most 50 characters"),
});

export const createPrescriptionSchema = z.object({
  patient: z
    .string({ required_error: "patient id is required" })
    .regex(/^[a-f\d]{24}$/i, "invalid patient id"),
  doctor: z 
    .string({ required_error: "doctor id is required" })
    .regex(/^[a-f\d]{24}$/i, "invalid doctor id"),
  appointment: z
    .string({ required_error: "appointment id is required" })
    .regex(/^[a-f\d]{24}$/i, "invalid appointment id"),

  medicines: z
    .array(medicineSchema, { required_error: "medicines are required" })
    .min(1, "prescription must have at least one medicine"),
});

