import express from 'express';
import { body, validationResult } from 'express-validator';
import { authRequired, requireRole } from '../middleware/auth.js';
import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import Submission from '../models/Submission.js';

const router = express.Router();

// List assignments for a course (any auth'd user enrolled or instructor)
router.get('/course/:courseId', authRequired, async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  // allow students enrolled or course instructor/admin
  const isInstructor = String(course.instructor) === req.user.id || req.user.role === 'admin';
  const isEnrolled = course.students?.some((s) => String(s) === req.user.id);
  if (!isInstructor && !isEnrolled) return res.status(403).json({ error: 'Forbidden' });

  const list = await Assignment.find({ course: course._id }).sort({ createdAt: -1 });
  res.json(list);
});

// Create assignment (instructor or admin of that course)
router.post(
  '/course/:courseId',
  authRequired,
  requireRole(['instructor', 'admin']),
  [body('title').notEmpty(), body('description').notEmpty(), body('dueDate').isISO8601()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (req.user.role !== 'admin' && String(course.instructor) !== req.user.id) {
      return res.status(403).json({ error: 'Only the course instructor or admin can create assignments' });
    }

    const { title, description, dueDate } = req.body;
    const a = await Assignment.create({ course: course._id, title, description, dueDate, createdBy: req.user.id });
    res.status(201).json(a);
  }
);

// Submit assignment (student must be enrolled)
router.post('/submit/:assignmentId', authRequired, [body('text').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const assignment = await Assignment.findById(req.params.assignmentId).populate('course');
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  const course = assignment.course;
  const isEnrolled = course.students?.some((s) => String(s) === req.user.id);
  if (!isEnrolled) return res.status(403).json({ error: 'Enroll in the course to submit' });

  try {
    const s = await Submission.create({ assignment: assignment._id, student: req.user.id, text: req.body.text });
    res.status(201).json(s);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Already submitted' });
    throw e;
  }
});

// List submissions for an assignment (instructor/admin)
router.get('/submissions/:assignmentId', authRequired, requireRole(['instructor', 'admin']), async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId).populate('course');
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  if (req.user.role !== 'admin' && String(assignment.course.instructor) !== req.user.id) {
    return res.status(403).json({ error: 'Only the course instructor or admin can view submissions' });
  }
  const subs = await Submission.find({ assignment: assignment._id }).populate('student', 'name email');
  res.json(subs);
});

export default router;

// Student pending assignments
router.get('/student/pending', authRequired, async (req, res) => {
  // courses the student is enrolled in
  const courses = await Course.find({ students: req.user.id }).select('_id');
  const courseIds = courses.map((c) => c._id);
  if (courseIds.length === 0) return res.json([]);
  const assignments = await Assignment.find({ course: { $in: courseIds }, dueDate: { $gte: new Date(0) } }).lean();
  const aIds = assignments.map((a) => a._id);
  const submitted = await Submission.find({ student: req.user.id, assignment: { $in: aIds } }).select('assignment');
  const submittedSet = new Set(submitted.map((s) => String(s.assignment)));
  const pending = assignments
    .filter((a) => !submittedSet.has(String(a._id)))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  res.json(pending);
});

// Submissions to grade for instructor/admin
router.get('/to-grade', authRequired, requireRole(['instructor', 'admin']), async (req, res) => {
  const courses = await Course.find({ instructor: req.user.id }).select('_id');
  const courseIds = courses.map((c) => c._id);
  if (courseIds.length === 0) return res.json([]);
  const assignments = await Assignment.find({ course: { $in: courseIds } }).select('_id');
  const aIds = assignments.map((a) => a._id);
  const subs = await Submission.find({ assignment: { $in: aIds }, score: null })
    .populate('student', 'name email')
    .populate('assignment');
  res.json(subs);
});

// Grade a submission
router.patch('/grade/:submissionId', authRequired, requireRole(['instructor', 'admin']), [body('score').isInt({ min: 0, max: 100 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const sub = await Submission.findById(req.params.submissionId).populate({ path: 'assignment', populate: { path: 'course' } });
  if (!sub) return res.status(404).json({ error: 'Submission not found' });
  if (req.user.role !== 'admin' && String(sub.assignment.course.instructor) !== req.user.id) {
    return res.status(403).json({ error: 'Only the course instructor or admin can grade' });
  }
  sub.score = req.body.score;
  sub.gradedBy = req.user.id;
  sub.gradedAt = new Date();
  await sub.save();
  res.json(sub);
});
