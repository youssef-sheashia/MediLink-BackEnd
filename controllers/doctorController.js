// controllers/doctorController.js
import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";
import DoctorProfile from "../models/doctorProfileModel.js";
import { APIFeatures } from "../utils/apiFeatures.js";

// ─── Admin: Create doctor ─────────────────────────────────────────────────────

/**
 * POST /api/v1/doctors
 * Admin only — creates User (role: doctor) + DoctorProfile in one atomic session.
 */
export const createDoctor = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    phone,
    password,
    confirmPassword,
    gender,
    birthDate,
    specialization,
    experienceYears,
    workingDays,
    startTime,
    endTime,
  } = req.body;

  if (password !== confirmPassword)
    return next(new AppError("passwords do not match", 400));

  // 2) Phone uniqueness check
  const existingUser = await User.findOne({ phone });
  if (existingUser)
    return next(new AppError("phone number already in use", 400));

  // 3) Open a Mongoose session for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 4) Create the User inside the session
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
          role: "doctor",
        },
      ],
      { session },
    );

    // 5) Create the DoctorProfile linked to the new user
    const [profile] = await DoctorProfile.create(
      [
        {
          user: user._id,
          specialization,
          experienceYears,
          workingDays,
          startTime,
          endTime,
        },
      ],
      { session },
    );

    // 6) Commit — both documents are saved together or not at all
    await session.commitTransaction();
    session.endSession();

    // 7) Hide password from response
    user.password = undefined;

    res.status(201).json({
      status: "success",
      data: { user, profile },
    });
  } catch (err) {
    // If anything fails, roll back both creates
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
});

// ─── Public: Get all doctors ──────────────────────────────────────────────────

/**
 * GET /api/v1/doctors
 * Public — list all doctors with filtering, sorting, pagination via APIFeatures.
 */
export const getAllDoctors = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    phone,
    specialization,
    experienceYears,
    page = 1,
    limit = 10,
  } = req.query;

  const matchStage = {};
  if (specialization)
    matchStage.specialization = new RegExp(specialization, "i");
  if (experienceYears)
    matchStage.experienceYears = new RegExp(experienceYears, "i");

  const userMatchStage = {};
  if (firstName) userMatchStage["user.firstName"] = new RegExp(firstName, "i");
  if (lastName) userMatchStage["user.lastName"] = new RegExp(lastName, "i");
  if (phone) userMatchStage["user.phone"] = new RegExp(phone, "i");

  const skip = (Number(page) - 1) * Number(limit);

  const doctors = await DoctorProfile.aggregate([
    // 1) filter on profile fields first (faster — reduces docs before join)
    { $match: matchStage },

    // 2) join with users collection
    {
      $lookup: {
        from: "users", // MongoDB collection name (lowercase plural)
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },

    // 3) flatten the user array into a single object
    { $unwind: "$user" },

    // 4) filter on user fields (firstName, lastName)
    { $match: userMatchStage },

    // 5) hide sensitive user fields
    {
      $project: {
        specialization: 1,
        experienceYears: 1,
        workingDays: 1,
        startTime: 1,
        endTime: 1,
        "user.firstName": 1,
        "user.lastName": 1,
        "user.phone": 1,
        "user.photo": 1,
        "user.gender": 1,
        "user.birthDate": 1,
      },
    },

    // 6) pagination
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  res.status(200).json({
    status: "success",
    results: doctors.length,
    data: { doctors },
  });
});

// ─── Public: Get one doctor ───────────────────────────────────────────────────

/**
 * GET /api/v1/doctors/:id
 * Public — get a single doctor profile by DoctorProfile _id.
 */
export const getDoctor = catchAsync(async (req, res, next) => {
  const doctor = await DoctorProfile.findById(req.params.id).populate({
    path: "user",
    select: "firstName lastName phone photo gender birthDate",
  });

  if (!doctor) return next(new AppError("doctor not found", 404));

  res.status(200).json({
    status: "success",
    data: { doctor },
  });
});

// ─── Admin: Update any doctor ─────────────────────────────────────────────────

/**
 * PATCH /api/v1/doctors/:id
 * Admin — can update both profile fields and the linked user fields.
 */
export const updateDoctor = catchAsync(async (req, res, next) => {
  delete req.body.user;

  const updatedDoctor = await DoctorProfile.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedDoctor) {
    return next(new AppError("Doctor not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      doctor: updatedDoctor,
    },
  });
});

// ─── Admin: Delete doctor ─────────────────────────────────────────────────────

/**
 * DELETE /api/v1/doctors/:id
 * Admin — soft delete: deactivate the user and demote role back to patient.
 * Never hard-delete — medical records must stay intact.
 */

export const deleteDoctor = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const profile = await DoctorProfile.findByIdAndDelete(req.params.id, {
      session,
    });

    if (!profile) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Doctor not found", 404));
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

export const searchUserByPhone = catchAsync(async (req, res, next) => {
  const { phone } = req.query;
  if (!phone) return next(new AppError("phone query param is required", 400));

  const user = await User.findOne({ phone }).select(
    "firstName lastName phone role gender birthDate",
  );
  if (!user) return next(new AppError("no user found", 404));

  res.status(200).json({
    status: "success",
    data: { user },
  });
});
