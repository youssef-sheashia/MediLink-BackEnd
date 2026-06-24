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

// date helpers
const today    = new Date(); today.setHours(0, 0, 0, 0);
const past     = (d) => { const x = new Date(today); x.setDate(today.getDate() - d); return x; };
const future   = (d) => { const x = new Date(today); x.setDate(today.getDate() + d); return x; };

const seed = async () => {
  await mongoose.connect(process.env.LOCAL_DATABASE);
  console.log("✅ DB connected");

  // ── CLEAN ─────────────────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany(), DoctorProfile.deleteMany(), PatientProfile.deleteMany(),
    Receptionist.deleteMany(), Specialization.deleteMany(), Clinic.deleteMany(),
    Appointment.deleteMany(), Prescription.deleteMany(), MedicalReport.deleteMany(),
    Review.deleteMany(), Activity.deleteMany(),
  ]);
  console.log("🧹 Cleared");

  // ── 1. SPECIALIZATIONS (4) ────────────────────────────────────────────────
  const [cardiology, dermatology, pediatrics, neurology] = await Specialization.insertMany([
    { name: "القلب والأوعية الدموية", consultationFee: 300 },
    { name: "الأمراض الجلدية",        consultationFee: 200 },
    { name: "طب الأطفال",             consultationFee: 150 },
    { name: "المخ والأعصاب",          consultationFee: 350 },
  ]);

  // ── 2. CLINIC ─────────────────────────────────────────────────────────────
  await Clinic.create({
    name: "Medilink Clinic",
    address: "Egypt, Cairo, Nasr City",
    description: "عيادة ميديلينك — خدمات طبية متكاملة بأعلى معايير الجودة.",
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

  // ── 3. ADMIN (1) ──────────────────────────────────────────────────────────
  await User.create({
    firstName: "توفيق", lastName: "عبدالله",
    gender: "male", birthDate: new Date("1975-03-10"),
    phone: "01000000000", role: "admin",
    password: HASHED_PASSWORD, isPreHashed: true,
  });

  // ── 4. DOCTORS (4) ────────────────────────────────────────────────────────
  const [d1, d2, d3, d4] = await User.insertMany([
    { firstName: "أحمد",  lastName: "الألفي",  gender: "male",   birthDate: new Date("1978-05-15"), phone: "01011111111", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "أماني", lastName: "العطار",  gender: "female", birthDate: new Date("1983-08-20"), phone: "01022222222", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "يمان",  lastName: "علاء",    gender: "male",   birthDate: new Date("1976-03-10"), phone: "01033333333", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "جلال",  lastName: "عبدالله", gender: "male",   birthDate: new Date("1980-11-05"), phone: "01034444444", role: "doctor", password: HASHED_PASSWORD, isPreHashed: true },
  ]);

  await DoctorProfile.insertMany([
    { user: d1._id, specialization: cardiology._id,  experienceYears: 12, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "09:00", endTime: "17:00" },
    { user: d2._id, specialization: dermatology._id, experienceYears: 8,  workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "09:00", endTime: "17:00" },
    { user: d3._id, specialization: pediatrics._id,  experienceYears: 15, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "09:00", endTime: "17:00" },
    { user: d4._id, specialization: neurology._id,   experienceYears: 10, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], startTime: "09:00", endTime: "17:00" },
  ]);
  console.log("✅ Doctors (4)");

  // ── 5. RECEPTIONISTS (2) ──────────────────────────────────────────────────
  const [r1, r2] = await User.insertMany([
    { firstName: "نور", lastName: "طارق", gender: "female", birthDate: new Date("1995-07-12"), phone: "01044444444", role: "receptionist", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "عمر", lastName: "يوسف", gender: "male",   birthDate: new Date("1993-11-25"), phone: "01055555555", role: "receptionist", password: HASHED_PASSWORD, isPreHashed: true },
  ]);
  await Receptionist.insertMany([
    { user: r1._id, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], education: "بكالوريوس إدارة أعمال",    status: "active", startTime: "08:00", endTime: "16:00" },
    { user: r2._id, workingDays: ["السبت","الاحد","الاثنين","الثلاثاء","الاربعاء"], education: "دبلوم إدارة المستشفيات", status: "active", startTime: "12:00", endTime: "20:00" },
  ]);
  console.log("✅ Receptionists (2)");

  // ── 6. PATIENTS (5) ───────────────────────────────────────────────────────
  const [p1, p2, p3, p4, p5] = await User.insertMany([
    { firstName: "محمد", lastName: "حسين",  gender: "male",   birthDate: new Date("1990-02-14"), phone: "01066666666", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "مروة", lastName: "خالد",  gender: "female", birthDate: new Date("1992-06-30"), phone: "01077777777", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "نور",  lastName: "باسم",  gender: "female", birthDate: new Date("1998-09-05"), phone: "01088888888", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "علي",  lastName: "يوسف",  gender: "male",   birthDate: new Date("1985-12-20"), phone: "01099999999", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
    { firstName: "سلوى", lastName: "حمدي",  gender: "female", birthDate: new Date("2000-04-18"), phone: "01111111111", role: "patient", password: HASHED_PASSWORD, isPreHashed: true },
  ]);

  await PatientProfile.insertMany([
    { user: p1._id, bloodType: "A+",  tall: 175, weight: 80,  smoking: false, allergies: ["Penicillin"], chronicConditions: ["Hypertension"] },
    { user: p2._id, bloodType: "B-",  tall: 162, weight: 58,  smoking: false, allergies: [],             chronicConditions: [] },
    { user: p3._id, bloodType: "O+",  tall: 168, weight: 65,  smoking: false, allergies: ["Aspirin"],    chronicConditions: ["Diabetes"] },
    { user: p4._id, bloodType: "AB+", tall: 180, weight: 90,  smoking: true,  allergies: [],             chronicConditions: ["Asthma"] },
    { user: p5._id, bloodType: "A-",  tall: 160, weight: 55,  smoking: false, allergies: [],             chronicConditions: [] },
  ]);
  console.log("✅ Patients (5)");

  // ── 7. APPOINTMENTS ───────────────────────────────────────────────────────

  // completed — past (for prescriptions, reports, reviews)
  const [a1, a2, a3, a4, a5] = await Appointment.insertMany([
    { patient: p1._id, doctor: d1._id, date: past(30), slotTime: "09:00", status: "مكتمل", fees: 300, reason: "ألم في الصدر وضيق تنفس",   isRated: true  },
    { patient: p2._id, doctor: d1._id, date: past(20), slotTime: "09:25", status: "مكتمل", fees: 300, reason: "خفقان القلب والدوخة",       isRated: true  },
    { patient: p3._id, doctor: d2._id, date: past(25), slotTime: "09:00", status: "مكتمل", fees: 200, reason: "طفح جلدي وحكة شديدة",       isRated: true  },
    { patient: p4._id, doctor: d3._id, date: past(15), slotTime: "09:00", status: "مكتمل", fees: 150, reason: "حمى وسعال للطفل",            isRated: true  },
    { patient: p1._id, doctor: d4._id, date: past(10), slotTime: "09:00", status: "مكتمل", fees: 350, reason: "صداع نصفي مزمن",             isRated: false },
  ]);

  // today appointments
  await Appointment.insertMany([
    { patient: p1._id, doctor: d1._id, date: today, slotTime: "09:00", status: "قيد الانتظار", fees: 300, reason: "متابعة دورية للقلب"    },
    { patient: p2._id, doctor: d1._id, date: today, slotTime: "09:25", status: "قيد الانتظار", fees: 300, reason: "فحص القلب الدوري"       },
    { patient: p3._id, doctor: d2._id, date: today, slotTime: "09:00", status: "قيد الانتظار", fees: 200, reason: "حساسية جلدية"            },
    { patient: p4._id, doctor: d3._id, date: today, slotTime: "09:00", status: "قيد الانتظار", fees: 150, reason: "فحص الطفل الدوري"       },
    { patient: p5._id, doctor: d4._id, date: today, slotTime: "09:00", status: "قيد الانتظار", fees: 350, reason: "صداع مستمر"              },
  ]);

  // tomorrow appointments
  await Appointment.insertMany([
    { patient: p5._id, doctor: d1._id, date: future(1), slotTime: "09:00", status: "قيد الانتظار", fees: 300, reason: "فحص القلب"           },
    { patient: p1._id, doctor: d2._id, date: future(1), slotTime: "09:00", status: "قيد الانتظار", fees: 200, reason: "علاج التشقق الجلدي"   },
    { patient: p2._id, doctor: d3._id, date: future(1), slotTime: "09:00", status: "قيد الانتظار", fees: 150, reason: "فحص طفل"              },
    { patient: p3._id, doctor: d4._id, date: future(1), slotTime: "09:25", status: "قيد الانتظار", fees: 350, reason: "دوار مستمر"           },
  ]);

  // this week
  await Appointment.insertMany([
    { patient: p4._id, doctor: d1._id, date: future(2), slotTime: "09:00", status: "قيد الانتظار", fees: 300, reason: "ارتفاع ضغط الدم"     },
    { patient: p5._id, doctor: d2._id, date: future(3), slotTime: "09:25", status: "قيد الانتظار", fees: 200, reason: "حساسية جلدية مزمنة"   },
    { patient: p1._id, doctor: d3._id, date: future(4), slotTime: "09:00", status: "قيد الانتظار", fees: 150, reason: "كحة الطفل"            },
    { patient: p2._id, doctor: d4._id, date: future(5), slotTime: "09:00", status: "قيد الانتظار", fees: 350, reason: "تنميل في الأطراف"     },
  ]);

  // next week
  await Appointment.insertMany([
    { patient: p3._id, doctor: d1._id, date: future(7),  slotTime: "09:00", status: "قيد الانتظار", fees: 300, reason: "متابعة ضغط الدم"    },
    { patient: p4._id, doctor: d2._id, date: future(8),  slotTime: "09:25", status: "قيد الانتظار", fees: 200, reason: "علاج الإكزيما"       },
    { patient: p5._id, doctor: d3._id, date: future(9),  slotTime: "09:00", status: "قيد الانتظار", fees: 150, reason: "لقاحات الطفل"        },
    { patient: p1._id, doctor: d4._id, date: future(10), slotTime: "09:25", status: "قيد الانتظار", fees: 350, reason: "صداع نصفي"           },
  ]);

  // cancelled
  await Appointment.insertMany([
    { patient: p3._id, doctor: d1._id, date: future(15), slotTime: "09:25", status: "ملغى", cancelledBy: "patient",      fees: 300, reason: "فحص قلب"   },
    { patient: p5._id, doctor: d2._id, date: future(16), slotTime: "09:00", status: "ملغى", cancelledBy: "doctor",       fees: 200, reason: "حساسية"     },
    { patient: p2._id, doctor: d3._id, date: future(17), slotTime: "09:25", status: "ملغى", cancelledBy: "receptionist", fees: 150, reason: "فحص روتيني" },
  ]);

  console.log("✅ Appointments (today + tomorrow + week + next week + cancelled)");

  // ── 8. PRESCRIPTIONS (5 — one per completed appointment) ──────────────────
  await Prescription.insertMany([
    {
      patient: p1._id, doctor: d1._id, appointment: a1._id,
      medicines: [
        { name: "Aspirin",      dose: "100mg", frequency: "مرة يومياً",   duration: "30 يوم" },
        { name: "Atorvastatin", dose: "20mg",  frequency: "مرة يومياً",   duration: "30 يوم" },
        { name: "Bisoprolol",   dose: "5mg",   frequency: "مرة صباحاً",   duration: "30 يوم" },
      ],
    },
    {
      patient: p2._id, doctor: d1._id, appointment: a2._id,
      medicines: [
        { name: "Metoprolol",   dose: "50mg",  frequency: "مرتين يومياً", duration: "14 يوم" },
        { name: "Amlodipine",   dose: "5mg",   frequency: "مرة يومياً",   duration: "30 يوم" },
      ],
    },
    {
      patient: p3._id, doctor: d2._id, appointment: a3._id,
      medicines: [
        { name: "Cetirizine",   dose: "10mg",  frequency: "مرة يومياً",   duration: "14 يوم" },
        { name: "Betamethasone",dose: "كريم",  frequency: "مرتين يومياً", duration: "10 أيام" },
      ],
    },
    {
      patient: p4._id, doctor: d3._id, appointment: a4._id,
      medicines: [
        { name: "Paracetamol",  dose: "250mg", frequency: "كل 6 ساعات",   duration: "5 أيام" },
        { name: "Amoxicillin",  dose: "125mg", frequency: "كل 8 ساعات",   duration: "7 أيام" },
      ],
    },
    {
      patient: p1._id, doctor: d4._id, appointment: a5._id,
      medicines: [
        { name: "Sumatriptan",  dose: "50mg",  frequency: "عند الحاجة",   duration: "عند الحاجة" },
        { name: "Propranolol",  dose: "40mg",  frequency: "مرتين يومياً", duration: "30 يوم" },
      ],
    },
  ]);
  console.log("✅ Prescriptions (5)");

  // ── 9. MEDICAL REPORTS (5) ────────────────────────────────────────────────
  await MedicalReport.insertMany([
    { patient: p1._id, doctor: d1._id, appointment: a1._id, diagnosis: "ذبحة صدرية مستقرة",          notes: "متابعة شهرية ورسم قلب كل 3 أشهر" },
    { patient: p2._id, doctor: d1._id, appointment: a2._id, diagnosis: "اضطراب في نظم القلب",         notes: "مضادات التخثر ومراقبة هولتر" },
    { patient: p3._id, doctor: d2._id, appointment: a3._id, diagnosis: "التهاب جلدي تحسسي",           notes: "تجنب المسببات واستخدام الكريم الموصوف" },
    { patient: p4._id, doctor: d3._id, appointment: a4._id, diagnosis: "التهاب الجهاز التنفسي العلوي", notes: "الراحة والسوائل الدافئة والدواء الموصوف" },
    { patient: p1._id, doctor: d4._id, appointment: a5._id, diagnosis: "الصداع النصفي المزمن",         notes: "تجنب المثيرات وتقنيات الاسترخاء" },
  ]);
  console.log("✅ Medical Reports (5)");

  // ── 10. REVIEWS (4 — create one by one to trigger rating hook) ────────────
  await Review.create({ patient: p1._id, doctor: d1._id, appointment: a1._id, stars: 5,   comment: "دكتور ممتاز ومتعاون، شرح الحالة بالتفصيل وأنصح به بشدة" });
  await Review.create({ patient: p2._id, doctor: d1._id, appointment: a2._id, stars: 4.5, comment: "تجربة ممتازة، دقيق جداً في التشخيص" });
  await Review.create({ patient: p3._id, doctor: d2._id, appointment: a3._id, stars: 5,   comment: "الدكتورة متميزة ومهتمة، العلاج فعّال جداً" });
  await Review.create({ patient: p4._id, doctor: d3._id, appointment: a4._id, stars: 4.5, comment: "دكتور رائع مع الأطفال، صبور ومطمئن" });
  console.log("✅ Reviews (4) — ratings updated automatically");

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log("\n🎉 Done!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 Password for everyone → Test@1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👤 Admin      → 01000000000  (توفيق عبدالله)");
  console.log("👨‍⚕️ Doctor 1   → 01011111111  (أحمد الألفي    - القلب)");
  console.log("👩‍⚕️ Doctor 2   → 01022222222  (أماني العطار   - الجلدية)");
  console.log("👨‍⚕️ Doctor 3   → 01033333333  (يمان علاء      - الأطفال)");
  console.log("👨‍⚕️ Doctor 4   → 01034444444  (جلال عبدالله   - الأعصاب)");
  console.log("🗂️  Recep 1    → 01044444444  (نور طارق)");
  console.log("🗂️  Recep 2    → 01055555555  (عمر يوسف)");
  console.log("🧑 Patient 1  → 01066666666  (محمد حسين  - A+)");
  console.log("🧑 Patient 2  → 01077777777  (مروة خالد  - B-)");
  console.log("🧑 Patient 3  → 01088888888  (نور باسم   - O+)");
  console.log("🧑 Patient 4  → 01099999999  (علي يوسف   - AB+)");
  console.log("🧑 Patient 5  → 01111111111  (سلوى حمدي  - A-)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📅 Today         → 5 appointments (all 4 doctors)");
  console.log("📅 Tomorrow      → 4 appointments");
  console.log("📅 This week     → 4 appointments");
  console.log("📅 Next week     → 4 appointments");
  console.log("✅ Completed     → 5 (with prescriptions + reports + reviews)");
  console.log("❌ Cancelled     → 3");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});