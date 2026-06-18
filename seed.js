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
  ]);
  console.log("🧹 Collections cleared");

  // ── 2. SPECIALIZATIONS ────────────────────────────────────────────────────
  const [cardiology, dermatology, pediatrics] = await Specialization.insertMany(
    [
      { name: "Cardiology", consultationFee: 300 },
      { name: "Dermatology", consultationFee: 200 },
      { name: "Pediatrics", consultationFee: 150 },
    ],
  );
  console.log("✅ Specializations created");

  // ── 3. CLINIC ─────────────────────────────────────────────────────────────
  await Clinic.create({
    name: "Medilink Clinic",
    address: {
      country: "Egypt",
      city: "Cairo",
      governorate: "Cairo",
    },
    description: "A modern clinic providing high quality healthcare services.",
    phone: "01012345678",
    email: "medilink@clinic.com",
    schedule: {
      appointmentDuration: 25,
      maxAppointmentsPerDay: 10,
      workingDays: [
        { day: "السبت", isActive: true, startTime: "09:00", endTime: "17:00" },
        { day: "الاحد", isActive: true, startTime: "09:00", endTime: "17:00" },
        {
          day: "الاثنين",
          isActive: true,
          startTime: "09:00",
          endTime: "17:00",
        },
        {
          day: "الثلاثاء",
          isActive: true,
          startTime: "09:00",
          endTime: "17:00",
        },
        {
          day: "الاربعاء",
          isActive: true,
          startTime: "09:00",
          endTime: "17:00",
        },
        { day: "الخميس", isActive: false, startTime: null, endTime: null },
        { day: "الجمعة", isActive: false, startTime: null, endTime: null },
      ],
    },
  });
  console.log("✅ Clinic created");

  // ── 4. ADMIN ──────────────────────────────────────────────────────────────
  const admin = await User.create({
    firstName: "Super",
    lastName: "Admin",
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
      firstName: "Ahmed",
      lastName: "Hassan",
      gender: "male",
      birthDate: new Date("1980-05-15"),
      phone: "01011111111",
      role: "doctor",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "Sara",
      lastName: "Mohamed",
      gender: "female",
      birthDate: new Date("1985-08-20"),
      phone: "01022222222",
      role: "doctor",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "Khaled",
      lastName: "Ali",
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
      workingDays: ["saturday", "sunday", "monday", "tuesday", "wednesday"],
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      user: doctor2._id,
      specialization: dermatology._id,
      experienceYears: 7,
      workingDays: ["saturday", "sunday", "monday", "tuesday", "wednesday"],
      startTime: "10:00",
      endTime: "18:00",
    },
    {
      user: doctor3._id,
      specialization: pediatrics._id,
      experienceYears: 15,
      workingDays: ["saturday", "sunday", "monday", "tuesday", "wednesday"],
      startTime: "08:00",
      endTime: "16:00",
    },
  ]);
  console.log("✅ Doctors + profiles created");

  // ── 6. RECEPTIONISTS ──────────────────────────────────────────────────────
  const receptionistUsers = await User.insertMany([
    {
      firstName: "Nour",
      lastName: "Tarek",
      gender: "female",
      birthDate: new Date("1995-07-12"),
      phone: "01044444444",
      role: "receptionist",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "Omar",
      lastName: "Youssef",
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
      workingDays: ["saturday", "sunday", "monday", "tuesday", "wednesday"],
      education: "Bachelor of Business Administration",
      status: "active",
      startTime: "08:00",
      endTime: "16:00",
    },
    {
      user: rec2._id,
      workingDays: ["saturday", "sunday", "monday", "tuesday", "wednesday"],
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
      firstName: "Mohamed",
      lastName: "Hussein",
      gender: "male",
      birthDate: new Date("1990-02-14"),
      phone: "01066666666",
      role: "patient",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "Marwa",
      lastName: "Khaled",
      gender: "female",
      birthDate: new Date("1992-06-30"),
      phone: "01077777777",
      role: "patient",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "Nour",
      lastName: "Bassem",
      gender: "female",
      birthDate: new Date("1998-09-05"),
      phone: "01088888888",
      role: "patient",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "Ali",
      lastName: "Youssef",
      gender: "male",
      birthDate: new Date("1985-12-20"),
      phone: "01099999999",
      role: "patient",
      password: HASHED_PASSWORD,
      isPreHashed: true,
    },
    {
      firstName: "Salwa",
      lastName: "Hamdy",
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
  // completed appointments (needed for prescriptions and medical reports)
  const [apt1, apt2, apt3, apt4] = await Appointment.insertMany([
    {
      patient: patient1._id,
      doctor: doctor1._id,
      date: new Date("2025-12-10"),
      slotTime: "09:00",
      status: "مكتمل",
      fees: 300,
      notes: "Regular checkup",
    },
    {
      patient: patient2._id,
      doctor: doctor1._id,
      date: new Date("2025-12-12"),
      slotTime: "09:25",
      status: "مكتمل",
      fees: 300,
      notes: "Follow up",
    },
    {
      patient: patient3._id,
      doctor: doctor2._id,
      date: new Date("2025-12-15"),
      slotTime: "10:00",
      status: "مكتمل",
      fees: 200,
    },
    {
      patient: patient1._id,
      doctor: doctor1._id,
      date: new Date("2026-01-05"),
      slotTime: "09:00",
      status: "مكتمل",
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
      status: "قيد الانتظار",
      fees: 300,
    },
    {
      patient: patient5._id,
      doctor: doctor2._id,
      date: new Date("2026-07-01"),
      slotTime: "10:25",
      status: "قيد الانتظار",
      fees: 200,
    },
    {
      patient: patient2._id,
      doctor: doctor3._id,
      date: new Date("2026-07-02"),
      slotTime: "08:00",
      status: "قيد الانتظار",
      fees: 150,
    },
    // cancelled appointment
    {
      patient: patient3._id,
      doctor: doctor1._id,
      date: new Date("2026-07-03"),
      slotTime: "09:25",
      status: "ملغى",
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
          dose: "1 حبة",
          frequency: "كل 6 ساعات",
          duration: "3 أيام",
        },
        {
          name: "Paracetamol",
          dose: "1 حبة",
          frequency: "كل 8 ساعات",
          duration: "7 أيام",
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
          dose: "1 حبة",
          frequency: "كل 8 ساعات",
          duration: "7 أيام",
        },
        {
          name: "Ibuprofen",
          dose: "1 حبة",
          frequency: "كل 12 ساعة",
          duration: "5 أيام",
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
          dose: "1 حبة",
          frequency: "مرة يومياً",
          duration: "14 يوم",
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
          dose: "1 حبة",
          frequency: "كل 6 ساعات",
          duration: "3 أيام",
        },
        {
          name: "Paracetamol",
          dose: "1 حبة",
          frequency: "كل 8 ساعات",
          duration: "7 أيام",
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
      diagnosis: "حساسية شديدة",
      notes: "ملاحظات: سعال شديد واحتقان في الأنف والحنجرة",
    },
    {
      patient: patient2._id,
      doctor: doctor1._id,
      appointment: apt2._id,
      diagnosis: "التهاب الحلق الحاد",
      notes: "يحتاج المريض للراحة التامة وشرب السوائل",
    },
    {
      patient: patient3._id,
      doctor: doctor2._id,
      appointment: apt3._id,
      diagnosis: "حساسية جلدية",
      notes: "تجنب التعرض للمسببات",
    },
    {
      patient: patient1._id,
      doctor: doctor1._id,
      appointment: apt4._id,
      diagnosis: "حساسية شديدة",
      notes: "تحسن ملحوظ مقارنة بالزيارة السابقة",
    },
  ]);
  console.log("✅ Medical reports created");

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
  console.log(
    "🧑‍🤝‍🧑 Patient1 → phone: 01066666666  (has 2 completed appointments)",
  );
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
