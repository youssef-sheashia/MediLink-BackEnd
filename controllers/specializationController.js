// controllers/doctorController.js
import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Specialization from "../models/specializationModel.js";
import { APIFeatures } from "../utils/apiFeatures.js";
import DoctorProfile from "../models/doctorProfileModel.js";
import { ACTIONS } from "../constant/activities.js";
import Activity from "../models/activitiesModel.js";
export const getAllSpecializations = catchAsync(async (req, res, next) => {
  const specializations = await Specialization.aggregate([
    {
      $lookup: {
        from: "doctorprofiles",
        localField: "_id",
        foreignField: "specialization",
        as: "doctors",
      },
    },
    {
      $lookup: {
        from: "appointments",
        localField: "doctors.user",
        foreignField: "doctor",
        as: "appointments",
      },
    },
    {
      $project: {
        name: 1,
        consultationFee: 1,
        doctorsCount: { $size: "$doctors" },
        appointmentsCount: { $size: "$appointments" },
      },
    },

    { $sort: { name: 1 } },
  ]);

  res.status(200).json({
    status: "success",
    length: specializations.length,
    data: { specializations },
  });
});

export const createSpecialization = catchAsync(async (req, res, next) => {
  const { name, consultationFee } = req.body;
  let existingSpecialization = await Specialization.findOne({ name });
  if (existingSpecialization) {
    return next(
      new AppError("Specialization with this name already exists", 400),
    );
  }
  const specialization = await Specialization.create({ name, consultationFee });
    await Activity.create({user:req.user._id,action: ACTIONS.CREATE_SPECIALIZATION});

  res.status(201).json({
    status: "success",
    data: { specialization },
  });
});

export const updateSpecialization = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError("Invalid specialization ID", 400));
  }
  const { name, consultationFee } = req.body;
  let existingSpecialization = await Specialization.findOne({
    _id: req.params.id,
  });
  if (!existingSpecialization) {
    return next(new AppError("Specialization not found", 404));
  }
  const specialization = await Specialization.findByIdAndUpdate(
    { _id: req.params.id },
    { name, consultationFee },
    {
      returnDocument: 'after',
      runValidators: true,
    },
  );
      await Activity.create({user:req.user._id,action: ACTIONS.UPDATE_SPECIALIZATION});

  res.status(200).json({
    status: "success",
    data: { specialization },
  });
});

export const deleteSpecialization = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError("Invalid specialization ID", 400));
  }

  const specialization = await Specialization.findById(req.params.id);
  if (!specialization)
    return next(new AppError("Specialization not found", 404));

  const { modifiedCount } = await DoctorProfile.updateMany(
    { specialization: specialization._id },
    { specialization: null },
  );

  await specialization.deleteOne();
        await Activity.create({user:req.user._id,action: ACTIONS.DELETE_SPECIALIZATION});

  res.status(200).json({
    status: "success",
    message: `Specialization deleted. ${modifiedCount} doctor(s) now have no specialization.`,
    data: null,
  });
});

export const getDoctorsBySpecialization = catchAsync(async (req, res, next) => {
  const  specializationId  = req.params.id;
  const { search, page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(specializationId))
    return next(new AppError("invalid specialization id", 400));

  const specializationExists = await Specialization.exists({ _id: specializationId });
  if (!specializationExists)
    return next(new AppError("no specialization found with this id", 404));

  const doctors = await DoctorProfile.aggregate([
    {
      $match: {
        specialization: new mongoose.Types.ObjectId(specializationId),
      },
    },
    {
      $lookup: {
        from: "users",
        let: { userId: "$user" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$userId"] },
              role: "doctor",
            },
          },
          {
            $project: {
              firstName: 1,
              lastName: 1,
              photo: 1,
            },
          },
        ],
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "reviews",
        localField: "user._id",
        foreignField: "doctor",
        as: "reviews",
      },
    },
    ...(search
      ? [
          {
            $match: {
              $or: [
                { "user.firstName": { $regex: search, $options: "i" } },
                { "user.lastName": { $regex: search, $options: "i" } },
              ],
            },
          },
        ]
      : []),

    {
      $project: {
        _id: 0,
        doctorProfileId: "$_id",
        userId: "$user._id",
        firstName: "$user.firstName",
        lastName: "$user.lastName",
        photo: "$user.photo",
        experienceYears: 1,
        averageRating: {
          $cond: {
            if: { $gt: [{ $size: "$reviews" }, 0] },
            then: { $round: [{ $avg: "$reviews.stars" }, 1] },
            else: 0,
          },
        },
        totalReviews: { $size: "$reviews" },
      },
    },

    { $sort: { averageRating: -1 } },
    { $skip: (Number(page) - 1) * Number(limit) },
    { $limit: Number(limit) },
  ]);

  res.status(200).json({
    status: "success",
    length: doctors.length,
    data: { doctors },
  });
});