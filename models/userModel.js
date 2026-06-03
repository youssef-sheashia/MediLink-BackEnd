import Mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";
const userSchema = new Mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "first name is required"],
    minLength: [2, "first name must be at least 2 characters"],
    maxLength: [20, "first name must be less than 20 characters"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "last name is required"],
    minLength: [2, "last name must be at least 2 characters"],
    maxLength: [20, "last name must be less than 20 characters"],
    trim: true,
  },
  gender: {
    type: String,
    enum: ["male", "female"],
    required: [true, "gender is required"],
  },
  birthDate: {
    type: Date,
    required: [true, "birth date is required"],
  },
  phone: {
    type: String,
    required: [true, "please provide your phone number"],
    unique: true,

    validate: {
      validator: function (value) {
        return /^(\+?2?0)?1[0125][0-9]{8}$/.test(value);
      },
      message: "please provide a valid egyptian phone number",
    },
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ["patient", "admin", "doctor", "receptionist"],
    default: "patient",
  },
  password: {
    type: String,
    required: [true, "the password is require"],
    minLength: [8, "password must be more than 8 characters"],
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
  },
});
userSchema.virtual("isPreHashed").set(function (val) {
  this._isPreHashed = val;
});
// userSchema.pre("save", function (next) {
//   if (!this.isModified("password") || this.isNew) return next();
//   this.passwordChangedAt = Date.now() - 1000;
//   next();
// });
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")||this._isPreHashed) return next();

//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });
// userSchema.pre(/^find/, function (next) { // when i make signup this middleware return error for next
//   this.find({ active: { $ne: false } });
//   console.log(this);
//   next();
// });
userSchema.methods.correctPassword = async (
  candidatePassword,
  userpassword,
) => {
  return await bcrypt.compare(candidatePassword, userpassword);
};
userSchema.methods.changedPasswordAfter = function (tokenDate) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return changedTimestamp > tokenDate;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = Mongoose.model("User", userSchema);
export default User;
