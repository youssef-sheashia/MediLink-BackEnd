import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

import User from "./models/userModel.js";
import DoctorProfile from "./models/doctorProfileModel.js";
import PatientProfile from "./models/patientProfileModel.js";
import Receptionist from "./models/receptionistModel.js";
import Specialization from "./models/specializationModel.js";
import Clinic from "./models/clinicModel.js";
import Appointment from "./models/appointmentModel.js";
import Prescription from "./models/prescriptionModel.js";
import MedicalReport from "./models/medicalReportModel.js";
import Review from "./models/reviewModel.js";

// ─── all users share this password: Test@1234 ───────────────────────────────
const HASHED_PASSWORD = await bcrypt.hash("Test@1234", 12);

const seed = async () => {
  await mongoose.connect(process.env.LOCAL_DATABASE);
  console.log("✅ DB connected");

  // ── 1. CLEAN everything first ─────────────────────────────────────────────
  await Promise.all([
    User.deleteMany(),
    DoctorProfile.deleteMany(),
    PatientProfile.deleteMany(),
    Receptionist.deleteMany(),
    Specialization.deleteMany(),
    Clinic.deleteMany(),
    Appointment.deleteMany(),
    Prescription.deleteMany(),
    MedicalReport.deleteMany(),
    Review.deleteMany(),
  ]);
  console.log("🧹 Collections cleared");

  // ── 2. SPECIALIZATIONS ────────────────────────────────────────────────────
  const [cardiology, dermatology, pediatrics] = await Specialization.insertMany(
    [
      { name: "أمراض القلب والأوعية الدموية", consultationFee: 300 },
      { name: "الأمراض الجلدية والتناسلية", consultationFee: 200 },
      { name: "طب الأطفال وحديثي الولادة", consultationFee: 150 },
    ],
  );
  console.log("✅ Specializations created");

  // ── 3. CLINIC ─────────────────────────────────────────────────────────────
  await Clinic.create({
    name: "Medilink Clinic",
    address: "Cairo, Egypt",
    description: "A modern clinic providing high quality healthcare services.",
    phone: "01012345678",
    email: "medilink@clinic.com",
    schedule: {
      appointmentDuration: 25,
      maxAppointmentsPerDay: 10,
      workingDays: [
        { day: "Saturday", isActive: true, startTime: "09:00", endTime: "17:00" },
        { day: "Sunday", isActive: true, startTime: "09:00", endTime: "17:00" },
        { day: "Monday", isActive: true, startTime: "09:00", endTime: "17:00" },
        { day: "Tuesday", isActive: true, startTime: "09:00", endTime: "17:00" },
        { day: "Wednesday", isActive: true, startTime: "09:00", endTime: "17:00" },
        { day: "Thursday", isActive: false, startTime: null, endTime: null },
        { day: "Friday", isActive: false, startTime: null, endTime: null },
      ],
    },
  });
  console.log("✅ Clinic created");

  // ── 4. ADMIN ──────────────────────────────────────────────────────────────
  const admin = await User.create({
    firstName: "المدير",
    lastName: "العام",
    gender: "male",
    birthDate: new Date("1985-01-01"),
    phone: "01000000000",
    role: "admin",
    password: HASHED_PASSWORD,
    isPreHashed: true,
  });
  console.log("✅ Admin created");

  // ── 5. DOCTORS ────────────────────────────────────────────────────────────
  const doctorUsers = await User.insertMany([
    {
      firstName: "أحمد",
      lastName: "حسن",
      gender: "male",
      birthDate: new Date("1980-05-15"),
      phone: "01011111111",
      role: "doctor",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "سارة",
      lastName: "محمد",
      gender: "female",
      birthDate: new Date("1985-08-20"),
      phone: "01022222222",
      role: "doctor",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "خالد",
      lastName: "علي",
      gender: "male",
      birthDate: new Date("1978-03-10"),
      phone: "01033333333",
      role: "doctor",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
  ]);

  const [doctor1, doctor2, doctor3] = doctorUsers;

  await DoctorProfile.insertMany([
    {
      user: doctor1._id,
      specialization: cardiology._id,
      experienceYears: 10,
      workingDays: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"],
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      user: doctor2._id,
      specialization: dermatology._id,
      experienceYears: 7,
      workingDays: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"],
      startTime: "10:00",
      endTime: "18:00",
    },
    {
      user: doctor3._id,
      specialization: pediatrics._id,
      experienceYears: 15,
      workingDays: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"],
      startTime: "08:00",
      endTime: "16:00",
    },
  ]);
  console.log("✅ Doctors + profiles created");

  // ── 6. RECEPTIONISTS ──────────────────────────────────────────────────────
  const receptionistUsers = await User.insertMany([
    {
      firstName: "نور",
      lastName: "طارق",
      gender: "female",
      birthDate: new Date("1995-07-12"),
      phone: "01044444444",
      role: "receptionist",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "عمر",
      lastName: "يوسف",
      gender: "male",
      birthDate: new Date("1993-11-25"),
      phone: "01055555555",
      role: "receptionist",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
  ]);

  const [rec1, rec2] = receptionistUsers;

  await Receptionist.insertMany([
    {
      user: rec1._id,
      workingDays: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"],
      education: "Bachelor of Business Administration",
      status: "active",
      startTime: "08:00",
      endTime: "16:00",
    },
    {
      user: rec2._id,
      workingDays: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"],
      education: "Diploma in Health Administration",
      status: "active",
      startTime: "12:00",
      endTime: "20:00",
    },
  ]);
  console.log("✅ Receptionists + profiles created");

  // ── 7. PATIENTS ───────────────────────────────────────────────────────────
  const patientUsers = await User.insertMany([
    {
      firstName: "محمد",
      lastName: "حسين",
      gender: "male",
      birthDate: new Date("1990-02-14"),
      phone: "01066666666",
      role: "patient",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "مروة",
      lastName: "خالد",
      gender: "female",
      birthDate: new Date("1992-06-30"),
      phone: "01077777777",
      role: "patient",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "نور",
      lastName: "باسم",
      gender: "female",
      birthDate: new Date("1998-09-05"),
      phone: "01088888888",
      role: "patient",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "علي",
      lastName: "يوسف",
      gender: "male",
      birthDate: new Date("1985-12-20"),
      phone: "01099999999",
      role: "patient",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "سلوى",
      lastName: "حمدي",
      gender: "female",
      birthDate: new Date("2000-04-18"),
      phone: "01111111111",
      role: "patient",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
  ]);

  const [patient1, patient2, patient3, patient4, patient5] = patientUsers;

  await PatientProfile.insertMany([
    {
      user: patient1._id,
      bloodType: "A+",
      allergies: ["Penicillin"],
      chronicConditions: ["Hypertension"],
    },
    {
      user: patient2._id,
      bloodType: "B-",
      allergies: [],
      chronicConditions: [],
    },
    {
      user: patient3._id,
      bloodType: "O+",
      allergies: ["Aspirin"],
      chronicConditions: ["Diabetes"],
    },
    {
      user: patient4._id,
      bloodType: "AB+",
      allergies: [],
      chronicConditions: ["Asthma"],
    },
    {
      user: patient5._id,
      bloodType: "A-",
      allergies: [],
      chronicConditions: [],
    },
  ]);
  console.log("✅ Patients + profiles created");

  // ── 8. APPOINTMENTS ───────────────────────────────────────────────────────
  const [apt1, apt2, apt3, apt4] = await Appointment.insertMany([
    {
      patient: patient1._id,
      doctor: doctor1._id,
      date: new Date("2025-12-10"),
      slotTime: "09:00",
      status: "completed",
      fees: 300,
      notes: "Regular checkup",
    },
    {
      patient: patient2._id,
      doctor: doctor1._id,
      date: new Date("2025-12-12"),
      slotTime: "09:25",
      status: "completed",
      fees: 300,
      notes: "Follow up",
    },
    {
      patient: patient3._id,
      doctor: doctor2._id,
      date: new Date("2025-12-15"),
      slotTime: "10:00",
      status: "completed",
      fees: 200,
    },
    {
      patient: patient1._id,
      doctor: doctor1._id,
      date: new Date("2026-01-05"),
      slotTime: "09:00",
      status: "completed",
      fees: 300,
    },
  ]);

  // pending appointments (upcoming)
  await Appointment.insertMany([
    {
      patient: patient4._id,
      doctor: doctor1._id,
      date: new Date("2026-07-01"),
      slotTime: "10:00",
      status: "pending",
      fees: 300,
    },
    {
      patient: patient5._id,
      doctor: doctor2._id,
      date: new Date("2026-07-01"),
      slotTime: "10:25",
      status: "pending",
      fees: 200,
    },
    {
      patient: patient2._id,
      doctor: doctor3._id,
      date: new Date("2026-07-02"),
      slotTime: "08:00",
      status: "pending",
      fees: 150,
    },
    // cancelled appointment
    {
      patient: patient3._id,
      doctor: doctor1._id,
      date: new Date("2026-07-03"),
      slotTime: "09:25",
      status: "cancelled",
      cancelledBy: "patient",
      fees: 300,
    },
  ]);
  console.log("✅ Appointments created");

  // ── 9. PRESCRIPTIONS ──────────────────────────────────────────────────────
  await Prescription.insertMany([
    {
      patient: patient1._id,
      doctor: doctor1._id,
      appointment: apt1._id,
      medicines: [
        {
          name: "Vontolin",
          dose: "1 pill",
          frequency: "Every 6 hours",
          duration: "3 days",
        },
        {
          name: "Paracetamol",
          dose: "1 pill",
          frequency: "Every 8 hours",
          duration: "7 days",
        },
      ],
    },
    {
      patient: patient2._id,
      doctor: doctor1._id,
      appointment: apt2._id,
      medicines: [
        {
          name: "Amoxicillin",
          dose: "1 pill",
          frequency: "Every 8 hours",
          duration: "7 days",
        },
        {
          name: "Ibuprofen",
          dose: "1 pill",
          frequency: "Every 12 hours",
          duration: "5 days",
        },
      ],
    },
    {
      patient: patient3._id,
      doctor: doctor2._id,
      appointment: apt3._id,
      medicines: [
        {
          name: "Cetirizine",
          dose: "1 pill",
          frequency: "Once daily",
          duration: "14 days",
        },
      ],
    },
    {
      patient: patient1._id,
      doctor: doctor1._id,
      appointment: apt4._id,
      medicines: [
        {
          name: "Vontolin",
          dose: "1 pill",
          frequency: "Every 6 hours",
          duration: "3 days",
        },
        {
          name: "Paracetamol",
          dose: "1 pill",
          frequency: "Every 8 hours",
          duration: "7 days",
        },
      ],
    },
  ]);
  console.log("✅ Prescriptions created");

  // ── 10. MEDICAL REPORTS ───────────────────────────────────────────────────
  await MedicalReport.insertMany([
    {
      patient: patient1._id,
      doctor: doctor1._id,
      appointment: apt1._id,
      diagnosis: "Severe Allergy",
      notes: "Notes: Severe cough and congestion in nose and throat",
    },
    {
      patient: patient2._id,
      doctor: doctor1._id,
      appointment: apt2._id,
      diagnosis: "Acute Sore Throat",
      notes: "Patient needs complete rest and warm fluids",
    },
    {
      patient: patient3._id,
      doctor: doctor2._id,
      appointment: apt3._id,
      diagnosis: "Contact Dermatitis",
      notes: "Avoid exposure to environmental triggers",
    },
    {
      patient: patient1._id,
      doctor: doctor1._id,
      appointment: apt4._id,
      diagnosis: "Severe Allergy",
      notes: "Significant improvement compared to the previous visit",
    },
  ]);
  console.log("✅ Medical reports created");

  // ── 11. REVIEWS ───────────────────────────────────────────────────────────
  await Promise.all([
    Review.create({
      patient: patient1._id,
      doctor: doctor1._id,
      appointment: apt1._id,
      stars: 4.5,
      comment: "Great doctor, highly recommended!",
    }),
    Review.create({
      patient: patient2._id,
      doctor: doctor1._id,
      appointment: apt2._id,
      stars: 5,
      comment: "Very professional and caring.",
    }),
    Review.create({
      patient: patient3._id,
      doctor: doctor2._id,
      appointment: apt3._id,
      stars: 4,
      comment: "Good experience overall.",
    }),
  ]);
  console.log("✅ Reviews created");

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log("\n🎉 Database seeded successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 All passwords: Test@1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👤 Admin   → phone: 01000000000");
  console.log("👨‍⚕️ Doctor1  → phone: 01011111111  (Cardiology)");
  console.log("👩‍⚕️ Doctor2  → phone: 01022222222  (Dermatology)");
  console.log("👨‍⚕️ Doctor3  → phone: 01033333333  (Pediatrics)");
  console.log("🗂️  Recep1   → phone: 01044444444");
  console.log("🗂️  Recep2   → phone: 01055555555");
  console.log("🧑‍🤝‍🧑 Patient1 → phone: 01066666666  (has 2 completed appointments)");
  console.log("🧑‍🤝‍🧑 Patient2 → phone: 01077777777");
  console.log("🧑‍🤝‍🧑 Patient3 → phone: 01088888888");
  console.log("🧑‍🤝‍🧑 Patient4 → phone: 01099999999");
  console.log("🧑‍🤝‍🧑 Patient5 → phone: 01111111111");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});