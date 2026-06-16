import catchAsync from "../utils/catchAsync.js";
import MedicalReport from "../models/medicalReportModel.js";
import mongoose from "mongoose";
export const createMedicalReport = catchAsync(async (req, res, next) => {
  const medicalReport = await MedicalReport.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      medicalReport,
    },
  });
});
export const getMedicalReportsForPatient = catchAsync(async (req, res, next) => {
  const {patientId} = req.params;
  
  if(!mongoose.Types.ObjectId.isValid(patientId))
    return next(new AppError('invalid patient id',400));
  
  const patientExists = await User.exists({ _id: patientId, role: "patient" });
  if (!patientExists)
    return next(new AppError("no patient found with this id", 404));

  const medicalReports = await MedicalReport.find({ patient: patientId });
  res.status(200).json({
    status: "success",
    data: {
      medicalReports,
    },
  });
});