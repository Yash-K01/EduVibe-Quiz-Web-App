const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  registerAdmin, 
  loginAdmin, 
  getMe, 
  logoutAdmin 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Validation rules
const registerValidation = [
  body('schoolName')
    .notEmpty()
    .withMessage('School name is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('School name cannot exceed 100 characters'),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, registerAdmin);
router.post('/login', loginValidation, loginAdmin);
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutAdmin);

module.exports = router;