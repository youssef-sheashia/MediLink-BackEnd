import { deleteOne, getOne, updateOne, getAll } from "./handelerFactory.js";
import User from "../models/userModel.js";
export const getOneUser = getOne(User);
export const deleteUser = deleteOne(User);
export const updateUser = updateOne(User);
export const getAllUsers = getAll(User);
