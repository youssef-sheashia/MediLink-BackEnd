import catchAsync from "../utils/catchAsync.js";
export const getMyAppointments = catchAsync(async (req, res, next) => {
  const { date, startDate, endDate, month, year } = req.query;

  let filter = { doctor: req.user._id };

  if (date) {
    // for day date=2026-04-13
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  } else if (startDate && endDate) {
    // month startDate=2026-04-13&endDate=2026-04-19
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  } else if (month && year) {
    // for year month=4&year=2026
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    filter.date = { $gte: start, $lte: end };
  }

  const appointments = await Appointment.find(filter)
    .populate("patient", "firstName lastName phone photo")
    .sort("date slotTime");

  res.status(200).json({
    status: "success",
    results: appointments.length,
    data: { appointments },
  });
});
