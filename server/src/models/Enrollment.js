import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    lessonIndex: { type: Number, required: true },
    completed: { type: Boolean, default: false }
  },
  { _id: false }
);

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    progress: [progressSchema]
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);
