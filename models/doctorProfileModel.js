import mongoose from "mongoose";

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    specialization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialization",
      default: null,
    },

    experienceYears: {
      type: Number,
      default: 0,
    },

    workingDays: [
      {
        type: String,
        enum: [
          "saturday",
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
        ],
      },
    ],

    startTime: String,
    endTime: String,
  },
  {
    timestamps: true,
  },
);
doctorProfileSchema.pre(/^find/, function () {
  this.populate({
    path: `user`,
    select: "-__v -passwordChangedAt -passwordResetExpires -passwordResetToken",
  }).populate({
    path: "specialization",
  });
});
const DoctorProfile = mongoose.model("DoctorProfile", doctorProfileSchema);

export default DoctorProfile;
