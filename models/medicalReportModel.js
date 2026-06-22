import mongoose from "mongoose";

const medicalReportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "medical report must belong to a patient"],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "medical report must belong to a doctor"],
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "medical report must belong to an appointment"],
    },
    diagnosis: {
      type: String,
      // required: [true, "diagnosis is required"],
      trim: true,
      minlength: [2, "diagnosis must be at least 2 characters"],
      maxlength: [200, "diagnosis must be at most 200 characters"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "notes must be at most 1000 characters"],
    },
  },
  { timestamps: true },
);

medicalReportSchema.index({ patient: 1, createdAt: -1 });
medicalReportSchema.index({ appointment: 1 });

const MedicalReport = mongoose.model("MedicalReport", medicalReportSchema);
export default MedicalReport;
