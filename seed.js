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
import Activity from "./models/activitiesModel.js";

const HASHED_PASSWORD = await bcrypt.hash("Test@1234", 12);
const dryRun = process.argv.includes("--dry-run");

// ── DATE HELPERS ─────────────────────────────────────────────────────────────
const today = new Date(); today.setHours(0, 0, 0, 0);

// past dates (for completed appointments)
const past = (daysAgo) => { const d = new Date(today); d.setDate(today.getDate() - daysAgo); return d; };

// future dates
const future = (daysAhead) => { const d = new Date(today); d.setDate(today.getDate() + daysAhead); return d; };

// this week (next 5 working days)
const thisWeek1 = future(1);
const thisWeek2 = future(2);
const thisWeek3 = future(3);
const thisWeek4 = future(4);
const thisWeek5 = future(5);

// next week
const nextWeek1 = future(7);
const nextWeek2 = future(8);
const nextWeek3 = future(9);
const nextWeek4 = future(10);
const nextWeek5 = future(11);

const seed = async () => {
  await mongoose.connect(process.env.LOCAL_DATABASE);
  console.log("✅ DB connected");

  // Helper to save or validate
  const saveOrValidate = async (Model, docs) => {
    if (dryRun) {
      for (const d of docs) {
        await new Model(d).validate();
      }
      return docs;
    } else {
      return await Model.insertMany(docs);
    }
  };

  // ── 1. CLEAN ──────────────────────────────────────────────────────────────
  if (!dryRun) {
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
      Activity.deleteMany(),
    ]);
    console.log("🧹 Collections cleared");
  } else {
    console.log("🔍 Dry run enabled: Skipped collection deletion.");
  }

  // ── 2. SPECIALIZATIONS ────────────────────────────────────────────────────
  const specData = [
    { _id: new mongoose.Types.ObjectId(), name: "العين",                    consultationFee: 220 },
    { _id: new mongoose.Types.ObjectId(), name: "مخ وأعصاب",               consultationFee: 350 },
    { _id: new mongoose.Types.ObjectId(), name: "أنف وأذن وحنجرة",         consultationFee: 200 },
    { _id: new mongoose.Types.ObjectId(), name: "الجلدية والتجميل",        consultationFee: 250 },
    { _id: new mongoose.Types.ObjectId(), name: "الأطفال",                  consultationFee: 150 },
    { _id: new mongoose.Types.ObjectId(), name: "الباطنة",                  consultationFee: 200 },
    { _id: new mongoose.Types.ObjectId(), name: "الفم والأسنان",            consultationFee: 180 },
    { _id: new mongoose.Types.ObjectId(), name: "العظام والمفاصل",          consultationFee: 300 },
    { _id: new mongoose.Types.ObjectId(), name: "القلب والأوعية الدموية",   consultationFee: 400 },
    { _id: new mongoose.Types.ObjectId(), name: "النساء والتوليد",          consultationFee: 280 },
    { _id: new mongoose.Types.ObjectId(), name: "المسالك البولية",          consultationFee: 240 },
    { _id: new mongoose.Types.ObjectId(), name: "الصدر والجهاز التنفسي",   consultationFee: 220 },
  ];

  await saveOrValidate(Specialization, specData);
  
  const [
    ophthalmology,   // العين
    neurology,       // مخ وأعصاب
    ent,             // أنف وأذن وحنجرة
    dermatology,     // الجلدية والتجميل
    pediatrics,      // الأطفال
    internalMedicine,// الباطنة
    dentistry,       // الفم والأسنان
    orthopedics,     // العظام والمفاصل
    cardiology,      // القلب والأوعية الدموية
    obgyn,           // النساء والتوليد
    urology,         // المسالك البولية
    pulmonology,     // الصدر والجهاز التنفسي
  ] = specData;
  console.log(dryRun ? "🔍 Specializations validated" : "✅ Specializations created (12)");

  // ── 3. CLINIC ─────────────────────────────────────────────────────────────
  const clinicData = {
    name: "Medilink Clinic",
    address: "Egypt, Cairo, Nasr City, Abbas El Akkad Street",
    description: "عيادة ميديلينك متخصصة في تقديم خدمات طبية متكاملة بأعلى معايير الجودة والرعاية الصحية. نضم نخبة من الأطباء المتخصصين في مختلف التخصصات الطبية.",
    phone: "01012345678",
    email: "medilink@clinic.com",
    schedule: {
      appointmentDuration: 25,
      workingDays: [
        { day: "السبت",    isActive: true,  startTime: "09:00", endTime: "17:00" },
        { day: "الاحد",    isActive: true,  startTime: "09:00", endTime: "17:00" },
        { day: "الاثنين",  isActive: true,  startTime: "09:00", endTime: "17:00" },
        { day: "الثلاثاء", isActive: true,  startTime: "09:00", endTime: "17:00" },
        { day: "الاربعاء", isActive: true,  startTime: "09:00", endTime: "17:00" },
        { day: "الخميس",   isActive: false, startTime: null,    endTime: null    },
        { day: "الجمعة",   isActive: false, startTime: null,    endTime: null    },
      ],
    },
  };

  if (dryRun) {
    await new Clinic(clinicData).validate();
    console.log("🔍 Clinic validated");
  } else {
    await Clinic.create(clinicData);
    console.log("✅ Clinic created");
  }

  // ── 4. ADMIN ──────────────────────────────────────────────────────────────
  const adminData = {
    firstName: "توفيق",
    lastName: "عبدالله",
    gender: "male",
    birthDate: new Date("1975-03-10"),
    phone: "01000000000",
    role: "admin",
    password: HASHED_PASSWORD,
    isPreHashed: true,
    photo: "",
    notes: "مدير النظام الرئيسي",
  };

  if (dryRun) {
    await new User(adminData).validate();
    console.log("🔍 Admin validated");
  } else {
    await User.create(adminData);
    console.log("✅ Admin created");
  }

  // ── 5. DOCTORS (9 original — one per specialization) ───────────────────────
  const doctorUsersData = [
    { _id: new mongoose.Types.ObjectId(), firstName: "أحمد",   lastName: "الألفي",    gender: "male",   birthDate: new Date("1978-05-15"), phone: "01011111111", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true, photo: "", notes: "متخصص في أمراض الباطنة الحادة والمزمنة" },
    { _id: new mongoose.Types.ObjectId(), firstName: "أماني",  lastName: "العطار",    gender: "female", birthDate: new Date("1983-08-20"), phone: "01022222222", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true, photo: "", notes: "خبرة واسعة في علاج الأمراض الجلدية والتجميل الطبي" },
    { _id: new mongoose.Types.ObjectId(), firstName: "يمان",   lastName: "علاء",      gender: "male",   birthDate: new Date("1976-03-10"), phone: "01033333333", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true, photo: "", notes: "متخصص في طب وجراحة الأطفال" },
    { _id: new mongoose.Types.ObjectId(), firstName: "جلال",   lastName: "عبدالله",   gender: "male",   birthDate: new Date("1980-11-05"), phone: "01034444444", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true, photo: "", notes: "خبير في أمراض المخ والأعصاب والصداع النصفي" },
    { _id: new mongoose.Types.ObjectId(), firstName: "سارة",   lastName: "سلامة",     gender: "female", birthDate: new Date("1985-07-22"), phone: "01035555555", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true, photo: "", notes: "متخصصة في أمراض الأنف والأذن والحنجرة" },
    { _id: new mongoose.Types.ObjectId(), firstName: "خالد",   lastName: "أسامة",     gender: "male",   birthDate: new Date("1979-01-30"), phone: "01036666666", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true, photo: "", notes: "طبيب أسنان متخصص في التقويم والزراعة" },
    { _id: new mongoose.Types.ObjectId(), firstName: "ندى",    lastName: "حسين",      gender: "female", birthDate: new Date("1987-09-14"), phone: "01037777777", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true, photo: "", notes: "متخصصة في طب وجراحة العيون" },
    { _id: new mongoose.Types.ObjectId(), firstName: "محمود",  lastName: "الشريف",    gender: "male",   birthDate: new Date("1973-04-22"), phone: "01038888888", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true, photo: "", notes: "جراح عظام وإصابات ملاعب رياضية" },
    { _id: new mongoose.Types.ObjectId(), firstName: "رانيا",  lastName: "إبراهيم",   gender: "female", birthDate: new Date("1982-12-08"), phone: "01039999999", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true, photo: "", notes: "متخصصة في أمراض القلب والقسطرة" },
  ];

  await saveOrValidate(User, doctorUsersData);

  const [doctor1, doctor2, doctor3, doctor4, doctor5, doctor6, doctor7, doctor8, doctor9] = doctorUsersData;

  const doctorProfilesData = [
    { user: doctor1._id, specialization: internalMedicine._id, experienceYears: 12, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "09:00", endTime: "17:00" },
    { user: doctor2._id, specialization: dermatology._id,      experienceYears: 8,  workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "10:00", endTime: "18:00" },
    { user: doctor3._id, specialization: pediatrics._id,       experienceYears: 15, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "08:00", endTime: "16:00" },
    { user: doctor4._id, specialization: neurology._id,        experienceYears: 10, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "09:00", endTime: "17:00" },
    { user: doctor5._id, specialization: ent._id,              experienceYears: 6,  workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "09:00", endTime: "17:00" },
    { user: doctor6._id, specialization: dentistry._id,        experienceYears: 9,  workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "10:00", endTime: "18:00" },
    { user: doctor7._id, specialization: ophthalmology._id,    experienceYears: 7,  workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "09:00", endTime: "17:00" },
    { user: doctor8._id, specialization: orthopedics._id,      experienceYears: 18, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "09:00", endTime: "17:00" },
    { user: doctor9._id, specialization: cardiology._id,       experienceYears: 14, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "08:00", endTime: "16:00" },
  ];

  await saveOrValidate(DoctorProfile, doctorProfilesData);
  console.log(dryRun ? "🔍 Doctors + profiles validated" : "✅ Doctors + profiles created (9)");

  // ── 6. RECEPTIONISTS (3 original) ─────────────────────────────────────────
  const receptionistUsersData = [
    { _id: new mongoose.Types.ObjectId(), firstName: "نور",   lastName: "طارق",  gender: "female", birthDate: new Date("1995-07-12"), phone: "01044444444", role: "receptionist", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "عمر",   lastName: "يوسف",  gender: "male",   birthDate: new Date("1993-11-25"), phone: "01055555555", role: "receptionist", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "هبة",   lastName: "سعيد",  gender: "female", birthDate: new Date("1998-03-14"), phone: "01056666666", role: "receptionist", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
  ];

  await saveOrValidate(User, receptionistUsersData);

  const [rec1, rec2, rec3] = receptionistUsersData;

  const receptionistProfilesData = [
    { user: rec1._id, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], education: "بكالوريوس إدارة أعمال",     status: "active", startTime: "08:00", endTime: "16:00" },
    { user: rec2._id, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], education: "دبلوم إدارة المستشفيات",  status: "active", startTime: "12:00", endTime: "20:00" },
    { user: rec3._id, workingDays: ["السبت","الاحد","الاثنين"],                        education: "بكالوريوس علوم صحية",     status: "active", startTime: "09:00", endTime: "17:00" },
  ];

  await saveOrValidate(Receptionist, receptionistProfilesData);
  console.log(dryRun ? "🔍 Receptionists validated" : "✅ Receptionists created (3)");

  // ── 7. PATIENTS (15 original) ─────────────────────────────────────────────
  const patientUsersData = [
    { _id: new mongoose.Types.ObjectId(), firstName: "محمد",  lastName: "حسين",   gender: "male",   birthDate: new Date("1990-02-14"), phone: "01066666666", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "مروة",  lastName: "خالد",   gender: "female", birthDate: new Date("1992-06-30"), phone: "01077777777", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "نور",   lastName: "باسم",   gender: "female", birthDate: new Date("1998-09-05"), phone: "01088888888", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "علي",   lastName: "يوسف",   gender: "male",   birthDate: new Date("1985-12-20"), phone: "01099999999", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "سلوى",  lastName: "حمدي",   gender: "female", birthDate: new Date("2000-04-18"), phone: "01111111111", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "كريم",  lastName: "منصور",  gender: "male",   birthDate: new Date("1988-03-25"), phone: "01122222222", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "هنا",   lastName: "سمير",   gender: "female", birthDate: new Date("1995-08-11"), phone: "01133333333", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "ياسر",  lastName: "فهمي",   gender: "male",   birthDate: new Date("1983-01-07"), phone: "01144444444", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "دينا",  lastName: "رضا",    gender: "female", birthDate: new Date("1997-11-19"), phone: "01155555555", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "عمر",   lastName: "فاروق",  gender: "male",   birthDate: new Date("1991-05-03"), phone: "01166666666", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "لمياء", lastName: "صالح",   gender: "female", birthDate: new Date("1986-08-22"), phone: "01177777777", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "حسام",  lastName: "عمر",    gender: "male",   birthDate: new Date("1994-03-10"), phone: "01188888888", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "رنا",   lastName: "محمود",  gender: "female", birthDate: new Date("2001-07-15"), phone: "01199999999", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "طارق",  lastName: "العزيز", gender: "male",   birthDate: new Date("1979-10-05"), phone: "01200000001", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "منى",   lastName: "حافظ",   gender: "female", birthDate: new Date("1993-12-28"), phone: "01200000002", role: "patient", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
  ];

  await saveOrValidate(User, patientUsersData);

  const [p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15] = patientUsersData;

  const patientProfilesData = [
    { user: p1._id,  bloodType: "A+",  allergies: ["Penicillin"],            chronicConditions: ["Hypertension"],          chronicMedications: ["Amlodipine 5mg"],                tall: 175, weight: 80,  smoking: false, favoriteDoctors: [doctor1._id, doctor9._id] },
    { user: p2._id,  bloodType: "B-",  allergies: [],                        chronicConditions: [],                        chronicMedications: [],                                tall: 162, weight: 58,  smoking: false, favoriteDoctors: [doctor2._id] },
    { user: p3._id,  bloodType: "O+",  allergies: ["Aspirin"],               chronicConditions: ["Diabetes Type 2"],       chronicMedications: ["Metformin 500mg"],               tall: 168, weight: 65,  smoking: false, favoriteDoctors: [doctor3._id] },
    { user: p4._id,  bloodType: "AB+", allergies: [],                        chronicConditions: ["Asthma"],                chronicMedications: ["Salbutamol inhaler"],            tall: 180, weight: 90,  smoking: true,  favoriteDoctors: [doctor4._id] },
    { user: p5._id,  bloodType: "A-",  allergies: [],                        chronicConditions: [],                        chronicMedications: [],                                tall: 160, weight: 55,  smoking: false, favoriteDoctors: [] },
    { user: p6._id,  bloodType: "O-",  allergies: ["Sulfa"],                 chronicConditions: ["Hypertension","Obesity"],chronicMedications: ["Losartan 50mg"],                tall: 178, weight: 95,  smoking: true,  favoriteDoctors: [doctor1._id] },
    { user: p7._id,  bloodType: "B+",  allergies: [],                        chronicConditions: [],                        chronicMedications: [],                                tall: 165, weight: 60,  smoking: false, favoriteDoctors: [doctor6._id] },
    { user: p8._id,  bloodType: "AB-", allergies: ["Penicillin","Latex"],    chronicConditions: ["Diabetes","Asthma"],     chronicMedications: ["Insulin","Montelukast"],         tall: 172, weight: 78,  smoking: false, favoriteDoctors: [doctor4._id, doctor8._id] },
    { user: p9._id,  bloodType: "A+",  allergies: [],                        chronicConditions: [],                        chronicMedications: [],                                tall: 158, weight: 52,  smoking: false, favoriteDoctors: [doctor3._id] },
    { user: p10._id, bloodType: "O+",  allergies: [],                        chronicConditions: ["Smoking-related COPD"],  chronicMedications: ["Tiotropium inhaler"],            tall: 183, weight: 88,  smoking: true,  favoriteDoctors: [] },
    { user: p11._id, bloodType: "A-",  allergies: ["NSAIDs"],                chronicConditions: ["Osteoporosis"],          chronicMedications: ["Calcium+D3"],                    tall: 163, weight: 62,  smoking: false, favoriteDoctors: [doctor8._id] },
    { user: p12._id, bloodType: "B+",  allergies: [],                        chronicConditions: [],                        chronicMedications: [],                                tall: 176, weight: 73,  smoking: false, favoriteDoctors: [] },
    { user: p13._id, bloodType: "O-",  allergies: ["Contrast dye"],          chronicConditions: ["Migraine"],              chronicMedications: ["Propranolol 40mg"],              tall: 164, weight: 56,  smoking: false, favoriteDoctors: [doctor4._id] },
    { user: p14._id, bloodType: "AB+", allergies: [],                        chronicConditions: ["Coronary Artery Disease"],chronicMedications: ["Aspirin 81mg","Atorvastatin"],  tall: 178, weight: 82,  smoking: false, favoriteDoctors: [doctor9._id] },
    { user: p15._id, bloodType: "B-",  allergies: ["Codeine"],               chronicConditions: [],                        chronicMedications: [],                                tall: 167, weight: 61,  smoking: false, favoriteDoctors: [] },
  ];

  await saveOrValidate(PatientProfile, patientProfilesData);
  console.log(dryRun ? "🔍 Patients + profiles validated" : "✅ Patients + profiles created (15)");

  // ── 8. APPOINTMENTS (Original) ─────────────────────────────────────────────
  const completedAptsData = [
    // doctor1 (الباطنة) — 6 completed
    { _id: new mongoose.Types.ObjectId(), patient: p1._id,  doctor: doctor1._id, date: past(60), slotTime: "09:00", status: "مكتمل", fees: 200, reason: "آلام في المعدة وحرقان", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p2._id,  doctor: doctor1._id, date: past(55), slotTime: "09:25", status: "مكتمل", fees: 200, reason: "غثيان وآلام في البطن", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p3._id,  doctor: doctor1._id, date: past(50), slotTime: "10:15", status: "مكتمل", fees: 200, reason: "إرهاق عام وشحوب", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p1._id,  doctor: doctor1._id, date: past(30), slotTime: "09:00", status: "مكتمل", fees: 200, reason: "متابعة دورية", isRated: false },
    { _id: new mongoose.Types.ObjectId(), patient: p6._id,  doctor: doctor1._id, date: past(20), slotTime: "09:25", status: "مكتمل", fees: 200, reason: "فحص دوري شامل وضغط الدم", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p12._id, doctor: doctor1._id, date: past(10), slotTime: "10:00", status: "مكتمل", fees: 200, reason: "ألم في الجهاز الهضمي", isRated: false },
    // doctor2 (الجلدية) — 5 completed
    { _id: new mongoose.Types.ObjectId(), patient: p2._id,  doctor: doctor2._id, date: past(58), slotTime: "10:00", status: "مكتمل", fees: 250, reason: "طفح جلدي وحكة شديدة", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p5._id,  doctor: doctor2._id, date: past(40), slotTime: "10:25", status: "مكتمل", fees: 250, reason: "حب الشباب والبثور", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p7._id,  doctor: doctor2._id, date: past(25), slotTime: "11:00", status: "مكتمل", fees: 250, reason: "إكزيما الجلد", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p11._id, doctor: doctor2._id, date: past(15), slotTime: "11:25", status: "مكتمل", fees: 250, reason: "بقع بيضاء في الجلد", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p13._id, doctor: doctor2._id, date: past(5),  slotTime: "12:00", status: "مكتمل", fees: 250, reason: "حساسية جلدية مفاجئة", isRated: false },
    // doctor3 (الأطفال) — 4 completed
    { _id: new mongoose.Types.ObjectId(), patient: p3._id,  doctor: doctor3._id, date: past(45), slotTime: "08:00", status: "مكتمل", fees: 150, reason: "حمى وسعال للطفل", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p9._id,  doctor: doctor3._id, date: past(35), slotTime: "08:25", status: "مكتمل", fees: 150, reason: "لقاحات وجرعات الطفل", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p5._id,  doctor: doctor3._id, date: past(18), slotTime: "09:00", status: "مكتمل", fees: 150, reason: "فحص دوري للطفل", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p15._id, doctor: doctor3._id, date: past(8),  slotTime: "09:25", status: "مكتمل", fees: 150, reason: "التهاب اللوزتين", isRated: false },
    // doctor4 (مخ وأعصاب) — 4 completed
    { _id: new mongoose.Types.ObjectId(), patient: p4._id,  doctor: doctor4._id, date: past(55), slotTime: "09:00", status: "مكتمل", fees: 350, reason: "صداع نصفي مزمن", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p8._id,  doctor: doctor4._id, date: past(38), slotTime: "09:25", status: "مكتمل", fees: 350, reason: "تنميل في الأطراف", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p13._id, doctor: doctor4._id, date: past(22), slotTime: "10:00", status: "مكتمل", fees: 350, reason: "صداع مستمر ودوار", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p4._id,  doctor: doctor4._id, date: past(7),  slotTime: "09:00", status: "مكتمل", fees: 350, reason: "متابعة الصداع النصفي", isRated: false },
    // doctor5 (أنف وأذن) — 3 completed
    { _id: new mongoose.Types.ObjectId(), patient: p6._id,  doctor: doctor5._id, date: past(48), slotTime: "09:00", status: "مكتمل", fees: 200, reason: "احتقان بالأنف وصداع بالجيوب", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p10._id, doctor: doctor5._id, date: past(28), slotTime: "09:25", status: "مكتمل", fees: 200, reason: "طنين بالأذن وضعف سمع", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p14._id, doctor: doctor5._id, date: past(12), slotTime: "10:00", status: "مكتمل", fees: 200, reason: "التهاب حاد في الحلق", isRated: false },
    // doctor6 (الأسنان) — 3 completed
    { _id: new mongoose.Types.ObjectId(), patient: p7._id,  doctor: doctor6._id, date: past(52), slotTime: "10:00", status: "مكتمل", fees: 180, reason: "ألم في الأسنان", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p1._id,  doctor: doctor6._id, date: past(32), slotTime: "10:25", status: "مكتمل", fees: 180, reason: "تنظيف الأسنان الدورية", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p12._id, doctor: doctor6._id, date: past(14), slotTime: "11:00", status: "مكتمل", fees: 180, reason: "حشو ضرس", isRated: false },
    // doctor7 (العين) — 3 completed
    { _id: new mongoose.Types.ObjectId(), patient: p9._id,  doctor: doctor7._id, date: past(42), slotTime: "09:00", status: "مكتمل", fees: 220, reason: "ضعف في النظر والحرقة", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p14._id, doctor: doctor7._id, date: past(21), slotTime: "09:25", status: "مكتمل", fees: 220, reason: "فحص النظر الدوري", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p15._id, doctor: doctor7._id, date: past(6),  slotTime: "10:00", status: "مكتمل", fees: 220, reason: "احمرار وإفراز من العين", isRated: false },
    // doctor8 (العظام) — 3 completed
    { _id: new mongoose.Types.ObjectId(), patient: p8._id,  doctor: doctor8._id, date: past(62), slotTime: "09:00", status: "مكتمل", fees: 300, reason: "ألم حاد في الركبة", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p11._id, doctor: doctor8._id, date: past(33), slotTime: "09:25", status: "مكتمل", fees: 300, reason: "كسر في الرسغ - متابعة", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p14._id, doctor: doctor8._id, date: past(11), slotTime: "10:00", status: "مكتمل", fees: 300, reason: "آلام أسفل الظهر المزمنة", isRated: false },
    // doctor9 (القلب) — 3 completed
    { _id: new mongoose.Types.ObjectId(), patient: p14._id, doctor: doctor9._id, date: past(65), slotTime: "08:00", status: "مكتمل", fees: 400, reason: "ألم في الصدر وضيق تنفس", isRated: true },
    { _id: new mongoose.Types.ObjectId(), patient: p1._id,  doctor: doctor9._id, date: past(43), slotTime: "08:25", status: "مكتمل", fees: 400, reason: "خفقان القلب المتكرر", isRated: false },
    { _id: new mongoose.Types.ObjectId(), patient: p6._id,  doctor: doctor9._id, date: past(16), slotTime: "09:00", status: "مكتمل", fees: 400, reason: "فحص قلب دوري - ضغط مرتفع", isRated: false },
  ];

  const completedApts = await saveOrValidate(Appointment, completedAptsData);

  const upcomingAptsData = [
    // upcoming
    { patient: p1._id,  doctor: doctor1._id, date: future(35), slotTime: "09:00", status: "قيد الانتظار", fees: 200, reason: "متابعة دورية" },
    { patient: p4._id,  doctor: doctor1._id, date: future(36), slotTime: "09:25", status: "قيد الانتظار", fees: 200, reason: "فحص شامل" },
    { patient: p5._id,  doctor: doctor2._id, date: future(37), slotTime: "10:00", status: "قيد الانتظار", fees: 250, reason: "حساسية جلدية مزمنة" },
    { patient: p2._id,  doctor: doctor3._id, date: future(38), slotTime: "08:00", status: "قيد الانتظار", fees: 150, reason: "فحص طفل" },
    { patient: p8._id,  doctor: doctor4._id, date: future(39), slotTime: "09:00", status: "قيد الانتظار", fees: 350, reason: "صداع مستمر" },
    { patient: p10._id, doctor: doctor5._id, date: future(40), slotTime: "09:25", status: "قيد الانتظار", fees: 200, reason: "التهاب بالحلق واللوزتين" },
    { patient: p9._id,  doctor: doctor6._id, date: future(41), slotTime: "10:00", status: "قيد الانتظار", fees: 180, reason: "تقويم الأسنان" },
    { patient: p3._id,  doctor: doctor7._id, date: future(42), slotTime: "09:00", status: "قيد الانتظار", fees: 220, reason: "ضعف النظر" },
    { patient: p11._id, doctor: doctor8._id, date: future(43), slotTime: "09:25", status: "قيد الانتظار", fees: 300, reason: "ألم مزمن في الكتف" },
    { patient: p14._id, doctor: doctor9._id, date: future(44), slotTime: "08:00", status: "قيد الانتظار", fees: 400, reason: "متابعة شرايين القلب" },

    // this week
    { patient: p1._id,  doctor: doctor1._id, date: thisWeek1, slotTime: "09:00", status: "مؤكد",          fees: 200, reason: "متابعة دورية للضغط" },
    { patient: p6._id,  doctor: doctor1._id, date: thisWeek1, slotTime: "09:25", status: "قيد الانتظار",  fees: 200, reason: "ارتفاع ضغط الدم" },
    { patient: p7._id,  doctor: doctor2._id, date: thisWeek2, slotTime: "10:00", status: "مؤكد",          fees: 250, reason: "مراجعة علاج الإكزيما" },
    { patient: p3._id,  doctor: doctor2._id, date: thisWeek2, slotTime: "10:25", status: "قيد الانتظار",  fees: 250, reason: "حساسية جلدية مزمنة" },
    { patient: p9._id,  doctor: doctor3._id, date: thisWeek3, slotTime: "08:00", status: "مؤكد",          fees: 150, reason: "كحة وزكام الطفل" },
    { patient: p4._id,  doctor: doctor4._id, date: thisWeek3, slotTime: "09:00", status: "قيد الانتظار",  fees: 350, reason: "دوار ودوخة مستمرة" },
    { patient: p10._id, doctor: doctor5._id, date: thisWeek4, slotTime: "09:00", status: "مؤكد",          fees: 200, reason: "ألم وضغط في الجيوب الأنفية" },
    { patient: p2._id,  doctor: doctor6._id, date: thisWeek4, slotTime: "10:00", status: "قيد الانتظار",  fees: 180, reason: "تقويم الأسنان" },
    { patient: p5._id,  doctor: doctor7._id, date: thisWeek5, slotTime: "09:00", status: "مؤكد",          fees: 220, reason: "ضعف النظر والصداع" },
    { patient: p8._id,  doctor: doctor8._id, date: thisWeek5, slotTime: "09:25", status: "قيد الانتظار",  fees: 300, reason: "متابعة ألم الركبة" },
    { patient: p14._id, doctor: doctor9._id, date: thisWeek1, slotTime: "08:00", status: "مؤكد",          fees: 400, reason: "فحص القلب الدوري" },
    { patient: p13._id, doctor: doctor4._id, date: thisWeek2, slotTime: "09:25", status: "قيد الانتظار",  fees: 350, reason: "صداع نصفي جديد" },

    // next week
    { patient: p2._id,  doctor: doctor1._id, date: nextWeek1, slotTime: "09:00", status: "قيد الانتظار", fees: 200, reason: "متابعة الجهاز الهضمي" },
    { patient: p3._id,  doctor: doctor1._id, date: nextWeek1, slotTime: "09:25", status: "قيد الانتظار", fees: 200, reason: "ارتفاع ضغط الدم" },
    { patient: p6._id,  doctor: doctor2._id, date: nextWeek2, slotTime: "10:00", status: "قيد الانتظار", fees: 250, reason: "علاج التشقق الجلدي" },
    { patient: p12._id, doctor: doctor3._id, date: nextWeek2, slotTime: "08:25", status: "قيد الانتظار", fees: 150, reason: "فحص الطفل الدوري" },
    { patient: p5._id,  doctor: doctor4._id, date: nextWeek3, slotTime: "09:00", status: "قيد الانتظار", fees: 350, reason: "صداع نصفي مزمن" },
    { patient: p10._id, doctor: doctor4._id, date: nextWeek3, slotTime: "09:25", status: "قيد الانتظار", fees: 350, reason: "تنميل في الأطراف" },
    { patient: p7._id,  doctor: doctor5._id, date: nextWeek4, slotTime: "09:00", status: "قيد الانتظار", fees: 200, reason: "طنين في الأذن" },
    { patient: p4._id,  doctor: doctor6._id, date: nextWeek4, slotTime: "10:00", status: "قيد الانتظار", fees: 180, reason: "تركيب تاج سن" },
    { patient: p9._id,  doctor: doctor7._id, date: nextWeek5, slotTime: "09:00", status: "قيد الانتظار", fees: 220, reason: "احمرار وحرقة في العين" },
    { patient: p11._id, doctor: doctor8._id, date: nextWeek5, slotTime: "09:25", status: "قيد الانتظار", fees: 300, reason: "ألم مفاصل الركبة" },
    { patient: p15._id, doctor: doctor9._id, date: nextWeek1, slotTime: "08:00", status: "قيد الانتظار", fees: 400, reason: "ضيق تنفس مزمن" },
    { patient: p1._id,  doctor: doctor9._id, date: nextWeek3, slotTime: "08:25", status: "قيد الانتظار", fees: 400, reason: "متابعة خفقان القلب" },

    // cancelled
    { patient: p3._id,  doctor: doctor1._id, date: future(50), slotTime: "09:25", status: "ملغى", cancelledBy: "patient",      fees: 200, reason: "فحص شامل" },
    { patient: p7._id,  doctor: doctor2._id, date: future(51), slotTime: "10:00", status: "ملغى", cancelledBy: "doctor",       fees: 250, reason: "حساسية جلدية" },
    { patient: p5._id,  doctor: doctor3._id, date: future(52), slotTime: "08:25", status: "ملغى", cancelledBy: "receptionist", fees: 150, reason: "فحص روتيني" },
    { patient: p10._id, doctor: doctor8._id, date: future(53), slotTime: "09:00", status: "ملغى", cancelledBy: "patient",      fees: 300, reason: "آلام في الظهر" },
    { patient: p13._id, doctor: doctor9._id, date: future(54), slotTime: "08:00", status: "ملغى", cancelledBy: "patient",      fees: 400, reason: "فحص قلب" },
  ];

  await saveOrValidate(Appointment, upcomingAptsData);
  console.log(dryRun ? "🔍 Appointments validated" : "✅ Original appointments created");

  // ── 9. PRESCRIPTIONS (Original) ───────────────────────────────────────────
  const prescriptionsData = [
    {
      patient: p1._id, doctor: doctor1._id, appointment: completedApts[0]._id,
      medicines: [
        { name: "Omeprazole",      dose: "20mg",  frequency: "مرة يومياً",    duration: "14 يوم" },
        { name: "Antacid Gel",     dose: "10ml",  frequency: "عند الحاجة",    duration: "14 يوم" },
        { name: "Domperidone",     dose: "10mg",  frequency: "3 مرات يومياً", duration: "7 أيام" },
      ],
    },
    {
      patient: p2._id, doctor: doctor1._id, appointment: completedApts[1]._id,
      medicines: [
        { name: "Domperidone",     dose: "10mg",  frequency: "3 مرات يومياً", duration: "7 أيام" },
        { name: "Omeprazole",      dose: "20mg",  frequency: "مرة يومياً",    duration: "14 يوم" },
      ],
    },
    {
      patient: p3._id, doctor: doctor1._id, appointment: completedApts[2]._id,
      medicines: [
        { name: "Ferrous Sulfate", dose: "200mg",   frequency: "مرة يومياً",      duration: "30 يوم" },
        { name: "Vitamin B12",     dose: "1000mcg", frequency: "مرة أسبوعياً",    duration: "30 يوم" },
        { name: "Folic Acid",      dose: "5mg",     frequency: "مرة يومياً",      duration: "30 يوم" },
      ],
    },
    {
      patient: p1._id, doctor: doctor1._id, appointment: completedApts[3]._id,
      medicines: [
        { name: "Omeprazole",      dose: "20mg",  frequency: "مرة يومياً",    duration: "14 يوم" },
        { name: "Amlodipine",      dose: "5mg",   frequency: "مرة يومياً",    duration: "30 يوم" },
      ],
    },
    {
      patient: p6._id, doctor: doctor1._id, appointment: completedApts[4]._id,
      medicines: [
        { name: "Losartan",        dose: "50mg",  frequency: "مرة يومياً",    duration: "30 يوم" },
        { name: "Hydrochlorothiazide", dose: "12.5mg", frequency: "مرة يومياً", duration: "30 يوم" },
      ],
    },
    {
      patient: p2._id, doctor: doctor2._id, appointment: completedApts[6]._id,
      medicines: [
        { name: "Cetirizine",      dose: "10mg",  frequency: "مرة يومياً",    duration: "14 يوم" },
        { name: "Betamethasone",   dose: "كريم",  frequency: "مرتين يومياً",  duration: "10 أيام" },
        { name: "Calamine Lotion", dose: "موضعي", frequency: "عند الحاجة",    duration: "14 يوم" },
      ],
    },
    {
      patient: p5._id, doctor: doctor2._id, appointment: completedApts[7]._id,
      medicines: [
        { name: "Clindamycin",     dose: "جيل",   frequency: "مرتين يومياً",  duration: "21 يوم" },
        { name: "Isotretinoin",    dose: "20mg",  frequency: "مرة يومياً",    duration: "90 يوم" },
        { name: "Sunscreen SPF50", dose: "موضعي", frequency: "كل 2-3 ساعات", duration: "دائم" },
      ],
    },
    {
      patient: p7._id, doctor: doctor2._id, appointment: completedApts[8]._id,
      medicines: [
        { name: "Tacrolimus",      dose: "0.1% كريم", frequency: "مرتين يومياً", duration: "21 يوم" },
        { name: "Cetirizine",      dose: "10mg",       frequency: "مرة يومياً",  duration: "14 يوم" },
      ],
    },
    {
      patient: p11._id, doctor: doctor2._id, appointment: completedApts[9]._id,
      medicines: [
        { name: "Methoxsalen",     dose: "كريم",  frequency: "قبل الجلسة",    duration: "حسب الجلسات" },
        { name: "Sunscreen SPF50", dose: "موضعي", frequency: "دائماً",         duration: "دائم" },
      ],
    },
    {
      patient: p3._id, doctor: doctor3._id, appointment: completedApts[11]._id,
      medicines: [
        { name: "Paracetamol",     dose: "250mg", frequency: "كل 6 ساعات",    duration: "5 أيام" },
        { name: "Amoxicillin",     dose: "125mg", frequency: "كل 8 ساعات",    duration: "7 أيام" },
        { name: "Saline Nasal",    dose: "قطرات", frequency: "4 مرات يومياً", duration: "5 أيام" },
      ],
    },
    {
      patient: p9._id, doctor: doctor3._id, appointment: completedApts[12]._id,
      medicines: [
        { name: "Vitamin D3",      dose: "1000IU", frequency: "مرة يومياً",   duration: "30 يوم" },
        { name: "Multivitamin",    dose: "حبة",    frequency: "مرة يومياً",   duration: "30 يوم" },
      ],
    },
    {
      patient: p5._id, doctor: doctor3._id, appointment: completedApts[13]._id,
      medicines: [
        { name: "Paracetamol",     dose: "500mg", frequency: "كل 6 ساعات",    duration: "3 أيام" },
        { name: "Vitamin C",       dose: "500mg", frequency: "مرة يومياً",    duration: "7 أيام" },
      ],
    },
    {
      patient: p4._id, doctor: doctor4._id, appointment: completedApts[15]._id,
      medicines: [
        { name: "Sumatriptan",     dose: "50mg",  frequency: "عند الحاجة",    duration: "عند الحاجة" },
        { name: "Propranolol",     dose: "40mg",  frequency: "مرتين يومياً",  duration: "30 يوم" },
        { name: "Magnesium",       dose: "400mg", frequency: "مرة يومياً",    duration: "60 يوم" },
      ],
    },
    {
      patient: p8._id, doctor: doctor4._id, appointment: completedApts[16]._id,
      medicines: [
        { name: "Gabapentin",      dose: "300mg", frequency: "3 مرات يومياً", duration: "30 يوم" },
        { name: "Vitamin B12",     dose: "500mcg", frequency: "مرة يومياً",  duration: "30 يوم" },
      ],
    },
    {
      patient: p13._id, doctor: doctor4._id, appointment: completedApts[17]._id,
      medicines: [
        { name: "Sumatriptan",     dose: "100mg", frequency: "عند الحاجة",    duration: "عند الحاجة" },
        { name: "Amitriptyline",   dose: "10mg",  frequency: "مرة ليلاً",     duration: "30 يوم" },
      ],
    },
    {
      patient: p6._id, doctor: doctor5._id, appointment: completedApts[19]._id,
      medicines: [
        { name: "Mometasone",      dose: "بخاخ",   frequency: "مرة يومياً",   duration: "14 يوم" },
        { name: "Saline Nasal Wash", dose: "محلول", frequency: "مرتين يومياً",duration: "14 يوم" },
        { name: "Augmentin",       dose: "625mg",  frequency: "مرتين يومياً", duration: "7 أيام" },
      ],
    },
    {
      patient: p10._id, doctor: doctor5._id, appointment: completedApts[20]._id,
      medicines: [
        { name: "Betahistine",     dose: "16mg",  frequency: "3 مرات يومياً", duration: "30 يوم" },
        { name: "Cinnarizine",     dose: "25mg",  frequency: "مرتين يومياً",  duration: "14 يوم" },
      ],
    },
    {
      patient: p7._id, doctor: doctor6._id, appointment: completedApts[22]._id,
      medicines: [
        { name: "Amoxicillin",     dose: "500mg", frequency: "كل 8 ساعات",    duration: "7 أيام" },
        { name: "Ibuprofen",       dose: "400mg", frequency: "كل 8 ساعات",    duration: "5 أيام" },
        { name: "Chlorhexidine",   dose: "مضمضة", frequency: "مرتين يومياً",  duration: "7 أيام" },
      ],
    },
    {
      patient: p1._id, doctor: doctor6._id, appointment: completedApts[23]._id,
      medicines: [
        { name: "Fluoride Gel",    dose: "موضعي", frequency: "مرة يومياً",    duration: "30 يوم" },
        { name: "Chlorhexidine",   dose: "مضمضة", frequency: "مرتين يومياً",  duration: "14 يوم" },
      ],
    },
    {
      patient: p9._id, doctor: doctor7._id, appointment: completedApts[25]._id,
      medicines: [
        { name: "Artificial Tears", dose: "قطرات", frequency: "4 مرات يومياً",  duration: "30 يوم" },
        { name: "Tobramycin",      dose: "قطرات", frequency: "كل 4 ساعات",     duration: "7 أيام" },
      ],
    },
    {
      patient: p14._id, doctor: doctor7._id, appointment: completedApts[26]._id,
      medicines: [
        { name: "Latanoprost",     dose: "قطرات", frequency: "مرة ليلاً",      duration: "30 يوم" },
        { name: "Vitamin A",       dose: "قطرات", frequency: "3 مرات يومياً",  duration: "30 يوم" },
      ],
    },
    {
      patient: p8._id, doctor: doctor8._id, appointment: completedApts[28]._id,
      medicines: [
        { name: "Diclofenac",      dose: "50mg",  frequency: "3 مرات يومياً",  duration: "10 أيام" },
        { name: "Omeprazole",      dose: "20mg",  frequency: "مرة يومياً",     duration: "10 أيام" },
        { name: "Glucosamine",     dose: "1500mg", frequency: "مرة يومياً",    duration: "90 يوم" },
      ],
    },
    {
      patient: p11._id, doctor: doctor8._id, appointment: completedApts[29]._id,
      medicines: [
        { name: "Calcium Carbonate", dose: "500mg", frequency: "مرتين يومياً", duration: "90 يوم" },
        { name: "Vitamin D3",       dose: "1000IU", frequency: "مرة يومياً",   duration: "90 يوم" },
        { name: "Ibuprofen",        dose: "400mg",  frequency: "عند الحاجة",   duration: "عند الحاجة" },
      ],
    },
    {
      patient: p14._id, doctor: doctor9._id, appointment: completedApts[31]._id,
      medicines: [
        { name: "Aspirin",         dose: "81mg",  frequency: "مرة يومياً",     duration: "مدى الحياة" },
        { name: "Atorvastatin",    dose: "40mg",  frequency: "مرة ليلاً",      duration: "مدى الحياة" },
        { name: "Bisoprolol",      dose: "2.5mg", frequency: "مرة يومياً",     duration: "30 يوم" },
      ],
    },
    {
      patient: p1._id, doctor: doctor9._id, appointment: completedApts[32]._id,
      medicines: [
        { name: "Propranolol",     dose: "40mg",  frequency: "مرتين يومياً",  duration: "30 يوم" },
        { name: "Magnesium",       dose: "400mg", frequency: "مرة يومياً",     duration: "30 يوم" },
      ],
    },
  ];

  await saveOrValidate(Prescription, prescriptionsData);
  console.log(dryRun ? "🔍 Prescriptions validated" : "✅ Original prescriptions created");

  // ── 10. MEDICAL REPORTS (Original) ─────────────────────────────────────────
  const reportsData = [
    { patient: p1._id,  doctor: doctor1._id, appointment: completedApts[0]._id,  diagnosis: "التهاب المعدة الحاد مع الارتجاع المريئي",     notes: "يحتاج المريض إلى تجنب الأطعمة الحامضة والحارة، والنوم برأس مرفوع، ومتابعة دورية كل شهر." },
    { patient: p2._id,  doctor: doctor1._id, appointment: completedApts[1]._id,  diagnosis: "اضطراب حركية المعدة مع الغثيان المزمن",        notes: "تم وصف حاصرات مضخة البروتون مع مضادات الغثيان. يُنصح بتناول وجبات صغيرة متعددة." },
    { patient: p3._id,  doctor: doctor1._id, appointment: completedApts[2]._id,  diagnosis: "فقر الدم بسبب نقص الحديد (الدرجة المتوسطة)",   notes: "تعديل النظام الغذائي لزيادة الأطعمة الغنية بالحديد، مع تناول مكملات الحديد وفيتامين ب12." },
    { patient: p1._id,  doctor: doctor1._id, appointment: completedApts[3]._id,  diagnosis: "ارتفاع ضغط الدم الأولي — متابعة دورية",        notes: "تحسن ملحوظ في قراءات الضغط. الاستمرار في الدواء مع قياس الضغط يومياً والتقليل من الملح." },
    { patient: p6._id,  doctor: doctor1._id, appointment: completedApts[4]._id,  diagnosis: "ارتفاع ضغط الدم مع زيادة الوزن",               notes: "بدء نظام غذائي صارم وخفض الوزن هدف أساسي. تعديل جرعة دواء الضغط." },
    { patient: p2._id,  doctor: doctor2._id, appointment: completedApts[6]._id,  diagnosis: "التهاب جلدي تحسسي حاد (Contact Dermatitis)",    notes: "تجنب المواد المسببة للحساسية، استخدام الكريم الموصوف مرتين يومياً. عدم الخدش." },
    { patient: p5._id,  doctor: doctor2._id, appointment: completedApts[7]._id,  diagnosis: "حب الشباب الشديد (Acne Vulgaris Grade III)",    notes: "بدء علاج الإيزوتريتينوين مع متابعة وظائف الكبد والدهون شهرياً. تجنب الشمس." },
    { patient: p7._id,  doctor: doctor2._id, appointment: completedApts[8]._id,  diagnosis: "الإكزيما التأتبية المزمنة",                     notes: "ترطيب الجلد بانتظام، تجنب الصابون القلوي. استخدام Tacrolimus موضعياً." },
    { patient: p11._id, doctor: doctor2._id, appointment: completedApts[9]._id,  diagnosis: "البهاق (Vitiligo) — المراحل الأولى",            notes: "بدء جلسات العلاج الضوئي (PUVA). وقاية من الشمس ضرورية." },
    { patient: p3._id,  doctor: doctor3._id, appointment: completedApts[11]._id, diagnosis: "التهاب الجهاز التنفسي العلوي مع الحمى",         notes: "الراحة التامة وتناول السوائل الدافئة، المضاد الحيوي لمنع العدوى الثانوية." },
    { patient: p9._id,  doctor: doctor3._id, appointment: completedApts[12]._id, diagnosis: "نمو طبيعي، حالة صحية ممتازة",                  notes: "اللقاحات المطلوبة تمت. المتابعة بعد 3 أشهر." },
    { patient: p5._id,  doctor: doctor3._id, appointment: completedApts[13]._id, diagnosis: "عدوى فيروسية في الجهاز التنفسي",               notes: "علاج أعراضي بالباراسيتامول وفيتامين C. الراحة والسوائل الكافية." },
    { patient: p4._id,  doctor: doctor4._id, appointment: completedApts[15]._id, diagnosis: "الصداع النصفي الكلاسيكي مع أورة",              notes: "تجنب المثيرات (الضوء، الضجيج، القهوة). الراحة في غرفة مظلمة هادئة عند الهجمة." },
    { patient: p8._id,  doctor: doctor4._id, appointment: completedApts[16]._id, diagnosis: "اعتلال الأعصاب الطرفي (Peripheral Neuropathy)", notes: "السيطرة على السكر أساسية لمنع تطور التنميل. متابعة شهرية مطلوبة." },
    { patient: p13._id, doctor: doctor4._id, appointment: completedApts[17]._id, diagnosis: "الصداع النصفي المزمن بدون أورة",               notes: "بدء علاج وقائي بـ Amitriptyline. تسجيل مذكرة الصداع اليومية." },
    { patient: p6._id,  doctor: doctor5._id, appointment: completedApts[19]._id, diagnosis: "التهاب الجيوب الأنفية المزمن الجرثومي",        notes: "مضاد حيوي لمدة أسبوع مع غسول أنفي يومي. المتابعة بعد 2 أسبوع." },
    { patient: p10._id, doctor: doctor5._id, appointment: completedApts[20]._id, diagnosis: "الطنين الأذني مع ضعف السمع التوصيلي",          notes: "تجنب الأصوات العالية. استخدام واقي الأذن. الرجوع إذا ازداد الضعف السمعي." },
    { patient: p7._id,  doctor: doctor6._id, appointment: completedApts[22]._id, diagnosis: "خراج سني حاد في الضرس السادس السفلي",          notes: "تم تصريف الخراج وتنظيف قناة الجذر. المضاد الحيوي لمنع العدوى المتبقية." },
    { patient: p1._id,  doctor: doctor6._id, appointment: completedApts[23]._id, diagnosis: "أسنان بحالة جيدة - تنظيف دوري",                notes: "التنظيف بالجهاز كل 6 أشهر. استخدام خيط الأسنان يومياً." },
    { patient: p9._id,  doctor: doctor7._id, appointment: completedApts[25]._id, diagnosis: "التهاب ملتحمة جرثومي حاد",                    notes: "قطرات المضاد الحيوي لمدة أسبوع. تجنب لمس العين وغسل اليدين." },
    { patient: p14._id, doctor: doctor7._id, appointment: completedApts[26]._id, diagnosis: "ارتفاع ضغط العين (Ocular Hypertension)",       notes: "قطرات Latanoprost يومياً. متابعة الضغط شهرياً لتجنب الجلوكوما." },
    { patient: p8._id,  doctor: doctor8._id, appointment: completedApts[28]._id, diagnosis: "التهاب مفصل الركبة التنكسي (Osteoarthritis)",  notes: "تخفيف الوزن ضروري. العلاج الطبيعي 3 مرات أسبوعياً. تجنب الصعود للطوابق." },
    { patient: p11._id, doctor: doctor8._id, appointment: completedApts[29]._id, diagnosis: "هشاشة العظام (Osteoporosis Grade II)",         notes: "مكملات الكالسيوم وفيتامين D يومياً. تمارين حمل الأوزان الخفيفة." },
    { patient: p14._id, doctor: doctor9._id, appointment: completedApts[31]._id, diagnosis: "أمراض الشريان التاجي مع ذبحة صدرية مستقرة",   notes: "الاستمرار في الأسبرين والستاتين مدى الحياة. ممارسة رياضة خفيفة 30 دقيقة يومياً. متابعة شهرية." },
    { patient: p1._id,  doctor: doctor9._id, appointment: completedApts[32]._id, diagnosis: "اضطراب نظم القلوب الانتيابي (PAT)",            notes: "تسجيل الهولتر. تجنب الكافيين والتوتر. بروبرانولول وقائي." },
  ];

  await saveOrValidate(MedicalReport, reportsData);
  console.log(dryRun ? "🔍 Medical Reports validated" : "✅ Original medical reports created");

  // ── 11. REVIEWS (Original) ────────────────────────────────────────────────
  const originalReviews = [
    { patient: p1._id,  doctor: doctor1._id, appointment: completedApts[0]._id,  stars: 5,   comment: "دكتور ممتاز ومتعاون جداً، شرح الحالة بشكل مفصل وأنصح به بشدة لكل مريض" },
    { patient: p2._id,  doctor: doctor1._id, appointment: completedApts[1]._id,  stars: 4.5, comment: "تجربة ممتازة، الدكتور محترف ودقيق جداً في التشخيص ومتابعة المريض" },
    { patient: p3._id,  doctor: doctor1._id, appointment: completedApts[2]._id,  stars: 4,   comment: "دكتور كفء ومتمكن، لكن الانتظار كان طويلاً بعض الشيء" },
    { patient: p6._id,  doctor: doctor1._id, appointment: completedApts[4]._id,  stars: 4.5, comment: "من أفضل الأطباء، يعطي وقتاً كافياً لكل مريض ويهتم بالتفاصيل" },
    { patient: p2._id,  doctor: doctor2._id, appointment: completedApts[6]._id,  stars: 5,   comment: "الدكتورة متميزة جداً ومهتمة بالمريض، العلاج فعّال وشفائي جداً" },
    { patient: p5._id,  doctor: doctor2._id, appointment: completedApts[7]._id,  stars: 4,   comment: "نتائج جيدة جداً، شرحت العلاج بوضوح وكانت متعاونة" },
    { patient: p7._id,  doctor: doctor2._id, appointment: completedApts[8]._id,  stars: 4.5, comment: "طبيبة ممتازة، تشرح بشكل مبسط وواضح والعلاج محسوس فارق" },
    { patient: p11._id, doctor: doctor2._id, appointment: completedApts[9]._id,  stars: 5,   comment: "تجربة رائعة، الدكتورة صبورة ومتفهمة للحالة وتتابع باستمرار" },
    { patient: p3._id,  doctor: doctor3._id, appointment: completedApts[11]._id, stars: 5,   comment: "دكتور رائع جداً مع الأطفال، صبور ومطمئن وبيتعامل معاهم بحنان" },
    { patient: p9._id,  doctor: doctor3._id, appointment: completedApts[12]._id, stars: 4.5, comment: "طبيب ممتاز وخبرته واضحة، أنصح كل أم تروح له" },
    { patient: p5._id,  doctor: doctor3._id, appointment: completedApts[13]._id, stars: 4,   comment: "دكتور محترف ومتمكن، العيادة نظيفة والاستقبال ممتاز" },
    { patient: p4._id,  doctor: doctor4._id, appointment: completedApts[15]._id, stars: 4.5, comment: "تشخيص دقيق جداً وعلاج فعّال للصداع النصفي المزمن، شكراً دكتور" },
    { patient: p8._id,  doctor: doctor4._id, appointment: completedApts[16]._id, stars: 4,   comment: "طبيب متخصص وخبير، يشرح الحالة بوضوح ويقترح أفضل الحلول" },
    { patient: p13._id, doctor: doctor4._id, appointment: completedApts[17]._id, stars: 5,   comment: "مريضة قديمة عنده، من أفضل أطباء الأعصاب على الإطلاق" },
    { patient: p6._id,  doctor: doctor5._id, appointment: completedApts[19]._id, stars: 3.5, comment: "الدكتور كفء ومتمكن لكن كان مشغولاً ولم يتوسع في الشرح" },
    { patient: p10._id, doctor: doctor5._id, appointment: completedApts[20]._id, stars: 4,   comment: "تجربة جيدة، التشخيص كان صحيح والعلاج ساعد كثيراً" },
    { patient: p7._id,  doctor: doctor6._id, appointment: completedApts[22]._id, stars: 5,   comment: "أفضل دكتور أسنان تعاملت معه على الإطلاق، يد خفيفة وعمل دقيق" },
    { patient: p1._id,  doctor: doctor6._id, appointment: completedApts[23]._id, stars: 4.5, comment: "عيادة مريحة جداً والدكتور ماهر ويريحك من أول لحظة دخول" },
    { patient: p9._id,  doctor: doctor7._id, appointment: completedApts[25]._id, stars: 4.5, comment: "الدكتورة شاطرة جداً، شرحت كل شيء وأعطت علاج مناسب وسريع" },
    { patient: p14._id, doctor: doctor7._id, appointment: completedApts[26]._id, stars: 4,   comment: "طبيبة متخصصة وخبرتها واضحة في فحص العيون" },
    { patient: p8._id,  doctor: doctor8._id, appointment: completedApts[28]._id, stars: 5,   comment: "دكتور عظام ممتاز ومحترف، شرح الحالة بشكل مفصل وأعطى خطة علاج شاملة" },
    { patient: p11._id, doctor: doctor8._id, appointment: completedApts[29]._id, stars: 4.5, comment: "تجربة ممتازة، الدكتور صبور ويأخذ وقته مع كل مريض" },
    { patient: p14._id, doctor: doctor9._id, appointment: completedApts[31]._id, stars: 5,   comment: "دكتورة قلب ممتازة، شرحت حالة القلب بالتفصيل وأعطت خطة علاجية واضحة" },
    { patient: p6._id,  doctor: doctor9._id, appointment: completedApts[33]._id, stars: 4,   comment: "طبيبة محترفة ومتمكنة، طمأنتني كثيراً وأوضحت الحالة بشكل مريح" },
  ];

  if (dryRun) {
    for (const rev of originalReviews) {
      await new Review(rev).validate();
    }
  } else {
    for (const rev of originalReviews) {
      await Review.create(rev);
    }
  }
  console.log(dryRun ? "🔍 Reviews validated" : "✅ Original reviews created");

  // ── 12. MORE RECEPTIONISTS (2 new -> 5 total) ──────────────────────────────
  const newReceptionistsData = [
    { _id: new mongoose.Types.ObjectId(), firstName: "منى",   lastName: "زكي",   gender: "female", birthDate: new Date("1996-05-18"), phone: "01057777777", role: "receptionist", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
    { _id: new mongoose.Types.ObjectId(), firstName: "حسام",  lastName: "البدري", gender: "male",   birthDate: new Date("1992-09-05"), phone: "01058888888", role: "receptionist", password: HASHED_PASSWORD, isPreHashed: true, photo: "" },
  ];

  await saveOrValidate(User, newReceptionistsData);

  const [rec4, rec5] = newReceptionistsData;

  const newReceptionistProfilesData = [
    { user: rec4._id, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], education: "بكالوريوس تجارة", status: "active", startTime: "08:00", endTime: "16:00" },
    { user: rec5._id, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], education: "دبلوم تمريض", status: "active", startTime: "12:00", endTime: "20:00" },
  ];

  await saveOrValidate(Receptionist, newReceptionistProfilesData);
  console.log(dryRun ? "🔍 New Receptionists + profiles validated" : "✅ More Receptionists created");

  // ── 13. MORE PATIENTS (15 new -> 30 total) ──────────────────────────────────
  const newPatientData = [
    { firstName: "أحمد",  lastName: "مراد",    gender: "male",   birthDate: "1991-03-12", phone: "01211111101" },
    { firstName: "نهى",   lastName: "الشريف",  gender: "female", birthDate: "1994-07-22", phone: "01211111102" },
    { firstName: "عادل",  lastName: "إمام",    gender: "male",   birthDate: "1980-05-17", phone: "01211111103" },
    { firstName: "شريف",  lastName: "منير",    gender: "male",   birthDate: "1985-04-10", phone: "01211111104" },
    { firstName: "منى",   lastName: "واصف",    gender: "female", birthDate: "1978-02-01", phone: "01211111105" },
    { firstName: "درة",   lastName: "زروق",    gender: "female", birthDate: "1989-11-14", phone: "01211111106" },
    { firstName: "كريم",  lastName: "عبدالعزيز", gender: "male",   birthDate: "1982-10-12", phone: "01211111107" },
    { firstName: "أحمد",  lastName: "عز",      gender: "male",   birthDate: "1984-08-20", phone: "01211111108" },
    { firstName: "يسرا",  lastName: "جمال",    gender: "female", birthDate: "1980-03-10", phone: "01211111109" },
    { firstName: "شيرين", lastName: "عبدالوهاب", gender: "female", birthDate: "1986-10-08", phone: "01211111110" },
    { firstName: "ياسمين", lastName: "صبري",    gender: "female", birthDate: "1992-01-21", phone: "01211111111" },
    { firstName: "تامر",  lastName: "حسني",    gender: "male",   birthDate: "1987-08-16", phone: "01211111112" },
    { firstName: "عمرو",  lastName: "دياب",    gender: "male",   birthDate: "1979-10-11", phone: "01211111113" },
    { firstName: "محمد",  lastName: "حماقي",   gender: "male",   birthDate: "1983-11-04", phone: "01211111114" },
    { firstName: "محمود",  lastName: "العسيلي",  gender: "male",   birthDate: "1988-06-24", phone: "01211111115" },
  ];

  const formattedPatientData = newPatientData.map(p => ({
    _id: new mongoose.Types.ObjectId(),
    ...p,
    birthDate: new Date(p.birthDate),
    role: "patient",
    password: HASHED_PASSWORD,
    isPreHashed: true,
    photo: ""
  }));

  await saveOrValidate(User, formattedPatientData);

  const newPatientUsers = formattedPatientData;

  const bloodTypes = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"];
  const allergiesList = [["Penicillin"], [], ["Aspirin"], [], ["Sulfa"], [], ["Latex"], ["Codeine"]];
  const chronicList = [["Hypertension"], [], ["Diabetes Type 2"], ["Asthma"], [], ["Migraine"], []];
  const medsList = [["Amlodipine 5mg"], [], ["Metformin 500mg"], ["Salbutamol inhaler"], [], ["Propranolol 40mg"], []];

  const newPatientProfilesData = newPatientUsers.map((u, i) => ({
    user: u._id,
    bloodType: bloodTypes[i % bloodTypes.length],
    allergies: allergiesList[i % allergiesList.length],
    chronicConditions: chronicList[i % chronicList.length],
    chronicMedications: medsList[i % medsList.length],
    tall: 150 + (i * 2) % 40,
    weight: 50 + (i * 3) % 60,
    smoking: i % 5 === 0,
    favoriteDoctors: []
  }));

  await saveOrValidate(PatientProfile, newPatientProfilesData);
  console.log(dryRun ? "🔍 New Patients + profiles validated" : "✅ More Patients created");

  // ── 14. MORE DOCTORS (15 new -> 24 total, 2 doctors per specialization) ────
  const newDoctorData = [
    { firstName: "أشرف",   lastName: "البنا",     gender: "male",   birthDate: "1976-06-09", phone: "01500000001", spec: ophthalmology, notes: "متخصص في جراحة الليزك وتصحيح النظر" },
    { firstName: "وليد",   lastName: "بشير",      gender: "male",   birthDate: "1972-07-20", phone: "01500000002", spec: neurology, notes: "متخصص في الجراحة العصبية وإصابات العمود الفقري" },
    { firstName: "إيهاب",  lastName: "خليل",      gender: "male",   birthDate: "1979-08-05", phone: "01500000003", spec: ent, notes: "متخصص في جراحة الأنف وإصلاح الحاجز الأنفي" },
    { firstName: "سامي",   lastName: "العمري",    gender: "male",   birthDate: "1977-11-03", phone: "01500000004", spec: dermatology, notes: "متخصص في أمراض الجلد وعلاج الصدفية" },
    { firstName: "حسن",    lastName: "الطيب",     gender: "male",   birthDate: "1975-02-08", phone: "01500000005", spec: pediatrics, notes: "متخصص في طب الأطفال حديثي الولادة" },
    { firstName: "طارق",   lastName: "الجوهري",   gender: "male",   birthDate: "1981-04-12", phone: "01500000006", spec: internalMedicine, notes: "متخصص في أمراض الجهاز الهضمي والكبد" },
    { firstName: "مصطفى",  lastName: "عوض",       gender: "male",   birthDate: "1980-10-14", phone: "01500000007", spec: dentistry, notes: "متخصص في زراعة الأسنان والتيجان الخزفية" },
    { firstName: "يحيى",   lastName: "صبري",      gender: "male",   birthDate: "1974-02-28", phone: "01500000008", spec: orthopedics, notes: "جراح عظام متخصص في استبدال المفاصل" },
    { firstName: "جمال",   lastName: "النجار",    gender: "male",   birthDate: "1971-09-06", phone: "01500000009", spec: cardiology, notes: "متخصص في القسطرة التدخلية وأمراض الصمامات" },
    { firstName: "سلوى",   lastName: "سليمان",    gender: "female", birthDate: "1983-05-12", phone: "01500000010", spec: obgyn, notes: "متخصصة في طب النساء والتوليد والعقم" },
    { firstName: "نهلة",   lastName: "الجيار",    gender: "female", birthDate: "1987-12-14", phone: "01500000011", spec: obgyn, notes: "متابعة الحمل الحرج والولادة الطبيعية والقيصرية" },
    { firstName: "خالد",   lastName: "المنشاوي",  gender: "male",   birthDate: "1978-03-24", phone: "01500000012", spec: urology, notes: "متخصص في جراحة المسالك البولية والتناسلية" },
    { firstName: "أسامة",   lastName: "حسن",      gender: "male",   birthDate: "1982-11-20", phone: "01500000013", spec: urology, notes: "علاج حصوات الكلى والمسالك البولية بالمنظار" },
    { firstName: "محمد",   lastName: "شفيق",      gender: "male",   birthDate: "1980-01-15", phone: "01500000014", spec: pulmonology, notes: "علاج الربو الشعبي والحساسية الصدرية" },
    { firstName: "نادية",  lastName: "شكري",      gender: "female", birthDate: "1985-09-08", phone: "01500000015", spec: pulmonology, notes: "متخصصة في أمراض الجهاز التنفسي والدرن" }
  ];

  const formattedDoctorUsersData = newDoctorData.map(d => ({
    _id: new mongoose.Types.ObjectId(),
    firstName: d.firstName,
    lastName: d.lastName,
    gender: d.gender,
    birthDate: new Date(d.birthDate),
    phone: d.phone,
    role: "doctor",
    password: HASHED_PASSWORD,
    isPreHashed: true,
    photo: "",
    notes: d.notes
  }));

  await saveOrValidate(User, formattedDoctorUsersData);

  const newDocUsers = formattedDoctorUsersData;

  const newDoctorProfilesData = newDocUsers.map((u, i) => ({
    user: u._id,
    specialization: newDoctorData[i].spec._id,
    experienceYears: 5 + (i * 2) % 15,
    workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"],
    startTime: "09:00",
    endTime: "17:00"
  }));

  await saveOrValidate(DoctorProfile, newDoctorProfilesData);
  console.log(dryRun ? "🔍 New Doctors + profiles validated" : "✅ More Doctors created");

  // ── 15. RELATIONAL DATA FOR NEW DOCTORS ────────────────────────────────────
  const specMap = {
    "الباطنة": {
      reasons: ["ارتفاع ضغط الدم","آلام المعدة والحرقان","إرهاق عام وشحوب","غثيان وقيء متكرر","فحص دوري شامل"],
      diagnoses: ["التهاب المعدة الحاد مع الارتجاع المريئي", "ارتفاع ضغط الدم الأولي", "عسر الهضم ونقص الحديد"],
      medicines: [
        { name: "Omeprazole", dose: "20mg", frequency: "مرة يومياً", duration: "14 يوم" },
        { name: "Antacid Gel", dose: "10ml", frequency: "عند الحاجة", duration: "14 يوم" }
      ]
    },
    "الجلدية والتجميل": {
      reasons: ["طفح جلدي وحكة","حب الشباب الشديد","إكزيما مزمنة","بقع بيضاء في الجلد"],
      diagnoses: ["التهاب جلدي تحسسي حاد", "حب الشباب الشديد (درجة ثالثة)", "إكزيما تأتبية مزمنة"],
      medicines: [
        { name: "Cetirizine", dose: "10mg", frequency: "مرة يومياً", duration: "14 يوم" },
        { name: "Betamethasone cream", dose: "موضعي", frequency: "مرتين يومياً", duration: "10 أيام" }
      ]
    },
    "الأطفال": {
      reasons: ["حمى وسعال","لقاحات ومتابعة","التهاب اللوزتين","كحة وزكام"],
      diagnoses: ["التهاب الجهاز التنفسي العلوي مع الحمى", "التهاب اللوزتين الحاد", "نزلة برد فيروسية"],
      medicines: [
        { name: "Paracetamol syrup", dose: "125mg/5ml", frequency: "كل 6 ساعات عند اللزوم", duration: "3 أيام" },
        { name: "Amoxicillin suspension", dose: "250mg", frequency: "كل 8 ساعات", duration: "7 أيام" }
      ]
    },
    "مخ وأعصاب": {
      reasons: ["صداع نصفي مزمن","تنميل في الأطراف","دوار ودوخة","ضعف في العضلات"],
      diagnoses: ["صداع نصفي كلاسيكي مع أورة", "اعتلال الأعصاب الطرفية", "دوار دهليزي حاد"],
      medicines: [
        { name: "Sumatriptan", dose: "50mg", frequency: "عند هجمة الصداع", duration: "عند الحاجة" },
        { name: "Gabapentin", dose: "300mg", frequency: "مرة يومياً ليلاً", duration: "30 يوم" }
      ]
    },
    "أنف وأذن وحنجرة": {
      reasons: ["احتقان الأنف","طنين الأذن","التهاب اللوزتين","ضعف السمع","ألم الجيوب الأنفية"],
      diagnoses: ["التهاب الجيوب الأنفية المزمن الجرثومي", "التهاب الأذن الوسطى الحاد", "احتقان الحلق البكتيري"],
      medicines: [
        { name: "Augmentin", dose: "1g", frequency: "مرتين يومياً", duration: "7 أيام" },
        { name: "Mometasone nasal spray", dose: "بختين في كل فتحة", frequency: "مرة يومياً", duration: "14 يوم" }
      ]
    },
    "الفم والأسنان": {
      reasons: ["ألم في الأسنان","تنظيف دوري","حشو ضرس","تقويم الأسنان"],
      diagnoses: ["تسوس أسنان عميق بالضرس السفلي", "التهاب اللثة الحاد", "خراج سني بحاجة لتنظيف عصب"],
      medicines: [
        { name: "Ibuprofen", dose: "400mg", frequency: "كل 8 ساعات بعد الأكل", duration: "5 أيام" },
        { name: "Chlorhexidine mouthwash", dose: "مضمضة", frequency: "مرتين يومياً", duration: "7 أيام" }
      ]
    },
    "العين": {
      reasons: ["ضعش النظر","احمرار وحرقة","جفاف العيون","ضغط العين"],
      diagnoses: ["التهاب ملتحمة جرثومي حاد", "جفاف شديد بالقرنية", "ضعف نظر انكساري (استجماتيزم)"],
      medicines: [
        { name: "Tobramycin eye drops", dose: "قطرة", frequency: "4 مرات يومياً", duration: "7 أيام" },
        { name: "Artificial Tears", dose: "قطرة مرطبة", frequency: "عند الحاجة", duration: "30 يوم" }
      ]
    },
    "العظام والمفاصل": {
      reasons: ["ألم الركبة","آلام أسفل الظهر","كسر وإصابة","التهاب المفاصل"],
      diagnoses: ["خشونة الركبة من الدرجة الثانية", "انزلاق غضروفي بسيط بالفقرات القطنية", "التهاب أوتار الكتف"],
      medicines: [
        { name: "Diclofenac potassium", dose: "50mg", frequency: "مرتين يومياً بعد الأكل", duration: "10 أيام" },
        { name: "Glucosamine compound", dose: "1500mg", frequency: "مرة يومياً", duration: "60 يوم" }
      ]
    },
    "القلب والأوعية الدموية": {
      reasons: ["ألم في الصدر","ضيق التنفس","خفقان القلب","ارتفاع ضغط الدم"],
      diagnoses: ["ذبحة صدرية مستقرة وقصور بالشرايين", "اضطراب بسيط في ضربات القلب", "ارتفاع ضغط الدم الشرياني"],
      medicines: [
        { name: "Aspirin protect", dose: "81mg", frequency: "مرة يومياً بعد الغداء", duration: "مستمر" },
        { name: "Atorvastatin", dose: "20mg", frequency: "مرة يومياً ليلاً", duration: "مستمر" }
      ]
    },
    "النساء والتوليد": {
      reasons: ["متابعة الحمل الدوري", "آلام أسفل البطن", "متابعة كيس المبيض", "تأخر الحمل وعلاجه"],
      diagnoses: ["متابعة حمل طبيعي في الثلث الثاني", "تكيس المبايض البسيط", "التهاب الحوض خفيف"],
      medicines: [
        { name: "Folic Acid", dose: "5mg", frequency: "مرة يومياً", duration: "30 يوم" },
        { name: "Iron & Calcium supplements", dose: "كبسولة", frequency: "مرة يومياً", duration: "30 يوم" }
      ]
    },
    "المسالك البولية": {
      reasons: ["آلام في الجانب وحصوات الكلى", "صعوبة وحرقان التبول", "التهابات البروستاتا", "فحص دوري للمسالك البولية"],
      diagnoses: ["رمل وحصوات صغيرة بالحالب", "التهاب مجاري بولية بكتيري", "احتقان البروستاتا الحميد"],
      medicines: [
        { name: "Ciprofloxacin", dose: "500mg", frequency: "مرتين يومياً", duration: "7 أيام" },
        { name: "Urosolvine effervescent", dose: "كيس فوار", frequency: "3 مرات يومياً", duration: "5 أيام" }
      ]
    },
    "الصدر والجهاز التنفسي": {
      reasons: ["سعال مستمر وضيق تنفس", "أزمة ربوية حادة", "التهاب شعبي حاد", "حساسية الصدر الموسمية"],
      diagnoses: ["نزلات شعبية حادة مع ضيق بالصدر", "ربو شعبي غير متحكم به جيداً", "حساسية صدرية مزمنة"],
      medicines: [
        { name: "Salbutamol inhaler", dose: "بختين", frequency: "عند اللزوم", duration: "مستمر" },
        { name: "Montelukast", dose: "10mg", frequency: "مرة يومياً قبل النوم", duration: "30 يوم" }
      ]
    }
  };

  const allPatients = [...patientUsersData, ...newPatientUsers];
  const commentsPool = [
    "دكتور ممتاز جداً وخلوق والتشخيص دقيق للغاية وأنصح به",
    "عيادة نظيفة واستقبال رائع والدكتور صبور جداً في الاستماع للحالة",
    "طبيب ممتاز وخبرته واضحة في العلاج والتعامل مريح جداً",
    "شرح لي الدكتور المشكلة بالتفصيل ووصف العلاج المناسب، شكراً جزيلاً"
  ];

  let patientIndex = 0;
  const newAppointments = [];
  const newPrescriptions = [];
  const newMedicalReports = [];
  const newReviews = [];

  for (let i = 0; i < newDocUsers.length; i++) {
    const doc = newDocUsers[i];
    const docInfo = newDoctorData[i];
    const specName = docInfo.spec.name;
    const specDetails = specMap[specName];

    // 1. Generate 2 Completed appointments
    const pat1 = allPatients[patientIndex % allPatients.length];
    patientIndex++;
    const pat2 = allPatients[patientIndex % allPatients.length];
    patientIndex++;

    const compAppt1 = {
      _id: new mongoose.Types.ObjectId(),
      patient: pat1._id,
      doctor: doc._id,
      date: past(15),
      slotTime: "10:00",
      status: "مكتمل",
      fees: docInfo.spec.consultationFee,
      reason: specDetails.reasons[0 % specDetails.reasons.length],
      isRated: true
    };
    const compAppt2 = {
      _id: new mongoose.Types.ObjectId(),
      patient: pat2._id,
      doctor: doc._id,
      date: past(10),
      slotTime: "10:25",
      status: "مكتمل",
      fees: docInfo.spec.consultationFee,
      reason: specDetails.reasons[1 % specDetails.reasons.length],
      isRated: true
    };

    newAppointments.push(compAppt1, compAppt2);

    // 2. Generate 1 Medical Report per completed appointment
    newMedicalReports.push({
      patient: pat1._id,
      doctor: doc._id,
      appointment: compAppt1._id,
      diagnosis: specDetails.diagnoses[0 % specDetails.diagnoses.length],
      notes: "متابعة دورية وتجنب الاجهاد والالتزام بالراحة."
    });
    newMedicalReports.push({
      patient: pat2._id,
      doctor: doc._id,
      appointment: compAppt2._id,
      diagnosis: specDetails.diagnoses[1 % specDetails.diagnoses.length],
      notes: "الراحة التامة والالتزام بالعلاج الموصوف والمتابعة."
    });

    // 3. Generate 1 Prescription per completed appointment
    newPrescriptions.push({
      patient: pat1._id,
      doctor: doc._id,
      appointment: compAppt1._id,
      medicines: specDetails.medicines
    });
    newPrescriptions.push({
      patient: pat2._id,
      doctor: doc._id,
      appointment: compAppt2._id,
      medicines: specDetails.medicines
    });

    // 4. Generate Reviews (one per unique patient-doctor pair)
    newReviews.push({
      patient: pat1._id,
      doctor: doc._id,
      appointment: compAppt1._id,
      stars: 4.5 + (i % 2) * 0.5,
      comment: commentsPool[i % commentsPool.length]
    });
    newReviews.push({
      patient: pat2._id,
      doctor: doc._id,
      appointment: compAppt2._id,
      stars: 4 + (i % 3) * 0.5,
      comment: commentsPool[(i + 1) % commentsPool.length]
    });

    // 5. Generate 10 Upcoming appointments
    const slots = ["09:00", "09:25", "10:00", "10:25", "11:00", "11:25", "12:00", "12:25", "13:00", "13:25"];
    
    // Tomorrow: 2 slots
    for (let j = 0; j < 2; j++) {
      const pat = allPatients[patientIndex % allPatients.length];
      patientIndex++;
      newAppointments.push({
        patient: pat._id,
        doctor: doc._id,
        date: future(1),
        slotTime: slots[j],
        status: "قيد الانتظار",
        fees: docInfo.spec.consultationFee,
        reason: specDetails.reasons[j % specDetails.reasons.length]
      });
    }
    // This week: 3 slots
    for (let j = 2; j < 5; j++) {
      const pat = allPatients[patientIndex % allPatients.length];
      patientIndex++;
      newAppointments.push({
        patient: pat._id,
        doctor: doc._id,
        date: future(j - 1),
        slotTime: slots[j],
        status: "مؤكد",
        fees: docInfo.spec.consultationFee,
        reason: specDetails.reasons[j % specDetails.reasons.length]
      });
    }
    // Next week: 3 slots
    for (let j = 5; j < 8; j++) {
      const pat = allPatients[patientIndex % allPatients.length];
      patientIndex++;
      newAppointments.push({
        patient: pat._id,
        doctor: doc._id,
        date: future(6 + j - 5),
        slotTime: slots[j],
        status: "قيد الانتظار",
        fees: docInfo.spec.consultationFee,
        reason: specDetails.reasons[j % specDetails.reasons.length]
      });
    }
    // Next month: 2 slots
    for (let j = 8; j < 10; j++) {
      const pat = allPatients[patientIndex % allPatients.length];
      patientIndex++;
      newAppointments.push({
        patient: pat._id,
        doctor: doc._id,
        date: future(30 + j - 8),
        slotTime: slots[j],
        status: "قيد الانتظار",
        fees: docInfo.spec.consultationFee,
        reason: specDetails.reasons[j % specDetails.reasons.length]
      });
    }
  }

  // Save all programmatically generated appointments, reports, and prescriptions
  await saveOrValidate(Appointment, newAppointments);
  await saveOrValidate(MedicalReport, newMedicalReports);
  await saveOrValidate(Prescription, newPrescriptions);

  // Save reviews
  if (dryRun) {
    for (const rev of newReviews) {
      await new Review(rev).validate();
    }
    console.log("🔍 New Reviews validated");
  } else {
    for (const rev of newReviews) {
      await Review.create(rev);
    }
    console.log("✅ Relational data for new doctors created successfully");
  }

  // ── FINAL STATS ───────────────────────────────────────────────────────────
  let finalSpecs, finalDoctors, finalPatients, finalRecep, finalApts, finalPresc, finalReports, finalReviews, finalActivities;

  if (dryRun) {
    finalSpecs = specData.length;
    finalDoctors = doctorProfilesData.length + newDoctorProfilesData.length;
    finalRecep = receptionistProfilesData.length + newReceptionistProfilesData.length;
    finalPatients = patientProfilesData.length + newPatientProfilesData.length;
    finalApts = completedAptsData.length + upcomingAptsData.length + newAppointments.length;
    finalPresc = prescriptionsData.length + newPrescriptions.length;
    finalReports = reportsData.length + newMedicalReports.length;
    finalReviews = originalReviews.length + newReviews.length;
    finalActivities = 0;
  } else {
    finalSpecs = await Specialization.countDocuments();
    finalDoctors = await DoctorProfile.countDocuments();
    finalPatients = await PatientProfile.countDocuments();
    finalRecep = await Receptionist.countDocuments();
    finalApts = await Appointment.countDocuments();
    finalPresc = await Prescription.countDocuments();
    finalReports = await MedicalReport.countDocuments();
    finalReviews = await Review.countDocuments();
    finalActivities = await Activity.countDocuments();
  }

  console.log(dryRun ? "\n🎉 Dry run validation completed successfully! (No database changes made)\n" : "\n🎉 Database seeded successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐  All passwords → Test@1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👤  Admin phone:    01000000000  (توفيق عبدالله)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👨‍⚕️  Doctor phones (5 examples):");
  console.log("    01011111111  (أحمد الألفي)     |  01022222222  (أماني العطار)");
  console.log("    01033333333  (يمان علاء)       |  01034444444  (جلال عبدالله)");
  console.log("    01035555555  (سارة سلامة)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🗂️  Receptionist phones:");
  console.log("    01044444444  (نور طارق)        |  01055555555  (عمر يوسف)");
  console.log("    01056666666  (هبة سعيد)        |  01057777777  (منى زكي)");
  console.log("    01058888888  (حسام البدري)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧑  Patient phones (5 examples):");
  console.log("    01066666666  (محمد حسين)       |  01077777777  (مروة خالد)");
  console.log("    01088888888  (نور باسم)        |  01099999999  (علي يوسف)");
  console.log("    01111111111  (سلوى حمدي)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📊  Stats Summary:`);
  console.log(`    ${finalSpecs} specializations | ${finalDoctors} doctors | ${finalRecep} receptionists | ${finalPatients} patients`);
  console.log(`    ${finalApts} total appointments`);
  console.log(`    ${finalPresc} prescriptions | ${finalReports} medical reports | ${finalReviews} reviews`);
  console.log(`    ${finalActivities} activity logs (cleared to 0)`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});