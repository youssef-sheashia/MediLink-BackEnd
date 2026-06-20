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

const HASHED_PASSWORD = await bcrypt.hash("Test@1234", 12);

const seed = async () => {
  await mongoose.connect(process.env.LOCAL_DATABASE);
  console.log("✅ DB connected");

  // ── 1. CLEAN ──────────────────────────────────────────────────────────────
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
  const [cardiology, dermatology, pediatrics, neurology, orthopedics, dentistry, ophthalmology] =
    await Specialization.insertMany([
      { name: "أمراض القلب والأوعية الدموية", consultationFee: 300 },
      { name: "الأمراض الجلدية والتناسلية",   consultationFee: 200 },
      { name: "طب الأطفال وحديثي الولادة",    consultationFee: 150 },
      { name: "المخ والأعصاب",                consultationFee: 350 },
      { name: "العظام والمفاصل",              consultationFee: 250 },
      { name: "الفم والأسنان",                consultationFee: 180 },
      { name: "طب وجراحة العيون",             consultationFee: 220 },
    ]);
  console.log("✅ Specializations created (7)");

  // ── 3. CLINIC ─────────────────────────────────────────────────────────────
  await Clinic.create({
    name: "Medilink Clinic",
    address: "Egypt, Cairo, Nasr City",
    description: "عيادة ميديلينك متخصصة في تقديم خدمات طبية متكاملة بأعلى معايير الجودة والرعاية الصحية.",
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
  });
  console.log("✅ Clinic created");

  // ── 4. ADMIN ──────────────────────────────────────────────────────────────
  await User.create({
    firstName: "توفيق",
    lastName: "عبدالله",
    gender: "male",
    birthDate: new Date("1975-03-10"),
    phone: "01000000000",
    role: "admin",
    password: HASHED_PASSWORD,
    isPreHashed: true,
  });
  console.log("✅ Admin created");

  // ── 5. DOCTORS (7 doctors — one per specialization) ───────────────────────
  const doctorUsers = await User.insertMany([
    { firstName: "أحمد",   lastName: "الألفي",   gender: "male",   birthDate: new Date("1978-05-15"), phone: "01011111111", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "أماني",  lastName: "العطار",   gender: "female", birthDate: new Date("1983-08-20"), phone: "01022222222", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "يمان",   lastName: "علاء",     gender: "male",   birthDate: new Date("1976-03-10"), phone: "01033333333", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "جلال",   lastName: "عبدالله",  gender: "male",   birthDate: new Date("1980-11-05"), phone: "01034444444", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "سارة",   lastName: "سلامة",    gender: "female", birthDate: new Date("1985-07-22"), phone: "01035555555", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "خالد",   lastName: "أسامة",    gender: "male",   birthDate: new Date("1979-01-30"), phone: "01036666666", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "ندى",    lastName: "حسين",     gender: "female", birthDate: new Date("1987-09-14"), phone: "01037777777", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true },
  ]);

  const [doctor1, doctor2, doctor3, doctor4, doctor5, doctor6, doctor7] = doctorUsers;

  await DoctorProfile.insertMany([
    { user: doctor1._id, specialization: cardiology._id,    experienceYears: 12, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "09:00", endTime: "17:00" },
    { user: doctor2._id, specialization: dermatology._id,   experienceYears: 8,  workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "10:00", endTime: "18:00" },
    { user: doctor3._id, specialization: pediatrics._id,    experienceYears: 15, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "08:00", endTime: "16:00" },
    { user: doctor4._id, specialization: neurology._id,     experienceYears: 10, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "09:00", endTime: "17:00" },
    { user: doctor5._id, specialization: orthopedics._id,   experienceYears: 6,  workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "09:00", endTime: "17:00" },
    { user: doctor6._id, specialization: dentistry._id,     experienceYears: 9,  workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "10:00", endTime: "18:00" },
    { user: doctor7._id, specialization: ophthalmology._id, experienceYears: 7,  workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "09:00", endTime: "17:00" },
  ]);
  console.log("✅ Doctors + profiles created (7)");

  // ── 6. RECEPTIONISTS ──────────────────────────────────────────────────────
  const receptionistUsers = await User.insertMany([
    { firstName: "نور",   lastName: "طارق",   gender: "female", birthDate: new Date("1995-07-12"), phone: "01044444444", role: "receptionist", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "عمر",   lastName: "يوسف",   gender: "male",   birthDate: new Date("1993-11-25"), phone: "01055555555", role: "receptionist", password: HASHED_PASSWORD, isPreHashed: true },
  ]);

  const [rec1, rec2] = receptionistUsers;
  await Receptionist.insertMany([
    { user: rec1._id, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], education: "بكالوريوس إدارة أعمال",    status: "active", startTime: "08:00", endTime: "16:00" },
    { user: rec2._id, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], education: "دبلوم إدارة المستشفيات", status: "active", startTime: "12:00", endTime: "20:00" },
  ]);
  console.log("✅ Receptionists created (2)");

  // ── 7. PATIENTS (10 patients) ─────────────────────────────────────────────
  const patientUsers = await User.insertMany([
    { firstName: "محمد",  lastName: "حسين",   gender: "male",   birthDate: new Date("1990-02-14"), phone: "01066666666", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "مروة",  lastName: "خالد",   gender: "female", birthDate: new Date("1992-06-30"), phone: "01077777777", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "نور",   lastName: "باسم",   gender: "female", birthDate: new Date("1998-09-05"), phone: "01088888888", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "علي",   lastName: "يوسف",   gender: "male",   birthDate: new Date("1985-12-20"), phone: "01099999999", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "سلوى",  lastName: "حمدي",   gender: "female", birthDate: new Date("2000-04-18"), phone: "01111111111", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "كريم",  lastName: "منصور",  gender: "male",   birthDate: new Date("1988-03-25"), phone: "01122222222", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "هنا",   lastName: "سمير",   gender: "female", birthDate: new Date("1995-08-11"), phone: "01133333333", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "ياسر",  lastName: "فهمي",   gender: "male",   birthDate: new Date("1983-01-07"), phone: "01144444444", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "دينا",  lastName: "رضا",    gender: "female", birthDate: new Date("1997-11-19"), phone: "01155555555", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "عمر",   lastName: "فاروق",  gender: "male",   birthDate: new Date("1991-05-03"), phone: "01166666666", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
  ]);

  const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10] = patientUsers;

  await PatientProfile.insertMany([
    { user: p1._id,  bloodType: "A+",  allergies: ["Penicillin"],        chronicConditions: ["Hypertension"],      tall: 175, weight: 80,  smoking: false },
    { user: p2._id,  bloodType: "B-",  allergies: [],                    chronicConditions: [],                    tall: 162, weight: 58,  smoking: false },
    { user: p3._id,  bloodType: "O+",  allergies: ["Aspirin"],           chronicConditions: ["Diabetes"],          tall: 168, weight: 65,  smoking: false },
    { user: p4._id,  bloodType: "AB+", allergies: [],                    chronicConditions: ["Asthma"],            tall: 180, weight: 90,  smoking: true  },
    { user: p5._id,  bloodType: "A-",  allergies: [],                    chronicConditions: [],                    tall: 160, weight: 55,  smoking: false },
    { user: p6._id,  bloodType: "O-",  allergies: ["Sulfa"],             chronicConditions: ["Hypertension"],      tall: 178, weight: 85,  smoking: true  },
    { user: p7._id,  bloodType: "B+",  allergies: [],                    chronicConditions: [],                    tall: 165, weight: 60,  smoking: false },
    { user: p8._id,  bloodType: "AB-", allergies: ["Penicillin","Latex"],chronicConditions: ["Diabetes","Asthma"], tall: 172, weight: 78,  smoking: false },
    { user: p9._id,  bloodType: "A+",  allergies: [],                    chronicConditions: [],                    tall: 158, weight: 52,  smoking: false },
    { user: p10._id, bloodType: "O+",  allergies: [],                    chronicConditions: [],                    tall: 183, weight: 88,  smoking: true  },
  ]);
  console.log("✅ Patients + profiles created (10)");

  // ── 8. APPOINTMENTS ───────────────────────────────────────────────────────
  // completed — past dates (for prescriptions, reports, reviews)
  const completedApts = await Appointment.insertMany([
    // doctor1 (cardiology) appointments
    { patient: p1._id,  doctor: doctor1._id, date: new Date("2025-11-10"), slotTime: "09:00", status: "مكتمل", fees: 300, reason: "ألم في الصدر وضيق في التنفس" },
    { patient: p2._id,  doctor: doctor1._id, date: new Date("2025-11-12"), slotTime: "09:25", status: "مكتمل", fees: 300, reason: "خفقان القلب والدوخة" },
    { patient: p3._id,  doctor: doctor1._id, date: new Date("2025-11-15"), slotTime: "10:15", status: "مكتمل", fees: 300, reason: "ارتفاع ضغط الدم" },
    { patient: p1._id,  doctor: doctor1._id, date: new Date("2025-12-10"), slotTime: "09:00", status: "مكتمل", fees: 300, reason: "متابعة دورية" },
    { patient: p6._id,  doctor: doctor1._id, date: new Date("2026-01-08"), slotTime: "09:25", status: "مكتمل", fees: 300, reason: "فحص دوري للقلب" },
    // doctor2 (dermatology) appointments
    { patient: p2._id,  doctor: doctor2._id, date: new Date("2025-11-20"), slotTime: "10:00", status: "مكتمل", fees: 200, reason: "طفح جلدي وحكة شديدة" },
    { patient: p5._id,  doctor: doctor2._id, date: new Date("2025-12-01"), slotTime: "10:25", status: "مكتمل", fees: 200, reason: "حب الشباب والبثور" },
    { patient: p7._id,  doctor: doctor2._id, date: new Date("2025-12-20"), slotTime: "11:00", status: "مكتمل", fees: 200, reason: "إكزيما الجلد" },
    // doctor3 (pediatrics) appointments
    { patient: p3._id,  doctor: doctor3._id, date: new Date("2025-11-25"), slotTime: "08:00", status: "مكتمل", fees: 150, reason: "حمى وسعال للطفل" },
    { patient: p9._id,  doctor: doctor3._id, date: new Date("2025-12-05"), slotTime: "08:25", status: "مكتمل", fees: 150, reason: "لقاحات وجرعات الطفل" },
    // doctor4 (neurology) appointments
    { patient: p4._id,  doctor: doctor4._id, date: new Date("2025-12-08"), slotTime: "09:00", status: "مكتمل", fees: 350, reason: "صداع نصفي مزمن" },
    { patient: p8._id,  doctor: doctor4._id, date: new Date("2026-01-15"), slotTime: "09:25", status: "مكتمل", fees: 350, reason: "تنميل في الأطراف" },
    // doctor5 (orthopedics) appointments
    { patient: p6._id,  doctor: doctor5._id, date: new Date("2025-12-12"), slotTime: "09:00", status: "مكتمل", fees: 250, reason: "ألم في الركبة" },
    { patient: p10._id, doctor: doctor5._id, date: new Date("2026-01-20"), slotTime: "09:25", status: "مكتمل", fees: 250, reason: "إصابة في الظهر" },
    // doctor6 (dentistry) appointments
    { patient: p7._id,  doctor: doctor6._id, date: new Date("2025-12-15"), slotTime: "10:00", status: "مكتمل", fees: 180, reason: "ألم في الأسنان" },
    { patient: p1._id,  doctor: doctor6._id, date: new Date("2026-01-10"), slotTime: "10:25", status: "مكتمل", fees: 180, reason: "تنظيف الأسنان الدورية" },
  ]);

  // pending — future dates (upcoming appointments)
  await Appointment.insertMany([
    { patient: p1._id,  doctor: doctor1._id, date: new Date("2026-07-26"), slotTime: "09:00", status: "قيد الانتظار", fees: 300, reason: "متابعة دورية" },
    { patient: p4._id,  doctor: doctor1._id, date: new Date("2026-07-26"), slotTime: "09:25", status: "قيد الانتظار", fees: 300, reason: "فحص القلب" },
    { patient: p5._id,  doctor: doctor2._id, date: new Date("2026-07-27"), slotTime: "10:00", status: "قيد الانتظار", fees: 200, reason: "حساسية جلدية" },
    { patient: p2._id,  doctor: doctor3._id, date: new Date("2026-07-27"), slotTime: "08:00", status: "قيد الانتظار", fees: 150, reason: "فحص طفل" },
    { patient: p8._id,  doctor: doctor4._id, date: new Date("2026-07-28"), slotTime: "09:00", status: "قيد الانتظار", fees: 350, reason: "صداع مستمر" },
    { patient: p10._id, doctor: doctor5._id, date: new Date("2026-07-28"), slotTime: "09:25", status: "قيد الانتظار", fees: 250, reason: "ألم في العمود الفقري" },
    { patient: p9._id,  doctor: doctor6._id, date: new Date("2026-07-29"), slotTime: "10:00", status: "قيد الانتظار", fees: 180, reason: "تقويم الأسنان" },
    { patient: p3._id,  doctor: doctor7._id, date: new Date("2026-07-29"), slotTime: "09:00", status: "قيد الانتظار", fees: 220, reason: "ضعف النظر" },
  ]);

  // cancelled appointments
  await Appointment.insertMany([
    { patient: p3._id, doctor: doctor1._id, date: new Date("2026-07-30"), slotTime: "09:25", status: "ملغى", cancelledBy: "patient",      fees: 300, reason: "فحص القلب" },
    { patient: p7._id, doctor: doctor2._id, date: new Date("2026-07-30"), slotTime: "10:00", status: "ملغى", cancelledBy: "doctor",       fees: 200, reason: "حساسية" },
    { patient: p5._id, doctor: doctor3._id, date: new Date("2026-07-31"), slotTime: "08:25", status: "ملغى", cancelledBy: "receptionist", fees: 150, reason: "فحص روتيني" },
  ]);
  console.log("✅ Appointments created (27 total — 16 completed, 8 pending, 3 cancelled)");

  // ── 9. PRESCRIPTIONS ──────────────────────────────────────────────────────
  await Prescription.insertMany([
    {
      patient: p1._id, doctor: doctor1._id, appointment: completedApts[0]._id,
      medicines: [
        { name: "Aspirin",      dose: "100mg", frequency: "مرة يومياً",   duration: "30 يوم" },
        { name: "Atorvastatin", dose: "20mg",  frequency: "مرة يومياً",   duration: "30 يوم" },
        { name: "Bisoprolol",   dose: "5mg",   frequency: "مرة صباحاً",   duration: "30 يوم" },
      ],
    },
    {
      patient: p2._id, doctor: doctor1._id, appointment: completedApts[1]._id,
      medicines: [
        { name: "Metoprolol",   dose: "50mg",  frequency: "مرتين يومياً", duration: "14 يوم" },
        { name: "Amlodipine",   dose: "5mg",   frequency: "مرة يومياً",   duration: "30 يوم" },
      ],
    },
    {
      patient: p3._id, doctor: doctor1._id, appointment: completedApts[2]._id,
      medicines: [
        { name: "Lisinopril",   dose: "10mg",  frequency: "مرة يومياً",   duration: "30 يوم" },
        { name: "Paracetamol",  dose: "500mg", frequency: "كل 8 ساعات",   duration: "7 أيام" },
      ],
    },
    {
      patient: p1._id, doctor: doctor1._id, appointment: completedApts[3]._id,
      medicines: [
        { name: "Aspirin",      dose: "100mg", frequency: "مرة يومياً",   duration: "30 يوم" },
        { name: "Bisoprolol",   dose: "5mg",   frequency: "مرة صباحاً",   duration: "30 يوم" },
      ],
    },
    {
      patient: p2._id, doctor: doctor2._id, appointment: completedApts[5]._id,
      medicines: [
        { name: "Cetirizine",   dose: "10mg",  frequency: "مرة يومياً",   duration: "14 يوم" },
        { name: "Betamethasone", dose: "كريم", frequency: "مرتين يومياً", duration: "10 أيام" },
      ],
    },
    {
      patient: p5._id, doctor: doctor2._id, appointment: completedApts[6]._id,
      medicines: [
        { name: "Clindamycin",  dose: "جيل",  frequency: "مرتين يومياً", duration: "21 يوم" },
        { name: "Isotretinoin", dose: "20mg",  frequency: "مرة يومياً",   duration: "90 يوم" },
      ],
    },
    {
      patient: p3._id, doctor: doctor3._id, appointment: completedApts[8]._id,
      medicines: [
        { name: "Paracetamol",  dose: "250mg", frequency: "كل 6 ساعات",   duration: "5 أيام" },
        { name: "Amoxicillin",  dose: "125mg", frequency: "كل 8 ساعات",   duration: "7 أيام" },
      ],
    },
    {
      patient: p4._id, doctor: doctor4._id, appointment: completedApts[10]._id,
      medicines: [
        { name: "Sumatriptan",  dose: "50mg",  frequency: "عند الحاجة",   duration: "عند الحاجة" },
        { name: "Propranolol",  dose: "40mg",  frequency: "مرتين يومياً", duration: "30 يوم" },
      ],
    },
    {
      patient: p6._id, doctor: doctor5._id, appointment: completedApts[12]._id,
      medicines: [
        { name: "Ibuprofen",    dose: "400mg", frequency: "كل 8 ساعات",   duration: "10 أيام" },
        { name: "Diclofenac",   dose: "جيل",  frequency: "3 مرات يومياً", duration: "14 يوم" },
      ],
    },
    {
      patient: p7._id, doctor: doctor6._id, appointment: completedApts[14]._id,
      medicines: [
        { name: "Amoxicillin",  dose: "500mg", frequency: "كل 8 ساعات",   duration: "7 أيام" },
        { name: "Ibuprofen",    dose: "400mg", frequency: "كل 8 ساعات",   duration: "5 أيام" },
      ],
    },
  ]);
  console.log("✅ Prescriptions created (10)");

  // ── 10. MEDICAL REPORTS ───────────────────────────────────────────────────
  await MedicalReport.insertMany([
    { patient: p1._id, doctor: doctor1._id, appointment: completedApts[0]._id,  diagnosis: "ذبحة صدرية مستقرة",          notes: "يحتاج المريض إلى متابعة دورية كل شهر وإجراء رسم قلب" },
    { patient: p2._id, doctor: doctor1._id, appointment: completedApts[1]._id,  diagnosis: "اضطراب في نظم القلب",         notes: "تم وصف مضادات التخثر وتحديد موعد لمراقبة هولتر" },
    { patient: p3._id, doctor: doctor1._id, appointment: completedApts[2]._id,  diagnosis: "ارتفاع ضغط الدم الأولي",      notes: "تعديل نمط الحياة وتقليل ملح الطعام مع المتابعة الشهرية" },
    { patient: p1._id, doctor: doctor1._id, appointment: completedApts[3]._id,  diagnosis: "ذبحة صدرية مستقرة - متابعة", notes: "تحسن ملحوظ في الحالة، الاستمرار في الدواء" },
    { patient: p2._id, doctor: doctor2._id, appointment: completedApts[5]._id,  diagnosis: "التهاب جلدي تحسسي",           notes: "تجنب المواد المسببة للحساسية واستخدام الكريم الموصوف" },
    { patient: p5._id, doctor: doctor2._id, appointment: completedApts[6]._id,  diagnosis: "حب الشباب الشديد",            notes: "بدء علاج الإيزوتريتينوين مع متابعة وظائف الكبد شهرياً" },
    { patient: p3._id, doctor: doctor3._id, appointment: completedApts[8]._id,  diagnosis: "التهاب الجهاز التنفسي العلوي", notes: "الراحة التامة وتناول السوائل الدافئة والدواء الموصوف" },
    { patient: p4._id, doctor: doctor4._id, appointment: completedApts[10]._id, diagnosis: "الصداع النصفي المزمن",         notes: "تجنب المثيرات وتطبيق تقنيات الاسترخاء" },
    { patient: p6._id, doctor: doctor5._id, appointment: completedApts[12]._id, diagnosis: "التهاب الغضروف الرضفي",        notes: "الراحة وتمارين تقوية عضلات الفخذ وكمادات الثلج" },
    { patient: p7._id, doctor: doctor6._id, appointment: completedApts[14]._id, diagnosis: "خراج سني حاد",                 notes: "تم تصريف الخراج ووصف المضاد الحيوي المناسب" },
  ]);
  console.log("✅ Medical reports created (10)");

  // ── 11. REVIEWS ───────────────────────────────────────────────────────────
  // must use insertMany NOT create inside insertMany
  // reviews trigger post-save hook to update ratingsAverage on doctorProfile
  // so we use create one by one to fire the hook for each
  await Review.create({ patient: p1._id, doctor: doctor1._id, appointment: completedApts[0]._id, stars: 5,   comment: "دكتور ممتاز ومتعاون جداً، شرح الحالة بشكل مفصل وأنصح به بشدة" });
  await Review.create({ patient: p2._id, doctor: doctor1._id, appointment: completedApts[1]._id, stars: 4.5, comment: "تجربة ممتازة، الدكتور محترف ودقيق في التشخيص" });
  await Review.create({ patient: p3._id, doctor: doctor1._id, appointment: completedApts[2]._id, stars: 4,   comment: "دكتور كفء، لكن الانتظار كان طويلاً بعض الشيء" });
  await Review.create({ patient: p2._id, doctor: doctor2._id, appointment: completedApts[5]._id, stars: 5,   comment: "الدكتورة متميزة جداً ومهتمة بالمريض، علاجها فعّال جداً" });
  await Review.create({ patient: p5._id, doctor: doctor2._id, appointment: completedApts[6]._id, stars: 4,   comment: "نتائج جيدة، شرحت العلاج بوضوح" });
  await Review.create({ patient: p3._id, doctor: doctor3._id, appointment: completedApts[8]._id, stars: 5,   comment: "دكتور رائع مع الأطفال، صبور ومطمئن" });
  await Review.create({ patient: p4._id, doctor: doctor4._id, appointment: completedApts[10]._id, stars: 4.5, comment: "تشخيص دقيق وعلاج فعّال للصداع النصفي" });
  await Review.create({ patient: p6._id, doctor: doctor5._id, appointment: completedApts[12]._id, stars: 3.5, comment: "الدكتور كفء لكن كان مشغولاً وسريعاً بعض الشيء" });
  await Review.create({ patient: p7._id, doctor: doctor6._id, appointment: completedApts[14]._id, stars: 5,   comment: "أفضل دكتور أسنان تعاملت معه، يد خفيفة وعمل ممتاز" });
  console.log("✅ Reviews created (9) — ratingsAverage updated automatically");

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log("\n🎉 Database seeded successfully!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 All passwords → Test@1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👤 Admin        → 01000000000  (توفيق عبدالله)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👨‍⚕️ Doctor 1     → 01011111111  (أحمد الألفي     - أمراض القلب)");
  console.log("👩‍⚕️ Doctor 2     → 01022222222  (أماني العطار    - الأمراض الجلدية)");
  console.log("👨‍⚕️ Doctor 3     → 01033333333  (يمان علاء       - طب الأطفال)");
  console.log("👨‍⚕️ Doctor 4     → 01034444444  (جلال عبدالله    - المخ والأعصاب)");
  console.log("👩‍⚕️ Doctor 5     → 01035555555  (سارة سلامة      - العظام والمفاصل)");
  console.log("👨‍⚕️ Doctor 6     → 01036666666  (خالد أسامة      - الفم والأسنان)");
  console.log("👩‍⚕️ Doctor 7     → 01037777777  (ندى حسين        - طب العيون)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🗂️  Recep 1      → 01044444444  (نور طارق)");
  console.log("🗂️  Recep 2      → 01055555555  (عمر يوسف)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧑 Patient 1    → 01066666666  (محمد حسين   - A+  - له 4 مواعيد مكتملة)");
  console.log("🧑 Patient 2    → 01077777777  (مروة خالد   - B-  - له 3 مواعيد مكتملة)");
  console.log("🧑 Patient 3    → 01088888888  (نور باسم    - O+  - له 3 مواعيد مكتملة)");
  console.log("🧑 Patient 4    → 01099999999  (علي يوسف    - AB+ - صداع نصفي + ربو)");
  console.log("🧑 Patient 5    → 01111111111  (سلوى حمدي   - A-)");
  console.log("🧑 Patient 6    → 01122222222  (كريم منصور  - O-  - ضغط + حساسية)");
  console.log("🧑 Patient 7    → 01133333333  (هنا سمير    - B+)");
  console.log("🧑 Patient 8    → 01144444444  (ياسر فهمي   - AB- - سكري + ربو)");
  console.log("🧑 Patient 9    → 01155555555  (دينا رضا    - A+)");
  console.log("🧑 Patient 10   → 01166666666  (عمر فاروق   - O+)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Stats:");
  console.log("   7 specializations | 7 doctors | 2 receptionists | 10 patients");
  console.log("   27 appointments (16 completed, 8 pending, 3 cancelled)");
  console.log("   10 prescriptions | 10 medical reports | 9 reviews");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});