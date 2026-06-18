import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";
import DoctorProfile from "../models/doctorProfileModel.js";
import Appointment from "../models/appointmentModel.js";
import Clinic from "../models/clinicModel.js";
import flattenAndRespond from "../utils/flattenAndRespond.js";

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

  if (password !== confirmPassword)
    return next(new AppError("passwords do not match", 400));

  const existingUser = await User.findOne({ phone });
  if (existingUser)
    return next(new AppError("phone number already in use", 400));

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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
    limit = 10,
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
      $project: {
        experienceYears: 1,
        workingDays: 1,
        startTime: 1,
        endTime: 1,
        specialization: 1,
        "user.firstName": 1,
        "user.lastName": 1,
        "user.phone": 1,
        "user.photo": 1,
        "user.gender": 1,
        "user.birthDate": 1,
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

  res.status(200).json({
    status: "success",
    length: flattened.length,
    data: { doctors: flattened },
  });
});

export const getDoctor = catchAsync(async (req, res, next) => {
  const doctor = await DoctorProfile.findOne({ user: req.params.id }).lean();

  if (!doctor) return next(new AppError("doctor not found", 404));

  res.status(200).json({
    status: "success",
    data: { doctor },
  });
});

export const updateDoctor = catchAsync(async (req, res, next) => {
  delete req.body.user;

  const updatedDoctor = await DoctorProfile.findOneAndUpdate(
    { user: req.params.id },
    req.body,
    { new: true, runValidators: true },
  );

  if (!updatedDoctor) return next(new AppError("Doctor not found", 404));

  res.status(200).json({
    status: "success",
    data: { doctor: updatedDoctor },
  });
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
// response 
// {
//   "status": "success",
//   "data": {
//     "slots": [
//       { "date": "2026-04-12", "day": "الجمعة",  "availableSlots": ["09:30","10:00","10:30","11:00","01:00","02:30","03:00"] },
//       { "date": "2026-04-13", "day": "السبت",   "availableSlots": ["09:30","10:30","11:30","12:00","12:30","01:00","02:00","02:30","03:00"] },
//       { "date": "2026-04-15", "day": "الاثنين", "availableSlots": ["10:00","11:00","12:00","01:00"] },
//       { "date": "2026-04-16", "day": "الثلاثاء","availableSlots": ["09:30","10:30","11:30"] },
//       { "date": "2026-04-17", "day": "الاربعاء","availableSlots": ["09:30","10:00"] },
//       { "date": "2026-04-18", "day": "الخميس",  "availableSlots": ["09:30","10:00","10:30"] }
//     ]
//   }
// }
