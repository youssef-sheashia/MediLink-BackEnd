import express from 'express';
import authnticate from '../middlewares/authenticate';
import { restrictTo } from '../controllers/authController';
import {appointmentQuerySchema} from '../utils/validators';
import { validateQuery } from '../middlewares/validate';
import { getMyAppointments } from '../controllers/appointmentController';
const router = express.Router();

router.use(authnticate);
router.use(restrictTo('doctor'));
router.get('/appointments', validateQuery(appointmentQuerySchema), getMyAppointments);
export default router;