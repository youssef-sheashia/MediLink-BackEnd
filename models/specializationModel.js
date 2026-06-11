import mongoose from "mongoose";

const specializationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "specialization name is required"],
      unique: true,
      trim: true,
      minlength: [2, "name must be at least 2 characters"],
      maxlength: [100, "name must be at most 100 characters"],
    },
    consultationFee: {
      type: Number,
      required: [true, "consultation fee is required"],
      min: [0, "fee cannot be negative"],
    },
  },
  { timestamps: true },
);

const Specialization = mongoose.model("Specialization", specializationSchema);
export default Specialization;
