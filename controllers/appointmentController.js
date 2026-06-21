import catchAsync from "../utils/catchAsync.js";
import mongoose from "mongoose";
import { APIFeatures } from "../utils/apiFeatures.js";
import Appointment from "../models/appointmentModel.js";
import Specialization from "../models/specializationModel.js";
import DoctorProfile from "../models/doctorProfileModel.js";
import Clinic from "../models/clinicModel.js";
import User from "../models/userModel.js";
import PatientProfile from "../models/patientProfileModel.js";
import AppError from "../utils/appError.js";
export const getMyAppointments = catchAsync(async (req, res, next) => {
  const { date, startDate, endDate, month, year } = req.validatedQuery;

  let filter = { doctor: req.user._id };

  if (date) {
    // for day date=2026-04-13
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  } else if (startDate && endDate) {
    // week startDate=2026-04-13&endDate=2026-04-19
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  } else if (month && year) {
    // for year month=4&year=2026
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    filter.date = { $gte: start, $lte: end };
  }

  const appointments = await Appointment.find(filter)
    .populate("patient", "firstName lastName phone photo")
    .sort("date slotTime");

  res.status(200).json({
    status: "success",
    results: appointments.length,
    data: { appointments },
  });
});
export const getAllAppointments = catchAsync(async (req, res, next) => {
  const allAppointments = await Appointment.find()
    .populate("patient", "firstName lastName phone photo")
    .populate("doctor", "firstName lastName phone photo");
  res.status(200).json({
    status: "success",
    length: allAppointments.length,
    data: { allAppointments },
  });
});
export const getPatientForDoctor = catchAsync(async (req, res, next) => {
  const doctorId = req.user._id;
  const { search } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const patients = await Appointment.aggregate([
    { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },

    {
      $group: {
        _id: "$patient",
        visitCount: { $sum: 1 },
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "patient",
      },
    },

    { $unwind: "$patient" },

    ...(search
      ? [
          {
            $match: {
              $or: [
                { "patient.firstName": { $regex: search, $options: "i" } },
                { "patient.lastName": { $regex: search, $options: "i" } },
              ],
            },
          },
        ]
      : []),
    {
      $project: {
        _id: 0,
        patientId: "$_id",
        firstName: "$patient.firstName",
        lastName: "$patient.lastName",
        phone: "$patient.phone",
        visitCount: 1,
      },
    },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  res.status(200).json({
    status: "success",
    length: patients.length,
    data: { patients },
  });
});

export const getBookedAppointmentsForPatient = catchAsync(
  async (req, res, next) => {
    const patientId = req.user._id;
    const { search, page = 1, limit = 50 } = req.query;
    if (!mongoose.Types.ObjectId.isValid(patientId))
      return next(new AppError("Invalid id", 400));
    const appointments = await Appointment.aggregate([
      {
        $match: {
          patient: new mongoose.Types.ObjectId(patientId),
        },
      },
      {
        $lookup: {
          from: "users",
          let: { doctorId: "$doctor" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$doctorId"] },
              },
            },
            {
              $project: {
                firstName: 1,
                lastName: 1,
                photo: 1,
              },
            },
          ],
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },

      {
        $lookup: {
          from: "doctorprofiles",
          let: { doctorUserId: "$doctor._id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$user", "$$doctorUserId"] },
              },
            },
            {
              $lookup: {
                from: "specializations",
                localField: "specialization",
                foreignField: "_id",
                as: "specialization",
              },
            },

            {
              $unwind: {
                path: "$specialization",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $project: {
                "specialization.name": 1,
              },
            },
          ],
          as: "doctorProfile",
        },
      },
      {
        $unwind: {
          path: "$doctorProfile",
          preserveNullAndEmptyArrays: true,
        },
      },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { "doctor.firstName": { $regex: search, $options: "i" } },
                  { "doctor.lastName": { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),
      { $sort: { date: -1 } },

      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 1,
          date: 1,
          slotTime: 1,
          status: 1,
          fees: 1,
          cancelledBy: 1,
          "doctor._id": 1,
          "doctor.firstName": 1,
          "doctor.lastName": 1,
          "doctor.photo": 1,
          "doctorProfile.specialization.name": 1,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      length: appointments.length,
      data: { appointments },
    });
  },
);

export const bookAppointmentByPatient = catchAsync(async (req, res, next) => {
  const patientId = req.user.id;
  const { doctorId, date, slotTime, reason } = req.body;

  // 1) validate patient
  const patient = await User.findOne({ _id: patientId, role: "patient" });
  if (!patient) return next(new AppError("patient not found", 404));

  // 2) validate doctor
  const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
  if (!doctor) return next(new AppError("doctor not found", 404));

  // 3) check doctor availability
  const isAvaliable = await isDoctorAvailable(doctorId, date, slotTime);
  if (!isAvaliable)
    return next(new AppError("doctor isn't available in this time", 400));

  // 4) get specialization for fees
  const specialization = await getDoctorSpecialization(doctorId);
  if (!specialization)
    return next(new AppError("doctor has no specialization assigned", 400));

  // 5) get uploaded file urls from ImageKit middleware (req.uploadedFiles)
  const medicalFiles = req.uploadedFiles?.map((f) => f.url) ?? [];

  // 6) create appointment
  const newAppointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    date,
    slotTime,
    fees: specialization.consultationFee,
    reason,
    medicalFiles,
  });

  res.status(201).json({
    status: "success",
    data: { appointment: newAppointment },
  });
});
const getDoctorSpecialization = async (doctorId) => {
  const result = await DoctorProfile.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(doctorId),
      },
    },
    {
      $lookup: {
        from: "specializations",
        localField: "specialization", // ObjectId in doctorprofiles
        foreignField: "_id", // _id in specializations
        as: "specialization",
      },
    },
    {
      $unwind: {
        path: "$specialization",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        specializationId: "$specialization._id",
        specializationName: "$specialization.name",
        consultationFee: "$specialization.consultationFee",
      },
    },
  ]);
  console.log(result[0]);
  return result[0] ?? null;
};
async function isDoctorAvailable(doctorId, date, slotTime) {
  // ── GET CLINIC DURATION FIRST ──────────────────────────────────────────────
  const clinic = await Clinic.findOne(
    {},
    { "schedule.appointmentDuration": 1 },
  );
  const duration = clinic?.schedule?.appointmentDuration ?? 25; // default 25 min

  // ── CONVERT SLOTTIME TO MINUTES ────────────────────────────────────────────
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const toTimeString = (minutes) => {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const slotMinutes = toMinutes(slotTime);

  // ── CALCULATE CONFLICT RANGE ───────────────────────────────────────────────
  // example: slotTime = "09:25", duration = 25 min
  // any existing appointment between "09:00" and "09:49" conflicts
  // because:
  //   "09:00" appointment ends at "09:25" → conflicts with "09:25"
  //   "09:25" appointment ends at "09:50" → conflicts with "09:25"
  //   "09:49" appointment ends at "10:14" → conflicts with "09:25"
  //   "09:50" appointment starts after our slot ends → no conflict

  const rangeStart = toTimeString(slotMinutes - (duration - 1)); // "09:01"
  const rangeEnd = toTimeString(slotMinutes + (duration - 1)); // "09:49"

  // ── CHECK 1 — slot conflict with range ────────────────────────────────────
  // get all appointments for this doctor on this date (not cancelled)
  const appointments = await Appointment.find({
    doctor: new mongoose.Types.ObjectId(doctorId),
    date: new Date(date),
    status: { $ne: "ملغى" },
  }).select("slotTime");

  // check in JS — convert each stored slotTime to minutes and compare
  const hasConflict = appointments.some((apt) => {
    const aptMinutes = toMinutes(apt.slotTime);
    return (
      aptMinutes >= toMinutes(rangeStart) && aptMinutes <= toMinutes(rangeEnd)
    );
    // any existing appointment that falls within our conflict range
  });

  if (hasConflict) return false;
  console.log("check2 valid");

  // ── CHECK 2 — is this day within doctor's working days? ───────────────────
  const doctorProfile = await DoctorProfile.findOne({
    user: new mongoose.Types.ObjectId(doctorId),
  });

  if (!doctorProfile) return false;

  const dayNames = [
    "الاحد",
    "الاثنين",
    "الثلاثاء",
    "الاربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];

  const dayName = dayNames[new Date(date).getDay()];
  if (!doctorProfile.workingDays.includes(dayName)) return false;
  console.log("check2 valid");
  // ── CHECK 3 — is slotTime within doctor's working hours? ──────────────────
  const startMinutes = toMinutes(doctorProfile.startTime);
  const endMinutes = toMinutes(doctorProfile.endTime);

  if (slotMinutes < startMinutes || slotMinutes >= endMinutes) return false;

  return true;
}
export const bookAppointmentByReceptionist = catchAsync(
  async (req, res, next) => {
    const {
      doctorId,
      date,
      slotTime,
      firstName,
      lastName,
      phone,
      gender,
      day,
      month,
      year,
    } = req.body;

    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) return next(new AppError("doctor not found", 404));
    // is doctor has avaliable in this time
    const isAvaliable = await isDoctorAvailable(doctorId, date, slotTime);
    if (!isAvaliable)
      return next(new AppError("doctor isn't available in this time", 400));
    const specialization = await getDoctorSpecialization(doctorId);
    if (!specialization)
      return next(new AppError("doctor has no specialization assigned", 400));

    const birthDate = new Date(year, month - 1, day);
    const isTherePatient = await User.findOne({ phone });
    if (isTherePatient)
      return next(new AppError("this phone has already account", 400));

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let [newPatient] = await User.create(
        [
          {
            firstName,
            lastName,
            phone,
            gender,
            birthDate,
            role: "patient",
            password: "Test@1234",
          },
        ],
        { session },
      );

      await PatientProfile.create(
        [
          {
            user: newPatient._id,
          },
        ],
        { session },
      );

      const newAppointment = await Appointment.create(
        [
          {
            patient: newPatient._id,
            doctor: doctorId,
            date,
            slotTime,
            fees: specialization.consultationFee,
            reason: "",
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        status: "success",
        data: { appointment: newAppointment[0] },
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      return next(err);
    }
  },
);
export const getCurrentPatientForDoctor = catchAsync(async (req, res, next) => {
  const doctorId = req.user.id;
  const { patientId } = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(patientId))
    return next(new AppError("Invalid id", 400));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const appointment = await Appointment.aggregate([
    {
      $match: {
        doctor: new mongoose.Types.ObjectId(doctorId),
        patient: new mongoose.Types.ObjectId(patientId),
        date: { $gte: todayStart, $lte: todayEnd },
      },
    },
  ]);

  if (!appointment.length)
    return next(new AppError("No appointment found for today", 404));

  res.status(200).json({
    status: "success",
    data: { appointment: appointment[0] },
  });
});
