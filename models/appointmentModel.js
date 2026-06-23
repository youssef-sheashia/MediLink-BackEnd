import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "appointment must have a patient"],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "appointment must have a doctor"],
    },
    isRated: {
      type: Boolean,
      default: false,
      select: true,
    },
    date: {
      type: Date,
      required: [true, "appointment must have a date"],
    },
    slotTime: {
      type: String,
      required: [true, "appointment must have a time slot"],
    },
    status: {
      type: String,
      enum: ["قيد الانتظار", "مكتمل", "ملغى", "مؤكد"],
      default: "قيد الانتظار",
    },
    fees: Number,
    cancelledBy: {
      type: String,
      enum: ["patient", "doctor", "receptionist"],
    },
    notes: String,
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    medicalFiles: [String],
  },
  { timestamps: true },
);

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
