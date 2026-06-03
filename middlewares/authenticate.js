import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";
import jwt from 'jsonwebtoken';
const authnticate = catchAsync(async (req,res,next)=>{
  let token;
  if(req.headers.authorization && req.headers.authorization.startsWith("Bearer"))
    token=req.headers.authorization.split(" ")[1];
  if(!token)
    return next(new AppError("unauthorized, please login first",401));
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if(!user)
    return next(new AppError("user not found",401));
  if (user.changedPasswordAfter(decoded.iat))
    return next(new AppError("password was recently changed, please login again", 401));
  req.user=user;
  next();
});
export default authnticate;