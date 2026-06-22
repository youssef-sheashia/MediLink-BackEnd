/**
 * MediLink - Automated Route Test Runner
 * Run: node scratch/testRoutes.js
 *
 * Requirements: MongoDB + Redis must be running.
 * The script auto-captures OTPs from console, no manual steps needed.
 */

import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

// Dynamic imports MUST come after dotenv.config() in ES modules.
// Static imports are hoisted and run before dotenv, causing env vars to be undefined.
const { default: mongoose } = await import("mongoose");
const { default: supertest } = await import("supertest");
const { app } = await import("../app.js");

const request = supertest(app);

// ─── OTP Capture ─────────────────────────────────────────────────────────────
let capturedOTP = null;
const _log = console.log;
console.log = (...args) => {
  const msg = args.join(" ");
  const m = msg.match(/OTP:\s*(\d{6})/);
  if (m) capturedOTP = m[1];
  _log(...args);
};

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  adminToken: null,
  patientToken: null,
  doctorToken: null,
  receptionistToken: null,
  patientUserId: null,
  patientProfileId: null,
  doctorUserId: null,
  receptionistProfileId: null,
  specializationId: null,
  appointmentId: null,
  prescriptionId: null,
  medicalReportId: null,
  reviewId: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

let passed = 0;
let failed = 0;
const failures = [];

function printHeader(title) {
  console.log(
    `\n${COLORS.bold}${COLORS.cyan}━━━ ${title} ━━━${COLORS.reset}`,
  );
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ${COLORS.green}✅ PASS${COLORS.reset} — ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ${COLORS.red}❌ FAIL${COLORS.reset} — ${name}`);
    console.log(`       ${COLORS.red}→ ${err.message}${COLORS.reset}`);
    failed++;
    failures.push({ name, error: err.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

// ─── Unique phone generator ───────────────────────────────────────────────────
const uniquePhone = () => {
  const digits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
  return `010${digits}`;
};

const uniqueLetters = (len = 6) =>
  Array.from({ length: len }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join("");

const PATIENT_PHONE = uniquePhone();
const DOCTOR_PHONE  = uniquePhone();
const RECEP_PHONE   = uniquePhone();
const ADMIN_PHONE   = "01000000000"; // Created by `npm run seed`
const SPEC_NAME     = `Cardiology Test ${uniqueLetters()}`;

// ═════════════════════════════════════════════════════════════════════════════
// TESTS
// ═════════════════════════════════════════════════════════════════════════════

// ─── Admin Login ─────────────────────────────────────────────────────────────
async function testAdminLogin() {
  printHeader("Admin Login");
  await test("Login as admin", async () => {
    const res = await request.post("/api/v1/users/login").send({
      phone: ADMIN_PHONE,
      password: "Test@1234",
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.token, "No token returned");
    state.adminToken = res.body.token;
  });
}

// ─── Auth (Signup / Login) ────────────────────────────────────────────────────
async function testAuth() {
  printHeader("Auth Routes");

  await test("POST /signup — patient registration", async () => {
    const res = await request.post("/api/v1/users/signup").send({
      firstName: "TestPatient",
      lastName: "Auto",
      phone: PATIENT_PHONE,
      password: "Test@1234",
      confirmPassword: "Test@1234",
      gender: "male",
      day: 15,
      month: 6,
      year: 2000,
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
  });

  await test("POST /verifyOTP — verify patient signup OTP", async () => {
    assert(capturedOTP, "OTP not found in console output");
    const res = await request.post("/api/v1/users/verifyOTP").send({
      phone: PATIENT_PHONE,
      otp: capturedOTP,
    });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    state.patientToken = res.body.token;
    state.patientUserId = res.body.user._id;
    capturedOTP = null;

    // Fetch the patient profile ID from Mongoose
    const patientProfile = await mongoose.model("PatientProfile").findOne({ user: state.patientUserId });
    if (patientProfile) {
      state.patientProfileId = patientProfile._id;
    }
  });

  await test("POST /login — patient login", async () => {
    const res = await request.post("/api/v1/users/login").send({
      phone: PATIENT_PHONE,
      password: "Test@1234",
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.token, "No token returned");
  });

  await test("POST /forgetPassword — request OTP", async () => {
    const res = await request.post("/api/v1/users/forgetPassword").send({
      phone: PATIENT_PHONE,
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
  });

  await test("POST /verifyPasswordOTP — verify forget-password OTP", async () => {
    assert(capturedOTP, "OTP not found in console output");
    const res = await request.post("/api/v1/users/verifyPasswordOTP").send({
      phone: PATIENT_PHONE,
      otp: capturedOTP,
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    capturedOTP = null;
  });

  await test("PATCH /resetPassword — reset with new password", async () => {
    const res = await request.patch("/api/v1/users/resetPassword").send({
      phone: PATIENT_PHONE,
      password: "Test@1234",
      confirmPassword: "Test@1234",
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    if (res.body.token) {
      state.patientToken = res.body.token;
    }
  });

  await test("GET /me — get own profile", async () => {
    const res = await request
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${state.patientToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("GET / — getAllUsers (admin only)", async () => {
    const res = await request
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${state.adminToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });
}

// ─── Clinic ───────────────────────────────────────────────────────────────────
async function testClinic() {
  printHeader("Clinic Routes");

  await test("GET /clinic/informations — public", async () => {
    const res = await request.get("/api/v1/clinic/informations");
    assert([200, 404].includes(res.status), `Unexpected status ${res.status}`);
  });

  await test("PATCH /clinic/informations — update (admin)", async () => {
    const res = await request
      .patch("/api/v1/clinic/informations")
      .set("Authorization", `Bearer ${state.adminToken}`)
      .send({
        name: "MediLink Test Clinic",
        address: "Cairo, Egypt",
        description: "Automated test clinic for graduation project.",
        phone: "01012345678",
        email: "clinic@medilink.com",
      });
    assert([200, 201].includes(res.status), `Expected 200/201, got ${res.status}: ${JSON.stringify(res.body)}`);
  });

  await test("PATCH /clinic/schedule — update schedule (admin)", async () => {
    const res = await request
      .patch("/api/v1/clinic/schedule")
      .set("Authorization", `Bearer ${state.adminToken}`)
      .send({
        appointmentDuration: 25,
        workingDays: [
          { day: "الاثنين", isActive: true, startTime: "09:00", endTime: "17:00" },
          { day: "الثلاثاء", isActive: true, startTime: "09:00", endTime: "17:00" },
          { day: "الاربعاء", isActive: true, startTime: "09:00", endTime: "17:00" },
        ],
      });
    assert([200, 201].includes(res.status), `Expected 200/201, got ${res.status}: ${JSON.stringify(res.body)}`);
  });
}

// ─── Specializations ──────────────────────────────────────────────────────────
async function testSpecializations() {
  printHeader("Specialization Routes");

  await test("GET /specializations — public", async () => {
    const res = await request.get("/api/v1/specializations");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("POST /specializations — create (admin)", async () => {
    const res = await request
      .post("/api/v1/specializations")
      .set("Authorization", `Bearer ${state.adminToken}`)
      .send({ name: SPEC_NAME, consultationFee: 200 });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    state.specializationId = res.body.data.specialization._id;
  });

  await test("PUT /specializations/:id — update (admin)", async () => {
    const res = await request
      .put(`/api/v1/specializations/${state.specializationId}`)
      .set("Authorization", `Bearer ${state.adminToken}`)
      .send({ name: SPEC_NAME, consultationFee: 250 });
    assert([200, 201].includes(res.status), `Expected 200/201, got ${res.status}`);
  });

  await test("GET /specializations/:id — doctors by specialization", async () => {
    const res = await request.get(
      `/api/v1/specializations/${state.specializationId}`,
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });
}

// ─── Doctors ─────────────────────────────────────────────────────────────────
async function testDoctors() {
  printHeader("Doctor Routes");

  await test("GET /doctors — public", async () => {
    const res = await request.get("/api/v1/doctors");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("POST /doctors — create doctor (admin)", async () => {
    const res = await request
      .post("/api/v1/doctors")
      .set("Authorization", `Bearer ${state.adminToken}`)
      .send({
        firstName: "TestDoctor",
        lastName: "Auto",
        phone: DOCTOR_PHONE,
        password: "Doctor@1234",
        confirmPassword: "Doctor@1234",
        gender: "male",
        birthDate: "1985-05-10",
        specialization: state.specializationId,
        experienceYears: 10,
        workingDays: ["الاثنين", "الثلاثاء", "الاربعاء"],
        startTime: "09:00",
        endTime: "17:00",
      });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    state.doctorUserId = res.body.data.user._id;
  });

  await test("GET /doctors/:id — get doctor", async () => {
    const res = await request.get(`/api/v1/doctors/${state.doctorUserId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("GET /doctors/:id/available-slots — available slots", async () => {
    const res = await request
      .get(`/api/v1/doctors/${state.doctorUserId}/available-slots`)
      .set("Authorization", `Bearer ${state.patientToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
  });

  await test("PATCH /doctors/:id — update doctor (admin)", async () => {
    const res = await request
      .patch(`/api/v1/doctors/${state.doctorUserId}`)
      .set("Authorization", `Bearer ${state.adminToken}`)
      .send({ experienceYears: 12 });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
  });

  // Login as doctor
  await test("Login as doctor", async () => {
    const res = await request.post("/api/v1/users/login").send({
      phone: DOCTOR_PHONE,
      password: "Doctor@1234",
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    state.doctorToken = res.body.token;
  });
}

// ─── Receptionists ────────────────────────────────────────────────────────────
async function testReceptionists() {
  printHeader("Receptionist Routes");

  await test("POST /receptionist — create (admin)", async () => {
    const res = await request
      .post("/api/v1/receptionist")
      .set("Authorization", `Bearer ${state.adminToken}`)
      .send({
        firstName: "TestRecep",
        lastName: "Auto",
        phone: RECEP_PHONE,
        password: "Recep@1234",
        confirmPassword: "Recep@1234",
        gender: "female",
        birthDate: "1998-01-15",
        education: "Bachelor of Business",
        status: "active",
        workingDays: ["السبت", "الاحد", "الاثنين"],
        startTime: "08:00",
        endTime: "16:00",
      });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    state.receptionistProfileId = res.body.data.profile._id;
  });

  await test("GET /receptionist — list all (admin)", async () => {
    const res = await request
      .get("/api/v1/receptionist")
      .set("Authorization", `Bearer ${state.adminToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("GET /receptionist/:id — get one (admin)", async () => {
    const res = await request
      .get(`/api/v1/receptionist/${state.receptionistProfileId}`)
      .set("Authorization", `Bearer ${state.adminToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("PATCH /receptionist/:id — update (admin)", async () => {
    const res = await request
      .patch(`/api/v1/receptionist/${state.receptionistProfileId}`)
      .set("Authorization", `Bearer ${state.adminToken}`)
      .send({ status: "on-leave" });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // Login as receptionist
  await test("Login as receptionist", async () => {
    const res = await request.post("/api/v1/users/login").send({
      phone: RECEP_PHONE,
      password: "Recep@1234",
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    state.receptionistToken = res.body.token;
  });
}

// ─── Appointments ─────────────────────────────────────────────────────────────
async function testAppointments() {
  printHeader("Appointment Routes");

  // Get a future working day for the doctor (Mon/Tue/Wed)
  const getNextWorkingDay = () => {
    const dayMap = { 1: "الاثنين", 2: "الثلاثاء", 3: "الاربعاء" };
    const d = new Date();
    while (![1, 2, 3].includes(d.getDay())) {
      d.setDate(d.getDate() + 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const bookingDate = getNextWorkingDay();

  await test("GET /appointments — all (admin)", async () => {
    const res = await request
      .get("/api/v1/appointments")
      .set("Authorization", `Bearer ${state.adminToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("POST /appointments/bookByPatient — patient books", async () => {
    const res = await request
      .post("/api/v1/appointments/bookByPatient")
      .set("Authorization", `Bearer ${state.patientToken}`)
      .send({
        doctorId: state.doctorUserId,
        date: bookingDate,
        slotTime: "09:00",
        reason: "Automated test appointment",
      });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    state.appointmentId = res.body.data.appointment._id;
  });

  await test("POST /appointments/bookByReceptionist — receptionist books new patient", async () => {
    const res = await request
      .post("/api/v1/appointments/bookByReceptionist")
      .set("Authorization", `Bearer ${state.receptionistToken}`)
      .send({
        doctorId: state.doctorUserId,
        date: bookingDate,
        slotTime: "09:25",
        firstName: "WalkIn",
        lastName: "Patient",
        phone: uniquePhone(),
        gender: "male",
        day: 1,
        month: 1,
        year: 1990,
      });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
  });

  await test("GET /appointments/my-appointments — doctor", async () => {
    const res = await request
      .get(`/api/v1/appointments/my-appointments?date=${bookingDate}`)
      .set("Authorization", `Bearer ${state.doctorToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("GET /appointments/getPatientsForDoctor — doctor", async () => {
    const res = await request
      .get("/api/v1/appointments/getPatientsForDoctor")
      .set("Authorization", `Bearer ${state.doctorToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("GET /appointments/getCurrentPatientForDoctor/:id — doctor", async () => {
    const Appointment = mongoose.model("Appointment");
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await Appointment.findByIdAndUpdate(state.appointmentId, {
      date: today,
      status: "قيد الانتظار",
    });

    const res = await request
      .get(`/api/v1/appointments/getCurrentPatientForDoctor/${state.patientUserId}`)
      .set("Authorization", `Bearer ${state.doctorToken}`);
    assert(
      res.status === 200,
      `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`,
    );
    assert(res.body.data?.appointment, "No appointment returned");
    assert(
      String(res.body.data.appointment.patient) === String(state.patientUserId),
      "Appointment patient does not match",
    );
  });

  await test("GET /appointments/bookedAppointmentsForPatient — patient", async () => {
    const res = await request
      .get("/api/v1/appointments/bookedAppointmentsForPatient")
      .set("Authorization", `Bearer ${state.patientToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });
}

// ─── Patients ─────────────────────────────────────────────────────────────────
async function testPatients() {
  printHeader("Patient Routes");

  await test("GET /patient/my-profile — patient", async () => {
    const res = await request
      .get("/api/v1/patient/my-profile")
      .set("Authorization", `Bearer ${state.patientToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("GET /patient/:id — get patient by id (admin)", async () => {
    let patientId = state.patientUserId;
    if (!patientId) {
      const User = mongoose.model("User");
      const patientUserObj = await User.findOne({ phone: "01066666666" });
      assert(patientUserObj, "Seeded patient user not found");
      patientId = patientUserObj._id;
    }

    const res = await request
      .get(`/api/v1/patient/${patientId}`)
      .set("Authorization", `Bearer ${state.adminToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });
}

// ─── Prescriptions ────────────────────────────────────────────────────────────
async function testPrescriptions() {
  printHeader("Prescription Routes");

  await test("POST /prescriptions — create (doctor)", async () => {
    const res = await request
      .post("/api/v1/prescriptions")
      .set("Authorization", `Bearer ${state.doctorToken}`)
      .send({
        patient: state.patientUserId,
        doctor: state.doctorUserId,
        appointment: state.appointmentId,
        medicines: [
          {
            name: "Aspirin",
            dose: "100mg",
            frequency: "Once daily",
            duration: "7 days",
          },
        ],
      });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    state.prescriptionId = res.body.data.prescription._id;
  });

  await test("GET /prescriptions/:patientId — doctor gets patient prescriptions", async () => {
    const res = await request
      .get(`/api/v1/prescriptions/${state.patientUserId}`)
      .set("Authorization", `Bearer ${state.doctorToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("GET /prescriptions/my-prescriptions — patient", async () => {
    const res = await request
      .get("/api/v1/prescriptions/my-prescriptions")
      .set("Authorization", `Bearer ${state.patientToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });
}

// ─── Medical Reports ──────────────────────────────────────────────────────────
async function testMedicalReports() {
  printHeader("Medical Report Routes");

  await test("POST /medicalReports — create (doctor)", async () => {
    const res = await request
      .post("/api/v1/medicalReports")
      .set("Authorization", `Bearer ${state.doctorToken}`)
      .send({
        patient: state.patientUserId,
        doctor: state.doctorUserId,
        appointment: state.appointmentId,
        diagnosis: "Automated test diagnosis",
        notes: "No issues found. Follow up in 2 weeks.",
      });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    state.medicalReportId = res.body.data.medicalReport._id;
  });

  await test("GET /medicalReports/:patientId — doctor gets report", async () => {
    const res = await request
      .get(`/api/v1/medicalReports/${state.patientUserId}`)
      .set("Authorization", `Bearer ${state.doctorToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("GET /medicalReports/:patientId — patient gets own report", async () => {
    const res = await request
      .get(`/api/v1/medicalReports/${state.patientUserId}`)
      .set("Authorization", `Bearer ${state.patientToken}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
async function testReviews() {
  printHeader("Review Routes");

  await test("GET /reviews/doctor/:id — public", async () => {
    let doctorId = state.doctorUserId;
    if (!doctorId) {
      const User = mongoose.model("User");
      const seededDoc = await User.findOne({ role: "doctor" });
      assert(seededDoc, "No seeded doctor found");
      doctorId = seededDoc._id;
    }
    const res = await request.get(
      `/api/v1/reviews/doctor/${doctorId}`,
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("POST /reviews — create review (patient)", async () => {
    const Appointment = mongoose.model("Appointment");
    const Review = mongoose.model("Review");
    
    // Find a completed appointment where:
    // 1. The appointment itself has no review yet, AND
    // 2. The patient+doctor pair has no review yet
    const completedApts = await Appointment.find({ status: "مكتمل" });
    let completedApt = null;
    for (const apt of completedApts) {
      const existingReview = await Review.findOne({
        $or: [
          { appointment: apt._id },
          { patient: apt.patient, doctor: apt.doctor },
        ],
      });
      if (!existingReview) {
        completedApt = apt;
        break;
      }
    }
    assert(completedApt, "No unreviewed completed appointment found in DB");

    const User = mongoose.model("User");
    const patientUser = await User.findById(completedApt.patient);
    assert(patientUser, "Patient user not found");

    const loginRes = await request.post("/api/v1/users/login").send({
      phone: patientUser.phone,
      password: "Test@1234",
    });
    assert(loginRes.status === 200, `Failed to login as seeded patient: ${loginRes.status}`);
    const tempPatientToken = loginRes.body.token;

    const res = await request
      .post("/api/v1/reviews")
      .set("Authorization", `Bearer ${tempPatientToken}`)
      .send({
        appointmentId: completedApt._id,
        stars: 5,
        comment: "Excellent experience from automated test runner",
      });
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    state.reviewId = res.body.data.review._id;
  });

  await test("DELETE /reviews/:id — delete review (patient)", async () => {
    assert(state.reviewId, "Review ID not set");
    const Review = mongoose.model("Review");
    const reviewObj = await Review.findById(state.reviewId);
    assert(reviewObj, "Review not found");

    const User = mongoose.model("User");
    const patientUser = await User.findById(reviewObj.patient);
    
    const loginRes = await request.post("/api/v1/users/login").send({
      phone: patientUser.phone,
      password: "Test@1234",
    });
    const tempPatientToken = loginRes.body.token;

    const res = await request
      .delete(`/api/v1/reviews/${state.reviewId}`)
      .set("Authorization", `Bearer ${tempPatientToken}`);
    assert(res.status === 204, `Expected 204, got ${res.status}`);
  });
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────
async function cleanupTestData() {
  printHeader("Cleanup Test Data");

  await test("DELETE /specializations/:id (admin)", async () => {
    const res = await request
      .delete(`/api/v1/specializations/${state.specializationId}`)
      .set("Authorization", `Bearer ${state.adminToken}`);
    assert([200, 204].includes(res.status), `Expected 200/204, got ${res.status}`);
  });

  await test("DELETE /receptionist/:id (admin)", async () => {
    const res = await request
      .delete(`/api/v1/receptionist/${state.receptionistProfileId}`)
      .set("Authorization", `Bearer ${state.adminToken}`);
    assert([200, 204].includes(res.status), `Expected 200/204, got ${res.status}`);
  });

  await test("DELETE /doctors/:id (admin)", async () => {
    const res = await request
      .delete(`/api/v1/doctors/${state.doctorUserId}`)
      .set("Authorization", `Bearer ${state.adminToken}`);
    assert([200, 204].includes(res.status), `Expected 200/204, got ${res.status}`);
  });
}

// ─── Summary ──────────────────────────────────────────────────────────────────
function printSummary() {
  const total = passed + failed;
  console.log(`\n${COLORS.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
  console.log(`${COLORS.bold}  TEST SUMMARY${COLORS.reset}`);
  console.log(`  Total:  ${total}`);
  console.log(`  ${COLORS.green}Passed: ${passed}${COLORS.reset}`);
  console.log(`  ${COLORS.red}Failed: ${failed}${COLORS.reset}`);

  if (failures.length > 0) {
    console.log(`\n${COLORS.red}${COLORS.bold}  Failed Tests:${COLORS.reset}`);
    failures.forEach((f) => {
      console.log(`  ❌ ${f.name}`);
      console.log(`     → ${f.error}`);
    });
  }
  console.log(`${COLORS.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN RUNNER
// ═════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log(`\n${COLORS.bold}${COLORS.cyan}🏥  MediLink — Automated Route Tests${COLORS.reset}`);
  console.log(
    `${COLORS.yellow}  ⚙️  Admin phone: ${ADMIN_PHONE} | Make sure this account exists in the DB.${COLORS.reset}`,
  );

  try {
    await mongoose.connect(process.env.LOCAL_DATABASE);
    console.log(`${COLORS.green}  ✅ MongoDB connected${COLORS.reset}\n`);
  } catch (err) {
    console.log(`${COLORS.red}  ❌ MongoDB connection failed: ${err.message}${COLORS.reset}`);
    process.exit(1);
  }

  await testAdminLogin();
  await testAuth();
  await testClinic();
  await testSpecializations();
  await testDoctors();
  await testReceptionists();
  await testAppointments();
  await testPatients();
  await testPrescriptions();
  await testMedicalReports();
  await testReviews();
  await cleanupTestData();

  printSummary();

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
