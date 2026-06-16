import catchAsync from "../utils/catchAsync.js";
import mongoose from "mongoose";
import Prescription from "../models/prescriptionModel.js";

export const createPrescription = catchAsync(async (req, res, next) => {
  const prescription = await Prescription.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      prescription,
    },
  });
});
export const getPrescriptionsByPatient = catchAsync(async (req, res, next) => {
  const {patientId} = req.params;
  if(!mongoose.Types.ObjectId.isValid(patientId))
    return next(new AppError('invalid patient id',400));
    
  const patientExists = await User.exists({ _id: patientId, role: "patient" });
  if (!patientExists)
    return next(new AppError("no patient found with this id", 404));
  
  const prescriptions = await Prescription.find({ patient: patientId });
  res.status(200).json({
    status: "success",
    results: prescriptions.length,
    data: {
      prescriptions,
    },
  });
})