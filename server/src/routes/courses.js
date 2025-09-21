import express from 'express';
import { body, validationResult } from 'express-validator';
import Course from '../models/Course.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public list with basic filters
router.get('/', async (req, res) => {
  const { q, tag } = req.query;
  const filter = {};
  if (q) filter.title = { $regex: q, $options: 'i' };
  if (tag) filter.tags = tag;
  const courses = await Course.find(filter).populate('instructor', 'name');
  res.json(courses);
});

// My courses (instructor/admin)
router.get('/mine', authRequired, requireRole(['instructor', 'admin']), async (req, res) => {
  const courses = await Course.find({ instructor: req.user.id }).sort({ createdAt: -1 });
  res.json(courses);
});

// Seed demo courses (any authenticated user) for quick testing
router.post('/seed', authRequired, async (req, res) => {
  const count = await Course.countDocuments();
  if (count > 0) return res.status(400).json({ error: 'Courses already exist' });

  const docs = await Course.insertMany([
    {
      title: 'JavaScript Basics',
      description: 'Learn the fundamentals of JS',
      instructor: req.user.id,
      tags: ['javascript', 'beginner'],
      lessons: [
        { title: 'Intro', content: 'What is JavaScript?' },
        { title: 'Variables', content: 'let vs const' }
      ]
    },
    {
      title: 'React Essentials',
      description: 'Components, state, and props',
      instructor: req.user.id,
      tags: ['react'],
      lessons: [
        { title: 'Components', content: 'Function components' },
        { title: 'State', content: 'useState basics' }
      ]
    }
  ]);

  res.status(201).json(docs);
});

// Create course (instructor or admin)
router.post(
  '/',
  authRequired,
  requireRole(['instructor', 'admin']),
  [body('title').notEmpty(), body('description').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, lessons = [], tags = [] } = req.body;
    const course = await Course.create({
      title,
      description,
      lessons,
      tags,
      instructor: req.user.id
    });
    res.status(201).json(course);
  }
);

// Get single course
router.get('/:id', async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('instructor', 'name')
    .populate('students', 'name email');
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

// Update course (owner instructor or admin)
router.put(
  '/:id',
  authRequired,
  requireRole(['instructor', 'admin']),
  [body('title').optional().notEmpty(), body('description').optional().notEmpty()],
  async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (req.user.role !== 'admin' && String(course.instructor) !== req.user.id) {
      return res.status(403).json({ error: 'Only the instructor owner or admin can update' });
    }
    const { title, description, tags, lessons } = req.body;
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (Array.isArray(tags)) course.tags = tags;
    if (Array.isArray(lessons)) course.lessons = lessons;
    await course.save();
    res.json(course);
  }
);

// Delete course (owner instructor or admin)
router.delete('/:id', authRequired, requireRole(['instructor', 'admin']), async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  if (req.user.role !== 'admin' && String(course.instructor) !== req.user.id) {
    return res.status(403).json({ error: 'Only the instructor owner or admin can delete' });
  }
  await course.deleteOne();
  res.json({ success: true });
});

export default router;
