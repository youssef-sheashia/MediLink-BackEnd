import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";
import client from "../config/redis.js";
import sendOTP from "../utils/sendOTP.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    await sendOTP(phone, otp);
  }
  res.status(200).json({
    status: "success",
    message: "check your phone SMS we send OTP verification to you",
    phone,
  });
});
export const verifyOTP = catchAsync(async (req, res, next) => {
  const clientData = await client.get(`signUp:${req.body.phone}`);
  if (!clientData)
    return next(new AppError("OTP expired, please request a new one", 400));
  const { firstName, lastName, gender, birthDate, phone, password, otp } =
    JSON.parse(clientData);

  if (+otp !== +req.body.otp) return next(new AppError("invalid otp ", 400));
  const newUser = new User({
    firstName,
    lastName,
    gender,
    birthDate,
    phone,
    password,
    isPreHashed: true,
  });
  await newUser.save();
  await client.del(`signUp:${phone}`);
  res.status(201).json({
    status: "success",
    message: "account created successfully",
    data: {
      user: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        gender: newUser.gender,
        birthDate: newUser.birthDate,
        role: newUser.role,
      },
    },
  });
});
export const login = catchAsync(async (req, res, next) => {
  const { phone, password } = req.body;
  const user = await User.findOne({ phone }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError("invalid phone or password", 401));
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  user.password = undefined;
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
    token,
  });
});
