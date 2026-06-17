// models/ratingModel.js
import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorProfile",
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true, // one rating per appointment
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true },
);

// after every save — recalculate the doctor's average rating
ratingSchema.statics.calcAverageRating = async function (doctorId) {
  const stats = await this.aggregate([
    { $match: { doctor: doctorId } },
    {
      $group: {
        _id: "$doctor",
        avgRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model("DoctorProfile").findByIdAndUpdate(doctorId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10, // round to 1 decimal e.g 4.3
      totalRatings: stats[0].totalRatings,
    });
  } else {
    await mongoose.model("DoctorProfile").findByIdAndUpdate(doctorId, {
      averageRating: 0,
      totalRatings: 0,
    });
  }
};

// trigger recalculation after save
ratingSchema.post("save", function () {
  this.constructor.calcAverageRating(this.doctor);
});

// trigger recalculation after delete
ratingSchema.post("findOneAndDelete", function (doc) {
  if (doc) doc.constructor.calcAverageRating(doc.doctor);
});

export default mongoose.model("Rating", ratingSchema);
