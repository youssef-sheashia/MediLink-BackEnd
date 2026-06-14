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
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query ?? {});
  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => {
        const field = issue.path.join(".");
        return field ? `${field}: ${issue.message}` : issue.message;
      })
      .join(", ");
    return next(new AppError(messages, 400));
  }
  req.query = result.data;
  next();
};