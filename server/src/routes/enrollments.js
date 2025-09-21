import express from 'express';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// Enroll in a course
router.post('/:courseId', authRequired, async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const progress = course.lessons.map((_, idx) => ({ lessonIndex: idx, completed: false }));
  try {
    const enrollment = await Enrollment.create({ student: req.user.id, course: course._id, progress });
    // also track on course document
    if (!course.students.some((s) => String(s) === req.user.id)) {
      course.students.push(req.user.id);
      await course.save();
    }
    res.status(201).json(enrollment);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Already enrolled' });
    throw e;
  }
});

// My enrollments
router.get('/me', authRequired, async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user.id }).populate('course');
  res.json(enrollments);
});

// Update lesson progress
router.patch('/:courseId/progress/:lessonIndex', authRequired, async (req, res) => {
  const { courseId, lessonIndex } = req.params;
  const enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId });
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

  const idx = parseInt(lessonIndex, 10);
  const item = enrollment.progress.find((p) => p.lessonIndex === idx);
  if (!item) return res.status(404).json({ error: 'Lesson not found' });
  item.completed = true;
  await enrollment.save();
  res.json(enrollment);
});

export default router;
