import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";
import { APIFeatures } from "../utils/apiFeatures.js";

export const getAllPatients = catchAsync(async (req, res, next) => {
  const { role: _, ...safeQuery } = req.query;

  const features = new APIFeatures(
    User.find({ role: "patient" }).select("-password"),
    safeQuery,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // re-apply role after APIFeatures runs to guarantee it
  features.query = features.query.where({ role: "patient" });

  const patients = await features.query;

  res.status(200).json({
    status: "success",
    results: patients.length,
    data: { patients },
  });
});
export const getPateintById = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError("Invalid patient ID", 400));
  }
  const pateint = await User.findOne({ _id: req.params.id, role: "patient" });
  if (!pateint) {
    return next(new AppError("Patient not found", 404));
  }
  res.status(200).json({ status: "success", data: { pateint } });
});
export const deletePateint = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError("Invalid patient ID", 400));
  }
  const pateint = await User.findOne({ _id: req.params.id, role: "patient" });
  if (!pateint) {
    return next(new AppError("Patient not found", 404));
  }
  await pateint.deleteOne();
  res
    .status(200)
    .json({ status: "success", message: "Patient deleted successfully" });
});
export const changeActiveStatus = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError("Invalid patient ID", 400));
  }
  const pateint = await User.findOne({ _id: req.params.id, role: "patient" });
  if (!pateint) {
    return next(new AppError("Patient not found", 404));
  }
  pateint.active = !pateint.active;
  await pateint.save();
  res.status(200).json({
    status: "success",
    message: `Patient is now ${pateint.active ? "active" : "inactive"}`,
  });
});
export const deleteManyPateints = catchAsync(async (req, res, next) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new AppError("Please provide an array of patient IDs", 400));
  }
  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return next(
      new AppError(`Invalid patient IDs: ${invalidIds.join(", ")}`, 400),
    );
  }
  const result = await User.deleteMany({ _id: { $in: ids }, role: "patient" });
  res.status(200).json({
    status: "success",
    message: `${result.deletedCount} patients deleted successfully`,
  });
});
