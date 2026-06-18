import { deleteOne, getOne, updateOne, getAll } from "./handelerFactory.js";
import User from "../models/userModel.js";
import DoctorProfile from "../models/doctorProfileModel.js";
import PatientProfile from "../models/patientProfileModel.js";
import Receptionist from "../models/receptionistModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import ImageKit from "imagekit";
import sharp from "sharp";
import mongoose from "mongoose";
export const getOneUser = getOne(User);
export const getAllUsers = getAll(User);

import imagekit from "../config/imagekit.js";
import { processImage } from "../utils/imageService.js";

export const uploadSingleToImageKit = (folder) =>
  catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    const fileName = `${folder}-${Date.now()}.jpeg`;

    const buffer = await processImage(req.file.buffer);

    const uploaded = await imagekit.upload({
      file: buffer.toString("base64"),
      fileName,
      folder: `/${folder}`,
    });

    req.file.url = uploaded.url;

    next();
  });

export const changeUserActive = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("+active");
  if (!user) {
    return next(new AppError("user not found", 404));
  }
  user.active = !user.active;
  await user.save({ validateBeforeSave: false });
  res.status(204).json({
    status: "success",
  });
});

export const getMyProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("user not found", 404));
  }

  const profileModels = {
    doctor: DoctorProfile,
    patient: PatientProfile,
    receptionist: Receptionist,
  };

  const Model = user.role !== "admin" ? profileModels[user.role] : null;

  const profile = Model ? await Model.findOne({ user: user._id }) : null;

  res.status(200).json({
    status: "success",
    data: {
      user,
      profile,
    },
  });
});

/////////////////////

const filterObj = function (obj, ...fields) {
  const newobj = {};
  Object.keys(obj).forEach((el) => {
    if (fields.includes(el)) {
      newobj[el] = obj[el];
    }
  });
  return newobj;
};

///////////////////////
export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.confirmpassword)
    return next(
      new AppError(
        "you can not update your password on this route please use update password",
        400,
      ),
    );

  // 1. خذ البيانات العادية
  const updateObj = filterObj(req.body, "firstName", "lastName");

  // 2. ضيف الصورة لو موجودة
  if (req.file?.url) {
    updateObj.photo = req.file.url;
  }

  // 3. update user
  const updateUser = await User.findByIdAndUpdate(req.user.id, updateObj, {
    returnDocument: 'after',
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: updateUser,
  });
});
