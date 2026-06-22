import mongoose from "mongoose";
import Appointment from "../models/appointmentModel.js";
import DoctorProfile from "../models/doctorProfileModel.js";
import Clinic from "../models/clinicModel.js";

const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const toTimeString = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};


const DAY_NAMES = [
  "الاحد",
  "الاثنين",
  "الثلاثاء",
  "الاربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];


export const getDoctorSpecialization = async (doctorId) => {
  const result = await DoctorProfile.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(doctorId) } },
    {
      $lookup: {
        from: "specializations",
        localField: "specialization",
        foreignField: "_id",
        as: "specialization",
      },
    },
    { $unwind: { path: "$specialization", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        specializationId: "$specialization._id",
        specializationName: "$specialization.name",
        consultationFee: "$specialization.consultationFee",
      },
    },
  ]);
  return result[0] ?? null;
};


export const isDoctorAvailable = async (doctorId, date, slotTime) => {
  const clinic = await Clinic.findOne({}, { "schedule.appointmentDuration": 1 });
  const duration = clinic?.schedule?.appointmentDuration ?? 25;

  const slotMinutes = toMinutes(slotTime);
  const rangeStart  = toMinutes(toTimeString(slotMinutes - (duration - 1)));
  const rangeEnd    = toMinutes(toTimeString(slotMinutes + (duration - 1)));

  const bookedSlots = await Appointment.find({
    doctor: new mongoose.Types.ObjectId(doctorId),
    date: new Date(date),
    status: { $ne: "ملغى" },
  }).select("slotTime");

  const hasSlotConflict = bookedSlots.some((apt) => {
    const aptMinutes = toMinutes(apt.slotTime);
    return aptMinutes >= rangeStart && aptMinutes <= rangeEnd;
  });

  if (hasSlotConflict) return false;

  const doctorProfile = await DoctorProfile.findOne({
    user: new mongoose.Types.ObjectId(doctorId),
  });

  if (!doctorProfile) return false;

  const dayName = DAY_NAMES[new Date(date).getDay()];
  if (!doctorProfile.workingDays.includes(dayName)) return false;

  const startMinutes = toMinutes(doctorProfile.startTime);
  const endMinutes   = toMinutes(doctorProfile.endTime);
  if (slotMinutes < startMinutes || slotMinutes >= endMinutes) return false;

  return true;
};


export const checkSameDoctorSameDay = async (patientId, doctorId, date) => {
  const existing = await Appointment.findOne({
    patient: new mongoose.Types.ObjectId(patientId),
    doctor: new mongoose.Types.ObjectId(doctorId),
    date: new Date(date),
    status: { $ne: "ملغى" },
  });
  return !existing; 
};


export const checkSameSpecializationSameDay = async (patientId, doctorId, date) => {
  const specialization = await getDoctorSpecialization(doctorId);
  if (!specialization) return true; 

  const existingAppointments = await Appointment.find({
    patient: new mongoose.Types.ObjectId(patientId),
    date: new Date(date),
    status: { $ne: "ملغى" },
  }).select("doctor");

  if (!existingAppointments.length) return true;

  const bookedDoctorIds = existingAppointments.map((apt) => apt.doctor);

  const bookedSpecializations = await DoctorProfile.aggregate([
    { $match: { user: { $in: bookedDoctorIds } } },
    {
      $lookup: {
        from: "specializations",
        localField: "specialization",
        foreignField: "_id",
        as: "specialization",
      },
    },
    { $unwind: { path: "$specialization", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, specializationId: "$specialization._id" } },
  ]);

  const hasConflict = bookedSpecializations.some(
    (s) => s.specializationId?.toString() === specialization.specializationId?.toString()
  );

  return !hasConflict;
};


export const checkPatientSlotConflict = async (patientId, date, slotTime) => {
  const clinic = await Clinic.findOne({}, { "schedule.appointmentDuration": 1 });
  const duration = clinic?.schedule?.appointmentDuration ?? 30;

  const slotMinutes = toMinutes(slotTime);
  const rangeStart  = slotMinutes - (duration - 1);
  const rangeEnd    = slotMinutes + (duration - 1);

  const existingAppointments = await Appointment.find({
    patient: new mongoose.Types.ObjectId(patientId),
    date: new Date(date),
    status: { $ne: "ملغى" },
  }).select("slotTime");

  const hasConflict = existingAppointments.some((apt) => {
    const aptMinutes = toMinutes(apt.slotTime);
    return aptMinutes >= rangeStart && aptMinutes <= rangeEnd;
  });

  return !hasConflict; 
};
