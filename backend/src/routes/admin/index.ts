import { Router } from 'express';

const adminRouter = Router();

import dashboardRoutes from './dashboard.routes';

// Dashboard Routes
adminRouter.use('/dashboard', dashboardRoutes);

// Course Outcome Routes
// adminRouter.use('/course-outcomes', courseOutcomeRoutes);

// Subject Routes
// adminRouter.use('/subjects', subjectRoutes);

import facultyRoutes from './faculty.routes';
import courseOutcomesRoutes from './course-outcomes.routes';

// Faculty Routes
adminRouter.use('/faculty', facultyRoutes);

// Course Outcomes Routes
adminRouter.use('/course-outcomes', courseOutcomesRoutes);

// Admin Survey Routes
import adminSurveyRoutes from '../admin.survey.routes';
adminRouter.use('/survey', adminSurveyRoutes);

// Admin Outcomes Routes
import outcomesRoutes from './outcomes.routes';
adminRouter.use('/outcomes', outcomesRoutes);

// Faculty Assignment Routes
// adminRouter.use('/assignments', assignmentRoutes);

// Attainment Config Routes
import attainmentRoutes from './attainment.routes';
adminRouter.use('/attainment-configurations', attainmentRoutes);

export default adminRouter;
