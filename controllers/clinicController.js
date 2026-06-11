import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import Clinic from "../models/clinicModel.js";

export const getClinicInformations = catchAsync(async (req, res, next) => {
  const existingClinic = await Clinic.findOne();
  if (!existingClinic) {
    return res.status(200).json({
      status: "success",
      data: { clinic: null },
    });
  }
  res.status(200).json({
    status: "success",
    data: { clinic: existingClinic },
  });
});

export const updateClinicInformations = catchAsync(async (req, res, next) => {
  let existingClinic = await Clinic.findOne();
  if (!existingClinic) {
    existingClinic = await Clinic.create(req.body);
    return res.status(201).json({
      status: "success",
      data: { clinic: existingClinic },
    });
  }
  const clinic = await Clinic.findOneAndUpdate(
    { _id: existingClinic._id },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );
  res.status(200).json({
    status: "success",
    data: { clinic },
  });
});

export const updateClinicSchedule = catchAsync(async (req, res, next) => {
  let clinic = await Clinic.findOne();
  if (!clinic) return next(new AppError("Clinic not found", 404));

  clinic = await Clinic.findOneAndUpdate(
    { _id: clinic._id },
    { schedule: req.body },
    { new: true, runValidators: true },
  );

  res.status(200).json({
    status: "success",
    data: { schedule: clinic.schedule },
  });
});

export const getClinicSchedule = catchAsync(async (req, res, next) => {
  const clinic = await Clinic.findOne();
  if (!clinic) return next(new AppError("Clinic not found", 404));
  res.status(200).json({
    status: "success",
    data: { schedule: clinic.schedule },
  });
});
