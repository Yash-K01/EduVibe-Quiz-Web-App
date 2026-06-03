const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  addSubjectsBulk,
  getSubjectsByClass,
  getAllSubjects,
  updateSubject,
  deleteSubject,
  getSubjectById
} = require('../controllers/subjectController');

// All routes require authentication
router.use(protect);

// Bulk add subjects
router.post('/add-bulk', addSubjectsBulk);

// Get subjects by class
router.get('/class/:className', getSubjectsByClass);

// Get all subjects
router.get('/', getAllSubjects);

// Get single subject
router.get('/:id', getSubjectById);

// Update subject
router.put('/:id', updateSubject);

// Delete subject
router.delete('/:id', deleteSubject);

module.exports = router;