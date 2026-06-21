import mongoose from "mongoose";
import DoctorProfile from "./doctorProfileModel.js";

const reviewSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "review must belong to a patient"],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "review must belong to a doctor"],
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "review must belong to an appointment"],
      unique: true, // one review per appointment only
    },
    stars: {
      type: Number,
      required: [true, "review must have a star rating"],
      min: [0.5, "rating must be at least 0.5"],
      max: [5, "rating must be at most 5"],
      validate: {
        validator: (val) => (val * 2) % 1 === 0, // only 0.5 steps allowed
        message: "stars must be in 0.5 increments (0.5, 1, 1.5 ... 5)",
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "comment must be at most 500 characters"],
    },
  },
  { timestamps: true },
);

// prevent one patient from reviewing the same doctor twice
reviewSchema.index({ patient: 1, doctor: 1 }, { unique: true });

// this static method recalculates the doctor's average rating
// we call it every time a review is created or deleted
reviewSchema.statics.recalcRating = async function (doctorId) {
  const stats = await this.aggregate([
    { $match: { doctor: doctorId } },
    {
      $group: {
        _id: "$doctor",
        avgRating: { $avg: "$stars" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await DoctorProfile.findOneAndUpdate(
      { user: doctorId },
      {
        ratingsAverage: stats[0].avgRating,
        ratingsCount: stats[0].count,
      },
    );
  } else {
    await DoctorProfile.findOneAndUpdate(
      { user: doctorId },
      {
        ratingsAverage: 4.5,
        ratingsCount: 0,
      },
    );
  }
};

// after saving a new review → recalculate
reviewSchema.post("save", function () {
  this.constructor.recalcRating(this.doctor);
});

// after deleting a review → recalculate
reviewSchema.post("findOneAndDelete", function (doc) {
  if (doc) doc.constructor.recalcRating(doc.doctor);
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;
