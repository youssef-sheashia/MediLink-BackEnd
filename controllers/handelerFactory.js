import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { APIFeatures } from "../utils/apiFeatures.js";
export const deleteOne = (Model) =>
  catchAsync(async function (req, res, next) {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError("document not found", 404));
    }
    res.status(204).json({
      status: "success",
    });
  });
export const createOne = (Model) =>
  catchAsync(async function (req, res, next) {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });
export const updateOne = (Model) =>
  catchAsync(async function (req, res, next) {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError("document not found", 404));
    }
    res.status(200).json({
      status: "success",
      data: doc,
    });
  });
export const getOne = (Model, popOption) =>
  catchAsync(async function (req, res, next) {
    let query = Model.findById(req.params.id);
    if (popOption) query = query.populate(popOption);
    const doc = await query;

    if (!doc) {
      return next(new AppError("doc not found", 404));
    }
    res.status(200).json({
      status: "success",
      data: doc,
    });
  });
export const getAll = (Model) =>
  catchAsync(async function (req, res, next) {
    const filter = {};
    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: doc.length,
      data: {
        doc,
      },
    });
  });
