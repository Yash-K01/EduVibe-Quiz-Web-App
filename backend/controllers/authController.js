const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register admin
// @route   POST /api/auth/register
// @access  Public
exports.registerAdmin = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { schoolName, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Create new admin
    const admin = await Admin.create({
      schoolName,
      email,
      password
    });

    // Generate token
    const token = generateToken(admin._id);

    // Remove password from response
    admin.password = undefined;

    res.status(201).json({
      success: true,
      token,
      data: admin
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, rememberMe } = req.body;

    // Check if admin exists and include password field
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordMatch = await admin.comparePassword(password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save({ validateBeforeSave: false });

    // Generate token with different expiry based on rememberMe
    const tokenExpire = rememberMe ? '30d' : process.env.JWT_EXPIRE;
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: tokenExpire
    });

    // Remove password from response
    admin.password = undefined;

    res.status(200).json({
      success: true,
      token,
      data: admin
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get current logged in admin
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Logout admin / Clear token
// @route   POST /api/auth/logout
// @access  Private
exports.logoutAdmin = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};