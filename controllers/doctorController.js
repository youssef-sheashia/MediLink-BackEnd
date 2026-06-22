import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";
import DoctorProfile from "../models/doctorProfileModel.js";
import Appointment from "../models/appointmentModel.js";
import Clinic from "../models/clinicModel.js";
import flattenAndRespond from "../utils/flattenAndRespond.js";
import bcrypt from "bcryptjs";
import { ACTIONS } from "../constant/activities.js";
import Activity from "../models/activitiesModel.js";
// ============================================================
// HELPER FUNCTIONS (used only inside this file)
// ============================================================

const DAY_NAMES = [
  "الاحد",
  "الاثنين",
  "الثلاثاء",
  "الاربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

function getDayName(date) {
  return DAY_NAMES[date.getDay()];
}

function generateSlots(startTime, endTime, duration) {
  const slots = [];

  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  let current = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;

  while (current + duration <= end) {
    const hours = Math.floor(current / 60);
    const minutes = current % 60;
    const formatted =
      String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");

    slots.push(formatted);
    current += duration;
  }

  return slots;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ============================================================
// CONTROLLERS
// ============================================================

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

  if (
    new Date().getFullYear() - new Date(birthDate).getFullYear() - 27 <=
    +experienceYears
  )
    return next(
      new AppError(
        "experience years should be less than your age minus 27 years",
        400,
      ),
    );

  if (password !== confirmPassword)
    return next(new AppError("passwords do not match", 400));

  const existingUser = await User.findOne({ phone });
  if (existingUser)
    return next(new AppError("phone number already in use", 400));

  const hashedPassword = await bcrypt.hash(password, 12);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [user] = await User.create(
      [
        {
          firstName,
          lastName,
          phone,
          password: hashedPassword,
          gender,
          birthDate,
          role: "doctor",
        },
      ],
      { session },
    );

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

    await session.commitTransaction();
    session.endSession();

    user.password = undefined;
    await Activity.create({ user: user._id, action: ACTIONS.CREATE_DOCTOR });
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

export const getAllDoctors = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    phone,
    experienceYears,
    page = 1,
    limit = 20,
  } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const userMatchStage = {};
  if (firstName) userMatchStage["user.firstName"] = new RegExp(firstName, "i");
  if (lastName) userMatchStage["user.lastName"] = new RegExp(lastName, "i");
  if (phone) userMatchStage["user.phone"] = new RegExp(phone, "i");

  const doctors = await DoctorProfile.aggregate([
    // بنجيب بيانات الـ user من جدول users
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    // بنجيب بيانات التخصص من جدول specializations
    {
      $lookup: {
        from: "specializations",
        localField: "specialization",
        foreignField: "_id",
        as: "specialization",
      },
    },
    { $unwind: { path: "$specialization", preserveNullAndEmptyArrays: true } },
    { $match: userMatchStage },
    {
      $match: experienceYears
        ? { experienceYears: Number(experienceYears) }
        : {},
    },
    {
      $lookup: {
        from: "appointments",
        let: { doctorUserId: "$user._id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$doctor", "$$doctorUserId"] },
                  { $eq: ["$status", "مكتمل"] },
                ],
              },
            },
          },
        ],
        as: "completedAppointments",
      },
    },

    {
      $addFields: {
        completedAppointmentsCount: { $size: "$completedAppointments" },
      },
    },
    {
      $project: {
        experienceYears: 1,
        workingDays: 1,
        startTime: 1,
        endTime: 1,
        specialization: 1,
        ratingsAverage: 1,
        ratingsCount: 1,
        completedAppointmentsCount:1,
        "user.firstName": 1,
        "user.lastName": 1,
        "user.phone": 1,
        "user.photo": 1,
        "user.gender": 1,
        "user.birthDate": 1,
        "user._id": 1,
        "user.active": 1,
        "user.notes": 1,
      },
    },
    { $sort: { _id: 1 } },
    { $skip: skip },
    { $limit: Number(limit) },
  ]);

  const flattened = doctors.map((doc) => ({
    ...doc,
    ...doc.user,
    user: undefined,
  }));
  console.log(flattened);
  res.status(200).json({
    status: "success",
    length: flattened.length,
    data: { doctors: flattened },
  });
});

export const getDoctor = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return next(new AppError("Invalid doctor ID", 400));

  const doctor = await DoctorProfile.findOne({ user: req.params.id });

  if (!doctor) return next(new AppError("doctor not found", 404));

  res.status(200).json({
    status: "success",
    data: { doctor },
  });
});
export const updateDoctor = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError("Invalid doctor ID", 400));
  }

  delete req.body.user;

  // Separate User fields from DoctorProfile fields
  const {
    firstName,
    lastName,
    gender,
    birthDate,
    photo,
    notes,
    ...profileUpdates
  } = req.body;
  const userUpdates = {};
  if (firstName) userUpdates.firstName = firstName;
  if (lastName) userUpdates.lastName = lastName;
  if (gender) userUpdates.gender = gender;
  if (birthDate) userUpdates.birthDate = birthDate;
  if (photo) userUpdates.photo = photo;
  if (notes) userUpdates.notes = notes;
  // Protect calculated fields
  delete profileUpdates.ratingsAverage;
  delete profileUpdates.ratingsCount;
  delete profileUpdates.averageRating;
  delete profileUpdates.totalRatings;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Update DoctorProfile
    const updatedDoctor = await DoctorProfile.findOneAndUpdate(
      { user: req.params.id },
      profileUpdates,
      { returnDocument: "after", runValidators: true, session },
    );
    if (!updatedDoctor) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Doctor not found", 404));
    }

    // 2. Update User fields if any were provided
    if (Object.keys(userUpdates).length > 0) {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        userUpdates,
        { new: true, runValidators: true, session },
      );
      if (!updatedUser) {
        await session.abortTransaction();
        session.endSession();
        return next(new AppError("User not found", 404));
      }
    }

    await session.commitTransaction();
    session.endSession();

    // 3. Re-fetch with pre(/^find/) population applied
    const populated = await DoctorProfile.findOne({ user: req.params.id });
    await Activity.create({
      user: user._id,
      action: ACTIONS.UPDATE_DOCTOR_PROFILE,
    });
    res.status(200).json({
      status: "success",
      data: { doctor: populated },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(new AppError("Update failed, transaction rolled back", 500));
  }
});

export const deleteDoctor = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const profile = await DoctorProfile.findOneAndDelete(
      { user: req.params.id },
      { session },
    );

    if (!profile) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Doctor not found", 404));
    }

    await User.findByIdAndUpdate(
      profile.user,
      { active: false, role: "patient" },
      { session, runValidators: true },
    );

    await session.commitTransaction();
    session.endSession();
    await Activity.create({
      user: user._id,
      action: ACTIONS.MAKE_DOCTOR_UNACTIVE,
    });
    res.status(204).json({ status: "success" });
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

export const getAvailableSlots = catchAsync(async (req, res, next) => {
  const doctorId = req.params.id;
  console.log("Getting available slots for doctor ID:", doctorId);
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return next(new AppError("Invalid doctor ID", 400));
  }
  const doctor = await DoctorProfile.findOne({ user: doctorId });
  if (!doctor) return next(new AppError("Doctor not found", 404));

  const clinic = await Clinic.findOne();
  if (!clinic) return next(new AppError("Clinic not found", 404));

  const duration = clinic.schedule.appointmentDuration;

  const next7Dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    next7Dates.push(date);
  }

  const workingDates = next7Dates.filter((date) => {
    const dayName = getDayName(date);
    return doctor.workingDays.includes(dayName);
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    date: { $gte: startOfToday, $lte: endOfWeek },
    status: { $ne: "ملغى" },
  }).select("date slotTime");

  const result = workingDates.map((date) => {
    const dateString = formatDate(date);

    const allSlots = generateSlots(doctor.startTime, doctor.endTime, duration);

    const bookedSlotsForThisDay = bookedAppointments
      .filter((appt) => formatDate(new Date(appt.date)) === dateString)
      .map((appt) => appt.slotTime);

    const slots = allSlots.map((slot) => ({
      time: slot,
      status: bookedSlotsForThisDay.includes(slot) ? "محجوز" : "متاح",
    }));
    return {
      date: dateString,
      day: getDayName(date),
      slots,
    };
  });

  res.status(200).json({
    status: "success",
    data: { slots: result },
  });
});
