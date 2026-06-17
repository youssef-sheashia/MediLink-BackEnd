import { deleteOne, getOne, updateOne, getAll } from "./handelerFactory.js";
import User from "../models/userModel.js";
import DoctorProfile from "../models/doctorProfileModel.js";
import Receptionist from "../models/receptionistModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
export const getOneUser = getOne(User);
export const getAllUsers = getAll(User);

/////////////////////////////////
export const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("+active");
  if (!user) {
    return next(new AppError("user not found", 404));
  }
  user.active = false;
  await user.save({ validateBeforeSave: false });
  res.status(204).json({
    status: "success",
  });
});

export const getMyProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("user not found", 404));
  }

  const profileModels = {
    doctor: DoctorProfile,
    // patient: PatientProfile,
    reception: Receptionist,
  };

  const Model = profileModels[user.role];

  const profile = Model ? await Model.findOne({ user: user._id }) : null;

  res.status(200).json({
    status: "success",
    data: {
      user,
      profile,
    },
  });
});

/////////////////////

const filterObj = function (obj, ...fields) {
  const newobj = {};
  Object.keys(obj).forEach((el) => {
    if (fields.includes(el)) {
      newobj[el] = obj[el];
    }
  });
  return newobj;
};

///////////////////////
export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.confirmpassword)
    return next(
      new AppError(
        "you can not update your password on this route please use update password",
        400,
      ),
    );
  const updateObj = filterObj(req.body, "firstName", "lastName", "photo");
  const updateUser = await User.findByIdAndUpdate(req.user.id, updateObj, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "succes",
    data: updateUser,
  });
});
