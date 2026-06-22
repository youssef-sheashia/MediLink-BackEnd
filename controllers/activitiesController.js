import Activity from "../models/activitiesModel.js";
import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import mongoose from "mongoose";
import { APIFeatures } from "../utils/apiFeatures.js";
import AppError from "../utils/appError.js";
export const getAllActivities = catchAsync(async (req, res, next) => {
  let activities = new APIFeatures(Activity.find().populate({ path: "user", select: "firstName lastName role" }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const data = await activities.query;

  res.status(200).json({
    status: "success",
    results: data.length,
    data: {
      data,
    },
  });
});

export const getActivitiesByUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("Invalid id", 400));

  const user = await User.findOne({ _id: id });
  if (!user) return next(new AppError("user not found", 404));
  
  const { page = 1, limit = 20 } = req.query;

  const activities = await Activity.find({ user: id })
    .populate({path:"user",select:"firstName lastName role"})
    .sort("-createdAt")
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.status(200).json({
    status: "success",
    results: activities.length,
    data: {
      activities,
    },
  });
});
