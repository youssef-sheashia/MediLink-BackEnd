import catchAsync from "../utils/catchAsync.js";
import mongoose from "mongoose";
import Appointment from "../models/appointmentModel.js";
import DoctorProfile from "../models/doctorProfileModel.js";
import User from "../models/userModel.js";
import PatientProfile from "../models/patientProfileModel.js";
import PrescriptionModel from "../models/prescriptionModel.js";
import MedicalReportModel from "../models/medicalReportModel.js";
import Activity from "../models/activitiesModel.js";
import AppError from "../utils/appError.js";
import { ACTIONS } from "../constant/activities.js";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  getDoctorSpecialization,
  isDoctorAvailable,
  checkSameDoctorSameDay,
  checkSameSpecializationSameDay,
  checkPatientSlotConflict,
} from "../utils/appointmentHelpers.js";

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
  const appointments = await Appointment.find()
    .populate("patient", "firstName lastName phone photo")
    .populate("doctor", "firstName lastName phone photo");

  res.status(200).json({
    status: "success",
    length: appointments.length,
    data: { appointments },
  });
});

export const getPatientForDoctor = catchAsync(async (req, res, next) => {
  const doctorId = req.user._id;
  const { search } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const patients = await Appointment.aggregate([
    { $match: { doctor: new mongoose.Types.ObjectId(doctorId) } },
    { $group: { _id: "$patient", visitCount: { $sum: 1 } } },
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

    const appointments = await Appointment.aggregate([
      { $match: { patient: new mongoose.Types.ObjectId(patientId) } },
      {
        $lookup: {
          from: "users",
          let: { doctorId: "$doctor" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$doctorId"] } } },
            { $project: { firstName: 1, lastName: 1, photo: 1 } },
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
            { $match: { $expr: { $eq: ["$user", "$$doctorUserId"] } } },
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
            { $project: { "specialization.name": 1 } },
          ],
          as: "doctorProfile",
        },
      },
      { $unwind: { path: "$doctorProfile", preserveNullAndEmptyArrays: true } },
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
          isRated: 1,
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

  // validate patient
  const patient = await User.findOne({ _id: patientId, role: "patient" });
  if (!patient) return next(new AppError("patient not found", 404));

  // validate doctor
  const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
  if (!doctor) return next(new AppError("doctor not found", 404));

  // check doctor availability (slot + working day + hours)
  const isAvailable = await isDoctorAvailable(doctorId, date, slotTime);
  if (!isAvailable)
    return next(new AppError("doctor isn't available in this time", 400));

  // get specialization and fees
  const specialization = await getDoctorSpecialization(doctorId);
  if (!specialization)
    return next(new AppError("doctor has no specialization assigned", 400));

  // patient can't book same doctor twice on same day
  const sameDoctorOk = await checkSameDoctorSameDay(patientId, doctorId, date);
  if (!sameDoctorOk)
    return next(
      new AppError(
        "you already have an appointment with this doctor today",
        400,
      ),
    );

  // patient can't book same specialization twice on same day
  const sameSpecOk = await checkSameSpecializationSameDay(
    patientId,
    doctorId,
    date,
  );
  if (!sameSpecOk)
    return next(
      new AppError(
        "you already have an appointment with a doctor of the same specialization today",
        400,
      ),
    );

  // patient can't have overlapping slot on same day
  const slotOk = await checkPatientSlotConflict(patientId, date, slotTime);
  if (!slotOk)
    return next(
      new AppError("you already have an appointment at this time", 400),
    );

  // get uploaded file urls from ImageKit middleware
  const medicalFiles = req.uploadedFiles?.map((f) => f.url) ?? [];

  // create appointment
  const newAppointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    date,
    slotTime,
    fees: specialization.consultationFee,
    reason,
    medicalFiles,
  });

  await Activity.create({
    user: req.user._id,
    action: ACTIONS.BOOK_APPOINTMENT,
  });

  res.status(201).json({
    status: "success",
    data: { appointment: newAppointment },
  });
});

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

    // validate doctor
    const doctor = await User.findOne({ _id: doctorId, role: "doctor" });
    if (!doctor) return next(new AppError("doctor not found", 404));

    // check doctor availability
    const isAvailable = await isDoctorAvailable(doctorId, date, slotTime);
    if (!isAvailable)
      return next(new AppError("doctor isn't available in this time", 400));

    // get specialization and fees
    const specialization = await getDoctorSpecialization(doctorId);
    if (!specialization)
      return next(new AppError("doctor has no specialization assigned", 400));

    // find patient by phone or create new one
    const existingPatient = await User.findOne({ phone });
    let patientId;

    if (existingPatient) {
      patientId = existingPatient._id;

      // run same checks as patient booking
      const sameDoctorOk = await checkSameDoctorSameDay(
        patientId,
        doctorId,
        date,
      );
      if (!sameDoctorOk)
        return next(
          new AppError(
            "this patient already has an appointment with this doctor today",
            400,
          ),
        );

      const sameSpecOk = await checkSameSpecializationSameDay(
        patientId,
        doctorId,
        date,
      );
      if (!sameSpecOk)
        return next(
          new AppError(
            "this patient already has an appointment with a doctor of the same specialization today",
            400,
          ),
        );

      const slotOk = await checkPatientSlotConflict(patientId, date, slotTime);
      if (!slotOk)
        return next(
          new AppError(
            "this patient already has an appointment at this time",
            400,
          ),
        );
    } else {
      // create new patient + profile in transaction
      const birthDate = new Date(year, month - 1, day);
      const tempPassword = crypto.randomBytes(8).toString("hex");
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const [newPatient] = await User.create(
          [
            {
              firstName,
              lastName,
              phone,
              gender,
              birthDate,
              role: "patient",
              password: hashedPassword,
              isPreHashed: true,
            },
          ],
          { session },
        );

        await PatientProfile.create([{ user: newPatient._id }], { session });

        await session.commitTransaction();
        session.endSession();

        patientId = newPatient._id;
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return next(err);
      }
    }

    // create appointment outside transaction — independent operation
    const newAppointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      date,
      slotTime,
      fees: specialization.consultationFee,
      reason: "",
    });

    await Activity.insertMany([
      { user: req.user._id, action: ACTIONS.BOOK_APPOINTMENT },
      { user: req.user._id, action: ACTIONS.CREATE_PATIENT_USER },
    ]);

    res.status(201).json({
      status: "success",
      data: { appointment: newAppointment },
    });
  },
);

export const getCurrentPatientForDoctor = catchAsync(async (req, res, next) => {
  const doctorId = req.user.id;
  const patientId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(patientId))
    return next(new AppError("invalid patient id", 400));

  // bypass pre-hook — use collection directly
  const patientUser = await User.collection.findOne({
    _id: new mongoose.Types.ObjectId(patientId),
    role: "patient",
  });

  if (!patientUser)
    return next(new AppError("no patient found with this id", 404));
  if (!patientUser.active)
    return next(new AppError("this patient account is deactivated", 403));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const result = await Appointment.aggregate([
    {
      $match: {
        doctor: new mongoose.Types.ObjectId(doctorId),
        patient: new mongoose.Types.ObjectId(patientId),
        date: { $gte: todayStart, $lte: todayEnd },
        status: "قيد الانتظار",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "patient",
        foreignField: "_id",
        as: "patient",
      },
    },
    { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "patientprofiles",
        localField: "patient._id",
        foreignField: "user",
        as: "patientProfile",
      },
    },
    { $unwind: { path: "$patientProfile", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        date: 1,
        slotTime: 1,
        status: 1,
        reason: 1,
        fees: 1,
        medicalFiles: 1,
        createdAt: 1,
        "patient._id": 1,
        "patient.firstName": 1,
        "patient.lastName": 1,
        "patient.phone": 1,
        "patient.photo": 1,
        "patient.gender": 1,
        "patient.birthDate": 1,
        "patientProfile.bloodType": 1,
        "patientProfile.tall": 1,
        "patientProfile.weight": 1,
        "patientProfile.smoking": 1,
        "patientProfile.allergies": 1,
        "patientProfile.chronicConditions": 1,
        "patientProfile.chronicMedications": 1,
        "patientProfile.medicalFiles": 1,
      },
    },
  ]);

  if (!result.length)
    return next(new AppError("no appointment found for today", 404));

  res.status(200).json({
    status: "success",
    data: { appointment: result[0] },
  });
});

export const changeAppointmentStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("invalid id", 400));

  const appointment = await Appointment.findById(id);
  if (!appointment) return next(new AppError("appointment not found", 404));

  const { changeTo } = req.body;

  if (!["قيد الانتظار", "مكتمل", "ملغى"].includes(changeTo))
    return next(new AppError("invalid status value", 400));

  if (appointment.status === "ملغى")
    return next(
      new AppError("cannot change status of a cancelled appointment", 400),
    );

  if (appointment.status === "مكتمل" && changeTo === "قيد الانتظار")
    return next(
      new AppError(
        "cannot revert a completed appointment back to pending",
        400,
      ),
    );

  if (changeTo === "ملغى") appointment.cancelledBy = req.user.role;

  appointment.status = changeTo;
  await appointment.save();

  await Activity.create({
    user: req.user._id,
    action: ACTIONS.CHANGE_APPOINTMENT_STATUS,
  });

  res.status(200).json({
    status: "success",
    data: { appointment },
  });
});

export const completeAppointment = catchAsync(async (req, res, next) => {
  const doctorId = req.user._id;
  const appointmentId = req.params.id;
  const { diagnosis, notes, medicines } = req.body;

  if (!mongoose.Types.ObjectId.isValid(appointmentId))
    return next(new AppError("invalid appointment id", 400));

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctor: doctorId,
    status: "مؤكد",
  });

  if (!appointment)
    return next(
      new AppError("appointment not found or already completed", 404),
    );

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [medicalReport] = await MedicalReportModel.create(
      [
        {
          patient: appointment.patient,
          doctor: doctorId,
          appointment: appointment._id,
          diagnosis,
          notes,
        },
      ],
      { session },
    );

    const [prescription] = await PrescriptionModel.create(
      [
        {
          patient: appointment.patient,
          doctor: doctorId,
          appointment: appointment._id,
          medicines,
        },
      ],
      { session },
    );

    appointment.status = "مكتمل";
    await appointment.save({ session });

    await session.commitTransaction();
    session.endSession();

    const actions = [
      { user: req.user._id, action: ACTIONS.COMPLETE_APPOINTMENT },
      { user: req.user._id, action: ACTIONS.CREATE_PRESCRIPTION },
      { user: req.user._id, action: ACTIONS.CREATE_MEDICAL_REPORT },
    ];

    await Activity.insertMany(actions);

    res.status(201).json({
      status: "success",
      data: { appointment, medicalReport, prescription },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
});

export const getAppointmentsCount = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("invalid id", 400));

  const user = await User.findById(id);
  if (!user) return next(new AppError("user not found", 404));

  const matchField = user.role === "patient" ? "patient" : "doctor";

  const stats = await Appointment.aggregate([
    { $match: { [matchField]: new mongoose.Types.ObjectId(id) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const result = {
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    pendingAppointments: 0,
  };

  stats.forEach((item) => {
    if (item._id === "مكتمل") result.completedAppointments = item.count;
    if (item._id === "ملغى") result.cancelledAppointments = item.count;
    if (item._id === "قيد الانتظار") result.pendingAppointments = item.count;
    result.totalAppointments += item.count;
  });

  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getDoctorQueueByDoctor = catchAsync(async (req, res, next) => {
  const doctorId = req.user._id;
  const queue = await getQueue(doctorId, "مؤكد");
  res.status(200).json({
    status: "success",
    length: queue.length,
    data: { queue },
  });
});

export const getDoctorQueueByRecepionist = catchAsync(
  async (req, res, next) => {
    const { doctorId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(doctorId))
      return next(new AppError("Invalid id", 400));
    const doctor = await User.findbyId(doctorId);
    if (!doctor) return next(new AppError("Doctor not found", 404));

    const queue = await getQueue(doctorId, "قيد الانتظار");
    res.status(200).json({
      status: "success",
      length: queue.length,
      data: { queue },
    });
  },
);

const getQueue = catchAsync(async (doctorId, statusValue) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const queue = await Appointment.aggregate([
    {
      $match: {
        doctor: new mongoose.Types.ObjectId(doctorId),
        date: { $gte: todayStart, $lte: todayEnd },
        status: statusValue,
      },
    },

    {
      $lookup: {
        from: "users",
        let: { patientId: "$patient" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$patientId"] } } },
          { $project: { firstName: 1, lastName: 1, photo: 1, phone: 1 } },
        ],
        as: "patient",
      },
    },
    { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },

    { $sort: { slotTime: 1 } },

    {
      $project: {
        _id: 1,
        date: 1,
        slotTime: 1,
        status: 1,
        reason: 1,
        fees: 1,
        "patient._id": 1,
        "patient.firstName": 1,
        "patient.lastName": 1,
        "patient.photo": 1,
        "patient.phone": 1,
      },
    },
  ]);
  return queue;
});
export const cancelAppointment = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new AppError("Invalid id", 400));

  const appointment = await Appointment.findById(id);
  if (!appointment) return next(new AppError("Appointment not found", 404));

  // 1. Check ownership — receptionists can cancel any, patients only their own
  if (
    req.user.role === "patient" &&
    appointment.patient.toString() !== req.user._id.toString()
  )
    return next(
      new AppError("You are not allowed to cancel this appointment", 403),
    );

  // 2. Guard against double-cancellation before touching anything else
  if (appointment.status === "ملغى")
    return next(new AppError("Appointment is already cancelled", 400));

  // 3. Enforce the 6-hour cancellation window
  const now = new Date();
  const appointmentDate = new Date(appointment.slotTime);
  const diffInHours =
    (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 6)
    return next(
      new AppError(
        "Cannot cancel an appointment less than 6 hours before it",
        400,
      ),
    );

  // 4. Atomically update status and log activity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    appointment.status = "ملغى";
    await appointment.save({ session });

    await Activity.create(
      [{ user: req.user._id, action: ACTIONS.CANCEL_APPOINTMENT }],
      { session },
    );

    await session.commitTransaction();

    res.status(200).json({
      status: "success",
      data: { appointment },
    });
  } catch (err) {
    await session.abortTransaction();
    return next(err);
  } finally {
    session.endSession();
  }
});
