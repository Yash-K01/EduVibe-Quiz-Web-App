const mongoose = require('mongoose');

const schoolSubjectSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  className: { type: Number, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'NCERTSubject', required: true },
  subjectName: { type: String, required: true },
  subjectCode: { type: String, required: true },
  isOptional: { type: Boolean, default: false },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  createdAt: { type: Date, default: Date.now }
});

// Ensure unique combination of school, class, and subject
schoolSubjectSchema.index({ schoolId: 1, className: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('SchoolSubject', schoolSubjectSchema);