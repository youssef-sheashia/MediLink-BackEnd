import mongoose from "mongoose";
const ReceptionistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
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
    education: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },

    startTime: String,
    endTime: String,
  },
  {
    timestamps: true,
  },
);
ReceptionistSchema.pre(/^find/, function () {
  this.populate({
    path: `user`,
    select:
      "-__v _id -passwordChangedAt -passwordResetExpires -passwordResetToken",
  });
});
const Receptionist = mongoose.model("Receptionist", ReceptionistSchema);

export default Receptionist;
