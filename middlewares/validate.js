import AppError from "../utils/appError.js";
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const messages = result.error.issues
      .map((err) => {
        const field = err.path.join(".");
        return field ? `${field}: ${err.message}` : err.message;
      })
      .join(", ");
    return next(new AppError(messages, 400));
  }

  req.body = result.data;
  next();
};
