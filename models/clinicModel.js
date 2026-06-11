import mongoose from "mongoose";

const clinicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "clinic name is required"],
      trim: true,
      minlength: [2, "clinic name must be at least 2 characters"],
      maxlength: [100, "clinic name must be at most 100 characters"],
    },
    address: {
      country: {
        type: String,
        required: [true, "country is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "city is required"],
        trim: true,
      },
      governorate: {
        type: String,
        required: [true, "governorate is required"],
        trim: true,
      },
    },
    description: {
      type: String,
      required: [true, "description is required"],
      trim: true,
      minlength: [10, "description must be at least 10 characters"],
      maxlength: [500, "description must be at most 500 characters"],
    },
    phone: {
      type: String,
      required: [true, "phone is required"],
      unique: true,
      trim: true,
      validate: {
        validator: function (value) {
          return /^(\+?2?0)?1[0125][0-9]{8}$/.test(value);
        },
        message: "please provide a valid egyptian phone number",
      },
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: "email must be a valid email address",
      },
    },
    schedule: {
      appointmentDuration: {
        type: Number,
        required: [true, "appointment duration is required"],
        min: [5, "duration must be at least 5 minutes"],
        max: [180, "duration must be at most 180 minutes"],
        default: 25,
      },
      maxAppointmentsPerDay: {
        type: Number,
        required: [true, "max appointments is required"],
        min: [1, "must allow at least 1 appointment"],
        max: [100, "max appointments seems too high"],
        default: 8,
      },
      workingDays: [
        {
          day: {
            type: String,
            enum: [
              "السبت",
              "الاحد",
              "الاثنين",
              "الثلاثاء",
              "الاربعاء",
              "الخميس",
              "الجمعة"
            ],
            required: true,
          },
          isActive: {
            type: Boolean,
            default: false,
          },
          startTime: {
            type: String, 
            default: null,
          },
          endTime: {
            type: String,
            default: null,
          },
        },
      ],
    },
  },
  { timestamps: true },
);

const Clinic = mongoose.model("Clinic", clinicSchema);

export default Clinic;
