import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";
import PatientProfile from "../models/patientProfileModel.js";
import { APIFeatures } from "../utils/apiFeatures.js";
import imagekit from "../config/imagekit.js";
import { processImage } from "../utils/imageService.js";

export const completeMyProfile = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const profile = await PatientProfile.findOne({ user: userId });
  if (!profile) return next(new AppError("patient profile not found", 404));

  // allowed fields from body
  const {
    bloodType,
    tall,
    weight,
    chronicMedications,
    allergies,
    chronicConditions,
  } = req.body;

  if (bloodType) profile.bloodType = bloodType;
  if (tall) profile.tall = tall;
  if (weight) profile.weight = weight;
  if (chronicMedications) profile.chronicMedications = chronicMedications;
  if (allergies) profile.allergies = allergies;
  if (chronicConditions) profile.chronicConditions = chronicConditions;

  // if files were uploaded — append them to existing medicalFiles
  if (req.uploadedFiles && req.uploadedFiles.length > 0) {
    profile.medicalFiles.push(...req.uploadedFiles);
  }

  await profile.save();

  res.status(200).json({
    status: "success",
    data: { profile },
  });
});

export const getPatientById = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return next(new AppError("invalid patient ID", 400));

  const result = await PatientProfile.aggregate([
    // 1) match the specific profile first
    {
      $match: { _id: new mongoose.Types.ObjectId(req.params.id) },
    },

    // 2) join with users collection (lowercase plural — mongodb collection name)
    {
      $lookup: {
        from: "users", // ← "User" is wrong, mongodb stores it as "users"
        localField: "user",
        foreignField: "_id",
        as: "user", // ← "as" was missing
      },
    },

    // 3) flatten user array into a single object
    { $unwind: "$user" },

    // 4) check active here — bypasses the pre hook completely
    {
      $match: { "user.active": { $ne: false } },
    },

    // 5) hide sensitive fields
    {
      $project: {
        "user.password": 0,
        "user.active": 0,
        "user.__v": 0,
        "user.passwordChangedAt": 0,
        "user.passwordResetToken": 0,
        "user.passwordResetExpires": 0,
      },
    },
  ]);

  // aggregate always returns an array
  if (!result.length)
    return next(
      new AppError("patient not found or account is deactivated", 404),
    );

  res.status(200).json({
    status: "success",
    data: { patient: result[0] },
  });
});

//////////////////////////

export const getAllPatients = catchAsync(async (req, res, next) => {
  const { role: _, ...safeQuery } = req.query;

  const baseQuery = PatientProfile.find().populate({
    path: "user",
    select:
      "-password  -__v -passwordChangedAt -passwordResetToken -passwordResetExpires -role",
  });

  const features = new APIFeatures(baseQuery, safeQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const patients = await features.query;

  res.status(200).json({
    status: "success",
    results: patients.length,
    data: { patients },
  });
});

export const deleteManyPatients = catchAsync(async (req, res, next) => {
  const { ids } = req.body; // expects { "ids": ["id1", "id2", "id3"] }

  // 1) validate ids array exists and is not empty
  if (!ids || !Array.isArray(ids) || ids.length === 0)
    return next(new AppError("please provide an array of patient IDs", 400));

  // 2) validate each id
  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0)
    return next(new AppError(`invalid IDs: ${invalidIds.join(", ")}`, 400));

  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

  // 3) find all matching patients — bypass pre hook with collection
  const patients = await User.collection
    .find({
      _id: { $in: objectIds },
      role: "patient",
    })
    .toArray();

  // 4) check all ids were found
  if (patients.length === 0)
    return next(new AppError("no patients found with the provided IDs", 404));

  // 5) separate already deactivated from active
  const alreadyDeactivated = patients.filter((p) => !p.active);
  const toDeactivate = patients.filter((p) => p.active);

  if (toDeactivate.length === 0)
    return next(
      new AppError("all provided patients are already deactivated", 400),
    );

  // 6) soft delete all active ones in one query
  const toDeactivateIds = toDeactivate.map((p) => p._id);
  await User.collection.updateMany(
    { _id: { $in: toDeactivateIds } },
    { $set: { active: false } },
  );

  res.status(200).json({
    status: "success",
    message: `${toDeactivate.length} patient(s) deactivated successfully`,
    data: {
      deactivated: toDeactivate.length,
      // tell the admin which ids were already deactivated before this request
      ...(alreadyDeactivated.length > 0 && {
        alreadyDeactivated: alreadyDeactivated.map((p) => p._id),
      }),
      // tell the admin which ids weren't found at all
      ...(patients.length !== ids.length && {
        notFound: ids.filter((id) => !patients.find((p) => p._id.equals(id))),
      }),
    },
  });
});

export const deletePatient = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("invalid patient ID", 400));

  // use collection directly to bypass the pre /^find/ hook
  const patient = await User.collection.findOne({
    _id: new mongoose.Types.ObjectId(id),
    role: "patient",
  });

  if (!patient) return next(new AppError("patient not found", 404));

  if (!patient.active)
    return next(new AppError("patient is already deactivated", 400));

  // soft delete — single update, no session needed
  await User.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: { active: false } },
  );

  res.status(204).json({ status: "success" });
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
