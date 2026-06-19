import Receptionist from "../models/receptionistModel.js";
import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";
import { APIFeatures } from "../utils/apiFeatures.js";
import flattenAndRespond from "../utils/flattenAndRespond.js";
export const createReceptionist = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    phone,
    password,
    confirmPassword,
    gender,
    status,
    birthDate,
    education,
    workingDays,
    startTime,
    endTime,
  } = req.body;

  const existingUser = await User.findOne({ phone });
  if (existingUser)
    return next(new AppError("phone number already in use", 400));

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [user] = await User.create(
      [
        {
          firstName,
          lastName,
          phone,
          password,
          confirmPassword,
          gender,
          birthDate,
          role: "receptionist",
        },
      ],
      { session },
    );

    const [profile] = await Receptionist.create(
      [
        {
          user: user._id,
          status,
          education,
          workingDays,
          startTime,
          endTime,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    user.password = undefined;

    res.status(201).json({
      status: "success",
      data: { user, profile },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
});
export const getAllReceptionist = catchAsync(async (req, res, next) => {
  const receptionists = await Receptionist.find().populate({
    path: "user",
    select: "-_id",
  });
  flattenAndRespond(res, { key: "receptionists", data: receptionists });
});
export const getReceptionist = catchAsync(async (req, res, next) => {
  const receptionist = await Receptionist.findById(req.params.id).populate({
    path: "user",
    select: "-_id",
  });

  if (!receptionist) return next(new AppError("receptionist not found", 404));

  res.status(200).json({
    status: "success",
    data: { receptionist },
  });
});
export const updateReceptionist = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid Id", 400));
  }
  const receptionistProfile = await Receptionist.findById(id);
  if (!receptionistProfile) {
    return next(new AppError("Receptionist not found", 404));
  }

  const userFields = [
    "firstName",
    "lastName",
    "gender",
    "birthDate",
    "photo",
    "active",
  ];
  const receptionistFields = [
    "education",
    "status",
    "workingDays",
    "startTime",
    "endTime",
  ];

  const userData = {};
  const receptionistData = {};
  Object.keys(req.body).forEach((key) => {
    if (userFields.includes(key)) {
      userData[key] = req.body[key];
    } else if (receptionistFields.includes(key)) {
      receptionistData[key] = req.body[key];
    }
  });

  if (Object.keys(userData).length > 0) {
    //the probelm
    await User.findByIdAndUpdate(receptionistProfile.user, userData, {
      runValidators: true,
    });
  }
  if (Object.keys(receptionistData).length > 0) {
    await Receptionist.updateOne({ _id: id }, receptionistData);
  }

  const updatedReceptionist = await Receptionist.findById(id).populate("user");
  res.status(200).json({
    status: "success",
    data: {
      receptionist: updatedReceptionist,
    },
  });
});

export const deleteReceptionist = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return next(new AppError("Id is not valid", 400));
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const profile = await Receptionist.findByIdAndDelete(req.params.id, {
      session,
    });

    if (!profile) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Receptionist not found", 404));
    }

    await User.findByIdAndUpdate(
      profile.user,
      {
        active: false,
        role: "patient",
      },
      {
        session,
        runValidators: true,
      },
    );

    await session.commitTransaction();
    session.endSession();

    res.status(204).json({
      status: "success",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});
