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
    // averageRating: {
    //   type: Number,
    //   default: 0,
    //   min: 0,
    //   max: 5,
    // },
    // totalRatings: {
    //   type: Number,
    //   default: 0,
    // },

    workingDays: [
      {
        type: String,
        enum: [
          "السبت",
          "الاحد",
          "الاثنين",
          "الثلاثاء",
          "الاربعاء",
          "الخميس",
          "الجمعة",
        ],
      },
    ],
    startTime: String,
    endTime: String,

    // calculated automatically every time a review is added or deleted
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val) => Math.round(val * 10) / 10, // 4.666 → 4.7
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

doctorProfileSchema.pre(/^find/, function () {
  this.populate({
    path: "user",
    select: "-__v -passwordChangedAt -passwordResetExpires -passwordResetToken",
  }).populate({
    path: "specialization",
  });
});

const DoctorProfile = mongoose.model("DoctorProfile", doctorProfileSchema);
export default DoctorProfile;
