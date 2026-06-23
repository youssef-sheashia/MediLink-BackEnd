<div align="center">

# 🏥 MediLink — Smart Clinic Management System

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/ImageKit-009DFF?style=for-the-badge&logo=imagekit&logoColor=white" />
</p>

<p align="center">
  <strong>A full-featured RESTful API backend for managing medical clinics — built as an ITI Graduation Project.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-api-overview">API Overview</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-seed-demo-data">Seed Data</a> •
  <a href="#-team">Team</a>
</p>

</div>

---

## 📖 About The Project

**MediLink** is a comprehensive clinic management system designed to streamline the full workflow of a medical clinic — from patient registration and appointment booking, to doctor consultations, prescriptions, medical reports, and reviews.

The system supports **4 distinct roles**:
- 🛡️ **Admin** — Full system control, manage staff and clinic settings
- 👨‍⚕️ **Doctor** — View schedule, manage appointments, write prescriptions & medical reports
- 🗂️ **Receptionist** — Book & manage appointments, handle patient check-in
- 🧑 **Patient** — Book appointments, view medical history, rate doctors

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with HttpOnly cookie support
- Role-Based Access Control (RBAC) with 4 roles
- Password hashing with bcrypt (salt rounds: 12)
- Password reset via email (Nodemailer + Pug templates)
- OTP verification via SMS (Twilio)
- Rate limiting, XSS protection, NoSQL injection prevention, Helmet headers
- Redis-based token blacklisting for secure logout

### 👤 User Management
- Full CRUD for all user types (Admin, Doctor, Receptionist, Patient)
- Profile photo upload & management via **ImageKit CDN**
- Soft delete with active/inactive status

### 📅 Appointment System
- Intelligent time-slot generation based on clinic schedule and doctor availability
- Appointment status lifecycle: `قيد الانتظار` → `مؤكد` → `مكتمل` / `ملغى`
- Cancellation tracking (who cancelled: patient / doctor / receptionist)
- File attachments (medical files) on appointments
- Appointment filtering by date, status, doctor, and patient

### 👨‍⚕️ Doctor Management
- Doctor profiles with specialization, experience, working days & hours
- Auto-calculated ratings average & count from patient reviews
- Favorite doctors system for patients

### 💊 Prescriptions
- Multi-medicine prescriptions linked to appointments
- Each medicine has: name, dose, frequency, duration
- One prescription per appointment (enforced)

### 📋 Medical Reports
- Structured diagnosis + detailed clinical notes per appointment
- Full patient medical history tracking

### ⭐ Reviews & Ratings
- Patient reviews per completed appointment (one review per appointment)
- 0.5-star increments system
- Auto-recalculation of doctor's average rating on every review add/delete

### 🏥 Clinic Management
- Single-clinic model with configurable schedule
- Working days, active hours, and appointment duration settings
- Full specialization management

### 📊 Activity Logs
- Tracks user actions for audit trail

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js (ES Modules) |
| **Framework** | Express.js v5 |
| **Database** | MongoDB + Mongoose |
| **Caching / Sessions** | Redis |
| **Authentication** | JSON Web Tokens (JWT) |
| **Image Storage** | ImageKit CDN |
| **File Upload** | Multer + Sharp (image processing) |
| **SMS** | Twilio |
| **Email** | Nodemailer + Pug templates |
| **Logging** | Pino + Pino-HTTP + Morgan |
| **Validation** | Zod + Validator.js |
| **Security** | Helmet, express-rate-limit, HPP, XSS sanitizer, Mongo sanitize |

---

## 🗺️ API Overview

> Base URL: `http://localhost:3000/api/v1`

### 🔑 Auth Endpoints (`/users`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/users/login` | All | Login with phone + password |
| `POST` | `/users/logout` | All | Logout (blacklists token) |
| `POST` | `/users/forgetPassword` | All | Send password reset email |
| `PATCH` | `/users/resetPassword/:token` | All | Reset password via token |
| `PATCH` | `/users/updateMyPassword` | All | Change own password |
| `GET` | `/users/me` | All | Get own profile |
| `PATCH` | `/users/updateMe` | All | Update own profile |
| `PATCH` | `/users/updateMyPhoto` | All | Upload/update profile photo |

### 👨‍⚕️ Doctors (`/doctors`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/doctors` | Admin, Receptionist | List all doctors |
| `GET` | `/doctors/:id` | Admin, Receptionist | Get doctor details |
| `POST` | `/doctors` | Admin | Create new doctor account |
| `PATCH` | `/doctors/:id` | Admin | Update doctor |
| `DELETE` | `/doctors/:id` | Admin | Delete doctor |

### 🧑 Patients (`/patient`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/patient` | Admin, Receptionist, Doctor | List all patients |
| `GET` | `/patient/:id` | Admin, Receptionist, Doctor | Get patient details |
| `POST` | `/patient` | Admin, Receptionist | Create patient account |
| `PATCH` | `/patient/:id` | Admin, Receptionist | Update patient |
| `DELETE` | `/patient/:id` | Admin | Delete patient |
| `GET` | `/patient/:id/profile` | All | Get patient medical profile |
| `PATCH` | `/patient/:id/favoriteDoctors` | Patient | Add/remove favorite doctor |

### 📅 Appointments (`/appointments`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/appointments` | Admin, Receptionist | List all appointments |
| `GET` | `/appointments/slots/:doctorId/:date` | All | Get available time slots |
| `GET` | `/appointments/my` | Patient, Doctor | Get own appointments |
| `POST` | `/appointments` | Admin, Receptionist, Patient | Book appointment |
| `PATCH` | `/appointments/:id/status` | Admin, Receptionist, Doctor | Update status |
| `PATCH` | `/appointments/:id/cancel` | All | Cancel appointment |
| `DELETE` | `/appointments/:id` | Admin | Delete appointment |

### 💊 Prescriptions (`/prescriptions`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/prescriptions` | Admin, Doctor | List prescriptions |
| `GET` | `/prescriptions/my` | Patient | Own prescriptions |
| `POST` | `/prescriptions` | Doctor | Create prescription |
| `PATCH` | `/prescriptions/:id` | Doctor | Update prescription |
| `DELETE` | `/prescriptions/:id` | Doctor, Admin | Delete prescription |

### 📋 Medical Reports (`/medicalReports`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/medicalReports` | Admin, Doctor | List all reports |
| `GET` | `/medicalReports/my` | Patient | Own medical reports |
| `POST` | `/medicalReports` | Doctor | Create report |
| `PATCH` | `/medicalReports/:id` | Doctor | Update report |
| `DELETE` | `/medicalReports/:id` | Doctor, Admin | Delete report |

### ⭐ Reviews (`/reviews`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/reviews` | All | List reviews |
| `POST` | `/reviews` | Patient | Create review |
| `PATCH` | `/reviews/:id` | Patient | Update own review |
| `DELETE` | `/reviews/:id` | Patient, Admin | Delete review |

### 🏥 Clinic (`/clinic`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/clinic` | All | Get clinic info |
| `PATCH` | `/clinic` | Admin | Update clinic settings |

### 🗂️ Receptionist (`/receptionist`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/receptionist` | Admin | List all receptionists |
| `POST` | `/receptionist` | Admin | Create receptionist |
| `PATCH` | `/receptionist/:id` | Admin | Update receptionist |
| `DELETE` | `/receptionist/:id` | Admin | Delete receptionist |

### 🏷️ Specializations (`/specializations`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/specializations` | All | List specializations |
| `POST` | `/specializations` | Admin | Create specialization |
| `PATCH` | `/specializations/:id` | Admin | Update specialization |
| `DELETE` | `/specializations/:id` | Admin | Delete specialization |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or Atlas)
- **Redis** (local or cloud)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/MediLink-BackEnd.git
cd MediLink-BackEnd

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example config.env
# Fill in your values in config.env

# 4. Start the development server
npm run dev
```

### Environment Variables

Create a `config.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
LOCAL_DATABASE=mongodb://localhost:27017/medilink

JWT_SECRET=your_strong_jwt_secret_here
JWT_EXPIRES_IN=7d

REDIS_USERNAME=default
REDIS_PASSWORD=your_redis_password
REDIS_HOST=localhost
REDIS_PORT=6379

TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE=+1234567890

IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

---

## 🌱 Seed Demo Data

To populate the database with realistic demo data for testing:

```bash
npm run seed
```

This will create:

| Entity | Count |
|--------|-------|
| Specializations | 7 |
| Doctors | 7 (one per specialization) |
| Receptionists | 2 |
| Patients | 15 |
| Appointments | 60+ (completed, pending, this week, next week, cancelled) |
| Prescriptions | 16 |
| Medical Reports | 16 |
| Reviews | 14 (with auto-updated doctor ratings) |

> 🔐 **All demo accounts use password:** `Test@1234`

### Demo Credentials

| Role | Phone | Name |
|------|-------|------|
| Admin | `01000000000` | توفيق عبدالله |
| Doctor (الباطنة) | `01011111111` | أحمد الألفي |
| Doctor (الجلدية) | `01022222222` | أماني العطار |
| Doctor (الأطفال) | `01033333333` | يمان علاء |
| Doctor (مخ وأعصاب) | `01034444444` | جلال عبدالله |
| Doctor (أنف وأذن) | `01035555555` | سارة سلامة |
| Doctor (الأسنان) | `01036666666` | خالد أسامة |
| Doctor (العين) | `01037777777` | ندى حسين |
| Receptionist | `01044444444` | نور طارق |
| Patient | `01066666666` | محمد حسين |

---

## 📁 Project Structure

```
MediLink-BackEnd/
├── app.js                  # Express app setup & middleware
├── server.js               # Server entry point
├── seed.js                 # Database seeder
├── config.env              # Environment variables
├── models/                 # Mongoose schemas
│   ├── userModel.js
│   ├── doctorProfileModel.js
│   ├── patientProfileModel.js
│   ├── receptionistModel.js
│   ├── clinicModel.js
│   ├── specializationModel.js
│   ├── appointmentModel.js
│   ├── prescriptionModel.js
│   ├── medicalReportModel.js
│   ├── reviewModel.js
│   └── activitiesModel.js
├── controllers/            # Route handlers & business logic
│   ├── authController.js
│   ├── doctorController.js
│   ├── patientController.js
│   ├── appointmentController.js
│   ├── prescriptionController.js
│   ├── medicalReportController.js
│   ├── reviewController.js
│   ├── handelerFactory.js  # Generic CRUD factory
│   └── globalErrorHandeler.js
├── routes/                 # Express routers
├── middlewares/            # Custom middleware
├── utils/                  # Helpers (AppError, ApiFeatures, etc.)
├── validationSchema/       # Zod validation schemas
└── config/                 # Configuration files (Redis, ImageKit)
```

---

## 🔒 Security Features

- ✅ **Helmet** — Secure HTTP headers
- ✅ **Rate Limiting** — 10,000 req/hour per IP
- ✅ **JWT Blacklisting** — Tokens invalidated on logout via Redis
- ✅ **bcrypt** — Passwords hashed with salt rounds of 12
- ✅ **XSS Protection** — Sanitizes request body
- ✅ **NoSQL Injection** — MongoDB query sanitization
- ✅ **HPP** — HTTP parameter pollution prevention
- ✅ **CORS** — Cross-Origin Resource Sharing configured

---

## 👨‍💻 Team

<div align="center">

| | Developer | Role |
|--|-----------|------|
| | Omar Alsheikh | Backend Developer |
| | Yousef Sheashia | Backend Developer |

> 🎓 **ITI Graduation Project — Information Technology Institute (ITI)**
> 
> Intake: 45 | Track: Full-Stack Web Development (MERN)

</div>

---

## 📄 License

This project is developed for educational purposes as part of the ITI graduation program.

---

<div align="center">

Made by Omar Alsheikh and Yousef Sheashia using Node.js + MongoDB

**MediLink — Connecting Patients with Better Care**

</div>
