import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";
import PatientProfile from "../models/patientProfileModel.js";
import client from "../config/redis.js";
import sendOTP from "../utils/sendOTP.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ACTIONS } from "../constant/activities.js";
import Activity from "../models/activitiesModel.js";
const createToken = function (id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = function (user, statusCode, res) {
  const token = createToken(user.id);
  user.password = undefined;
  if (process.env.NODE_ENV === "production") {
    const cookieOptions = {
      expires: new Date(
        Date.now() +
          (process.env.COOKIES_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000,
      ),
      httpOnly: true,
      secure: true,
    };
    return res.cookie("jwt", token, cookieOptions).status(statusCode).json({
      status: "success",
      user,
      token,
    });
  }
  // in dev
  return res.status(statusCode).json({
    status: "success",
    user,
    token,
  });
};

export const signUp = catchAsync(async (req, res, next) => {
  const { firstName, lastName, phone, password, gender, day, month, year } =
    req.body;
  const birthDate = new Date(year, month - 1, day);

  const user = await User.findOne({ phone });
  if (user)
    return next(
      new AppError("phone already exist try another phone number", 400),
    );

  const otp = Math.floor(100000 + Math.random() * 900000);
  ////////////// save data and otp in redis server//////////////////////////

  const key = `signUp:${phone}`;
  const hashedPassword = await bcrypt.hash(password, 12);
  const value = {
    firstName,
    lastName,
    gender,
    birthDate,
    phone,
    password: hashedPassword,
    otp,
  };
  await client.set(key, JSON.stringify(value), { EX: 300 });
  if (process.env.NODE_ENV === "development") {
    console.log("OTP:", otp);
  } else {
    // await sendOTP(phone, otp);
    console.log("OTP:", otp);
  }
  res.status(200).json({
    status: "success",
    message: "check your phone SMS we send OTP verification to you",
    phone,
    otp,
  });
});
export const verifyOTP = catchAsync(async (req, res, next) => {
  const clientData = await client.get(`signUp:${req.body.phone}`);
  if (!clientData)
    return next(new AppError("OTP expired, please request a new one", 400));
  const { firstName, lastName, gender, birthDate, phone, password, otp } =
    JSON.parse(clientData);

  if (+otp !== +req.body.otp) return next(new AppError("invalid otp ", 400));
  // we should create account for user (role=patient) + patientProfile
  ///////////////////////
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const newUser = new User({
      firstName,
      lastName,
      gender,
      birthDate,
      phone,
      password,
      isPreHashed: true,
    });
    await newUser.save({ session });
    await PatientProfile.create([{ user: newUser._id }], { session });
    await session.commitTransaction();
    session.endSession();
    await client.del(`signUp:${phone}`);
    const actions = [
      { user: newUser._id, action: ACTIONS.SIGNUP },
      { user: newUser._id, action: ACTIONS.CREATE_PATIENT_USER },
    ];
    await Activity.insertMany(actions);
    createSendToken(newUser, 201, res);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new AppError(err.message, 400));
  }
});
export const login = catchAsync(async (req, res, next) => {
  const { phone, password } = req.body;
  const user = await User.findOne({ phone }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError("invalid phone or password", 401));
  if (!user.active) return next(new AppError("User not active"));
  await Activity.create({user:user._id,action: ACTIONS.LOGIN})
  createSendToken(user, 200, res);
});
//* //////////////////////////Move restrictTo is middleware not controller ////
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "you do not have thee permission to perform this action ",
          401,
        ),
      );
    }
    next();
  };
};
export const forgetpassword = catchAsync(async (req, res, next) => {
  const { phone } = req.body;
  const user = await User.findOne({ phone });
  if (!user) {
    return next(new AppError("user not found", 404));
  }
  const otp = Math.floor(100000 + Math.random() * 900000);

  await client.set(
    `forgetPassword:${phone}`,
    JSON.stringify({
      otp,
      verified: false,
      attempts: 0,
    }),
    { EX: 300 },
  );
  if (process.env.NODE_ENV === "development") {
    console.log("OTP:", otp);
  } else {
    // await sendOTP(phone, otp);
    console.log("OTP:", otp);
  }
  res.status(200).json({
    status: "success",
    message: "check your phone SMS we send OTP verification to you",
    phone,
    otp,
  });
});
export const verifyForgetPassword = catchAsync(async (req, res, next) => {
  const { phone, otp } = req.body;
  const data = await client.get(`forgetPassword:${phone}`);

  if (!data) {
    return next(new AppError("OTP expired", 400));
  }

  const parsed = JSON.parse(data);

  if (parsed.attempts >= 3) {
    await client.del(`forgetPassword:${phone}`);
    return next(new AppError("Too many attempts", 429));
  }

  if (parsed.otp !== +otp) {
    parsed.attempts += 1;

    await client.set(`forgetPassword:${phone}`, JSON.stringify(parsed), {
      EX: 300,
    });

    return next(new AppError("Invalid OTP", 400));
  }

  parsed.verified = true;

  await client.set(`forgetPassword:${phone}`, JSON.stringify(parsed), {
    EX: 300,
  });
  res.status(200).json({
    status: "success",
    phone,
  });
});
export const resetPassword = catchAsync(async (req, res, next) => {
  const { phone, password } = req.body;

  const data = await client.get(`forgetPassword:${phone}`);

  if (!data) {
    return next(new AppError("OTP expired", 400));
  }

  const parsed = JSON.parse(data);

  if (!parsed.verified) {
    return next(new AppError("OTP not verified", 401));
  }

  const user = await User.findOne({ phone });

  if (!user) {
    return next(new AppError("user not found", 404));
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  user.password = hashedPassword;
  await user.save();

  await client.del(`forgetPassword:${phone}`);
  await Activity.create({user:user._id,action: ACTIONS.RESET_PASSWORD})
  createSendToken(user, 200, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  if (!user || !(await user.correctPassword(req.body.password, user.password)))
    return next(new AppError("the password or phone is not correct", 401));
  const hashedPassword = await bcrypt.hash(req.body.newpassword, 12);
  user.password = hashedPassword;
  await user.save();
  await Activity.create({user:user._id,action: ACTIONS.UPDATE_PASSWORD})
  res.status(200).json({
    status: "success",
    message: "password change successfuly",
  });
});
