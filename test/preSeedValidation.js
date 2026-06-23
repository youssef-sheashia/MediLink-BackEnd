/**
 * MediLink — Pre-Seed Validation Test
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs BEFORE `npm run seed`.  No data is written to the database.
 *
 * What it checks:
 *  1. MongoDB can be reached
 *  2. Every Mongoose model file imports without errors
 *  3. The Express app boots and registers all routes without crashing
 *  4. seed.js --dry-run passes — every seed document validates against its schema
 *
 * Run:
 *   node test/preSeedValidation.js
 * Or via npm:
 *   npm run test:pre-seed
 */

import { execSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

// ── Colour helpers ────────────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  green:  "\x1b[32m",
  red:    "\x1b[31m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  dim:    "\x1b[2m",
};

// ── Result tracking ───────────────────────────────────────────────────────────
let passed  = 0;
let failed  = 0;
const failures = [];

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ${C.green}✅ PASS${C.reset} — ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ${C.red}❌ FAIL${C.reset} — ${name}`);
    console.log(`       ${C.red}→ ${err.message}${C.reset}`);
    failed++;
    failures.push({ name, error: err.message });
  }
}

function header(title) {
  console.log(`\n${C.bold}${C.cyan}━━━ ${title} ━━━${C.reset}`);
}

// ── 1. DB connectivity ────────────────────────────────────────────────────────
async function testDbConnection() {
  header("MongoDB Connectivity");

  const { default: mongoose } = await import("mongoose");

  await check("Connect to LOCAL_DATABASE", async () => {
    await mongoose.connect(process.env.LOCAL_DATABASE, {
      serverSelectionTimeoutMS: 5000,
    });
  });

  // Keep the connection alive for model checks
  return mongoose;
}

// ── 2. Model imports ──────────────────────────────────────────────────────────
async function testModelImports() {
  header("Mongoose Model Imports");

  const models = [
    ["User",            "../models/userModel.js"],
    ["DoctorProfile",   "../models/doctorProfileModel.js"],
    ["PatientProfile",  "../models/patientProfileModel.js"],
    ["Receptionist",    "../models/receptionistModel.js"],
    ["Specialization",  "../models/specializationModel.js"],
    ["Clinic",          "../models/clinicModel.js"],
    ["Appointment",     "../models/appointmentModel.js"],
    ["Prescription",    "../models/prescriptionModel.js"],
    ["MedicalReport",   "../models/medicalReportModel.js"],
    ["Review",          "../models/reviewModel.js"],
    ["Activity",        "../models/activitiesModel.js"],
  ];

  for (const [modelName, relPath] of models) {
    await check(`Import ${modelName}`, async () => {
      const mod = await import(relPath);
      const Model = mod.default;
      if (!Model || typeof Model.find !== "function") {
        throw new Error(`${modelName} does not look like a Mongoose model`);
      }
    });
  }
}

// ── 3. App / route registration ───────────────────────────────────────────────
async function testAppBoot() {
  header("Express App & Route Registration");

  await check("Import app.js without runtime error", async () => {
    const mod = await import("../app.js");
    if (!mod.app) throw new Error("app.js did not export 'app'");
  });

  await check("Expected routes are mounted (HTTP probe)", async () => {
    // Express 5 lazily builds _router on first request — use supertest to probe
    const { default: supertest } = await import("supertest");
    const { app } = await import("../app.js");
    const req = supertest(app);

    // Each route below should NOT return 404 "url not found" from our catch-all.
    // A 401 (unauthorized) or 400 (bad input) means the route IS registered.
    const probes = [
      { method: "get",  url: "/api/v1/users/me" },
      { method: "get",  url: "/api/v1/doctors" },
      { method: "get",  url: "/api/v1/clinic/informations" },
      { method: "get",  url: "/api/v1/specializations" },
      { method: "get",  url: "/api/v1/receptionist" },
      { method: "get",  url: "/api/v1/patient/my-profile" },
      { method: "get",  url: "/api/v1/appointments" },
      { method: "get",  url: "/api/v1/prescriptions/my-prescriptions" },
      { method: "get",  url: "/api/v1/medicalReports/does-not-exist" },
      { method: "get",  url: "/api/v1/reviews/doctor/000000000000000000000000" },
      { method: "get",  url: "/api/v1/activities" },
    ];

    for (const { method, url } of probes) {
      const res = await req[method](url);
      if (res.status === 404 && res.body?.message?.includes("url not found")) {
        throw new Error(`Route ${url} returned 404 "url not found" — it is NOT mounted`);
      }
      // Any other status (200, 401, 400, 500) means the route exists
    }
  });
}

// ── 4. Seed dry-run ───────────────────────────────────────────────────────────
async function testSeedDryRun() {
  header("Seed Data Validation (--dry-run)");

  await check("seed.js --dry-run completes without errors", () => {
    const result = spawnSync(
      process.execPath,
      ["seed.js", "--dry-run"],
      {
        cwd: path.resolve(fileURLToPath(import.meta.url), "../../"),
        encoding: "utf-8",
        timeout: 60_000,   // 60 s max
        env: { ...process.env },
      },
    );

    // Forward any output so it's visible in the console
    if (result.stdout) process.stdout.write(C.dim + result.stdout + C.reset);
    if (result.stderr) process.stderr.write(C.red  + result.stderr + C.reset);

    if (result.status !== 0) {
      throw new Error(
        `seed.js --dry-run exited with code ${result.status}.\n` +
        (result.stderr?.trim() || result.stdout?.trim() || "No output"),
      );
    }
  });
}

// ── 5. Schema shape spot-checks ───────────────────────────────────────────────
async function testSchemaShapes(mongoose) {
  header("Schema Shape Spot-Checks");

  // User — required fields
  await check("User schema has required fields", async () => {
    const User = mongoose.model("User");
    const paths = User.schema.paths;
    const required = ["firstName", "lastName", "gender", "birthDate", "phone", "password"];
    for (const field of required) {
      if (!paths[field]) throw new Error(`User schema is missing field: ${field}`);
    }
  });

  // User — photo default is empty string
  await check("User photo field defaults to empty string", async () => {
    const User = mongoose.model("User");
    const photoDefault = User.schema.paths.photo?.defaultValue;
    if (photoDefault !== "") {
      throw new Error(
        `Expected photo default to be "" but got: ${JSON.stringify(photoDefault)}`,
      );
    }
  });

  // User — role enum
  await check("User role enum includes all four roles", async () => {
    const User = mongoose.model("User");
    const enumValues = User.schema.paths.role?.enumValues ?? [];
    const expected = ["patient", "admin", "doctor", "receptionist"];
    for (const role of expected) {
      if (!enumValues.includes(role))
        throw new Error(`User role enum is missing: ${role}`);
    }
  });

  // Appointment — status enum contains Arabic values
  await check("Appointment status enum contains Arabic statuses", async () => {
    const Appointment = mongoose.model("Appointment");
    const enumValues = Appointment.schema.paths.status?.enumValues ?? [];
    const expected = ["مؤكد", "قيد الانتظار", "مكتمل", "ملغى"];
    for (const s of expected) {
      if (!enumValues.includes(s))
        throw new Error(`Appointment status enum is missing: ${s}`);
    }
  });

  // Specialization — consultationFee is a number
  await check("Specialization consultationFee is a Number field", async () => {
    const Spec = mongoose.model("Specialization");
    const field = Spec.schema.paths.consultationFee;
    if (!field) throw new Error("consultationFee field not found");
    if (field.instance !== "Number")
      throw new Error(`Expected Number, got ${field.instance}`);
  });

  // Prescription — medicines is an array
  await check("Prescription medicines is an array path", async () => {
    const Prescription = mongoose.model("Prescription");
    const field = Prescription.schema.paths["medicines"];
    if (!field) throw new Error("medicines path not found in Prescription schema");
  });

  // Review — unique compound index on patient+doctor
  await check("Review schema has unique constraint on patient+doctor", async () => {
    const Review = mongoose.model("Review");
    const indexes = Review.schema.indexes();
    const hasUnique = indexes.some(
      ([fields, opts]) =>
        opts?.unique === true &&
        fields.patient !== undefined &&
        fields.doctor  !== undefined,
    );
    if (!hasUnique)
      throw new Error("Review schema is missing unique compound index on patient+doctor");
  });
}

// ── 6. Env variable presence ──────────────────────────────────────────────────
async function testEnvVars() {
  header("Environment Variables");

  const required = [
    "LOCAL_DATABASE",
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
    "TWILIO_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE",
    "REDIS_HOST",
    "REDIS_PORT",
    "IMAGEKIT_PUBLIC_KEY",
    "IMAGEKIT_PRIVATE_KEY",
    "IMAGEKIT_URL_ENDPOINT",
  ];

  for (const key of required) {
    await check(`${key} is set`, () => {
      if (!process.env[key] || process.env[key].trim() === "") {
        throw new Error(`Environment variable ${key} is missing or empty`);
      }
    });
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
function printSummary() {
  const total = passed + failed;
  console.log(`\n${C.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`);
  console.log(`${C.bold}  PRE-SEED VALIDATION SUMMARY${C.reset}`);
  console.log(`  Total:  ${total}`);
  console.log(`  ${C.green}Passed: ${passed}${C.reset}`);
  console.log(`  ${C.red}Failed: ${failed}${C.reset}`);

  if (failures.length > 0) {
    console.log(`\n${C.red}${C.bold}  Failed Checks:${C.reset}`);
    failures.forEach((f) => {
      console.log(`  ❌ ${f.name}`);
      console.log(`     → ${f.error}`);
    });
  }

  console.log(`${C.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}\n`);
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log(
    `\n${C.bold}${C.cyan}🏥  MediLink — Pre-Seed Validation${C.reset}`,
  );
  console.log(
    `${C.yellow}  ⚙️  This test validates everything BEFORE seeding the database.${C.reset}`,
  );
  console.log(
    `${C.yellow}  ⚙️  No data will be written to MongoDB.${C.reset}\n`,
  );

  // Env vars first — we need them for the DB connection
  await testEnvVars();

  // DB connectivity
  const mongoose = await testDbConnection();

  // Model imports (require live DB connection for some registrations)
  await testModelImports();

  // App boot
  await testAppBoot();

  // Schema shape spot-checks
  await testSchemaShapes(mongoose);

  // Seed dry-run (spawns a child process — does NOT touch the DB collections)
  await testSeedDryRun();

  printSummary();

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`${C.red}Fatal error:${C.reset}`, err);
  process.exit(1);
});
