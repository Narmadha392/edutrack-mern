import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true }
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lessons: [lessonSchema],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tags: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model('Course', courseSchema);
