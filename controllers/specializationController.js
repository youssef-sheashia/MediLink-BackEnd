// controllers/doctorController.js
import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Specialization from "../models/specializationModel.js";
import { APIFeatures } from "../utils/apiFeatures.js";

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
      $project: {
        name: 1,
        consultationFee: 1,
        doctorCount: { $size: "$doctors" },
        //* add appointmentCount when it ready 
      },
    },
  ]);

  res.status(200).json({ status: "success", data: { specializations } });
});

export const createSpecialization = catchAsync(async (req, res, next) => {
  const { name, consultationFee } = req.body;
  let existingSpecialization = await Specialization.findOne({ name });
  if (existingSpecialization) {
    return next(new AppError("Specialization with this name already exists", 400));
  }
  const specialization = await Specialization.create({ name, consultationFee });

  res.status(201).json({
    status: "success",
    data: { specialization },
  });
});

export const updateSpecialization = catchAsync(async (req, res, next) => {
  if(!mongoose.Types.ObjectId.isValid(req.params.id)){
    return next(new AppError("Invalid specialization ID", 400));
  }
  const { name, consultationFee } = req.body;
  let existingSpecialization = await Specialization.findOne({ _id: req.params.id });
  if (!existingSpecialization) {
    return next(new AppError("Specialization not found", 404));
  }
  const specialization = await Specialization.findByIdAndUpdate(
    { _id: req.params.id },
    { name, consultationFee },
    {
      new: true,
      runValidators: true,
    }
  );


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
  if (!specialization) return next(new AppError("Specialization not found", 404));

  const { modifiedCount } = await DoctorProfile.updateMany(
    { specialization: specialization._id },
    { specialization: null }
  );

  await specialization.deleteOne();

  res.status(200).json({
    status: "success",
    message: `Specialization deleted. ${modifiedCount} doctor(s) now have no specialization.`,
    data: null,
  });
});


