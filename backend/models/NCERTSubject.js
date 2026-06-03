const mongoose = require('mongoose');

const ncertSubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  classes: [{ type: Number }], // Which classes this subject is available for (6-12)
  category: { type: String, enum: ['core', 'elective', 'language'], default: 'core' },
  description: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('NCERTSubject', ncertSubjectSchema);