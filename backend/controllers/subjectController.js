const Subject = require('../models/Subject');
const Admin = require('../models/Admin');

// @desc    Add multiple subjects for a class
// @route   POST /api/subjects/add-bulk
// @access  Private (Admin only)
exports.addSubjectsBulk = async (req, res) => {
  try {
    const { className, subjects } = req.body;
    
    // Get admin info to get school name
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Validate input
    if (!className) {
      return res.status(400).json({
        success: false,
        message: 'Class name is required'
      });
    }

    if (!subjects || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one subject is required'
      });
    }

    // Filter out empty subjects
    const validSubjects = subjects.filter(s => s.name && s.name.trim() !== '');
    
    if (validSubjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter valid subject names'
      });
    }

    // Prepare subjects for bulk insert
    const subjectsToAdd = validSubjects.map(subject => ({
      name: subject.name.trim(),
      code: subject.code ? subject.code.toUpperCase() : subject.name.substring(0, 3).toUpperCase(),
      className: parseInt(className),
      isOptional: subject.isOptional || false,
      schoolName: admin.schoolName,
      createdBy: req.user.id
    }));

    // Check for existing subjects to avoid duplicates
    const existingSubjects = await Subject.find({
      className: parseInt(className),
      schoolName: admin.schoolName,
      name: { $in: subjectsToAdd.map(s => s.name) }
    });

    if (existingSubjects.length > 0) {
      const existingNames = existingSubjects.map(s => s.name);
      return res.status(400).json({
        success: false,
        message: `Subjects already exist for this class: ${existingNames.join(', ')}`,
        existingSubjects
      });
    }

    // Insert all subjects
    const savedSubjects = await Subject.insertMany(subjectsToAdd);
    
    res.status(201).json({
      success: true,
      message: `${savedSubjects.length} subjects added successfully for Class ${className}`,
      data: savedSubjects,
      count: savedSubjects.length
    });

  } catch (error) {
    console.error('Bulk add subjects error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate subject found. Some subjects already exist for this class.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while adding subjects',
      error: error.message
    });
  }
};

// @desc    Get subjects by class
// @route   GET /api/subjects/class/:className
// @access  Private
exports.getSubjectsByClass = async (req, res) => {
  try {
    const { className } = req.params;
    
    // Get admin info
    const admin = await Admin.findById(req.user.id);
    
    const subjects = await Subject.find({
      className: parseInt(className),
      schoolName: admin.schoolName
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: subjects,
      count: subjects.length
    });

  } catch (error) {
    console.error('Get subjects by class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subjects',
      error: error.message
    });
  }
};

// @desc    Get all subjects (with filters)
// @route   GET /api/subjects
// @access  Private
exports.getAllSubjects = async (req, res) => {
  try {
    const { className, search } = req.query;
    
    // Get admin info
    const admin = await Admin.findById(req.user.id);
    
    let query = { schoolName: admin.schoolName };
    
    // Filter by class
    if (className) {
      query.className = parseInt(className);
    }
    
    // Search by name or code
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    const subjects = await Subject.find(query)
      .sort({ className: 1, name: 1 });
    
    // Group by class
    const groupedByClass = subjects.reduce((acc, subject) => {
      const classKey = subject.className;
      if (!acc[classKey]) {
        acc[classKey] = [];
      }
      acc[classKey].push(subject);
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      data: subjects,
      groupedByClass,
      count: subjects.length
    });

  } catch (error) {
    console.error('Get all subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subjects',
      error: error.message
    });
  }
};

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
// @access  Private
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Get admin info
    const admin = await Admin.findById(req.user.id);
    
    // Check if subject belongs to admin's school
    if (subject.schoolName !== admin.schoolName) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Subject belongs to different school.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: subject
    });

  } catch (error) {
    console.error('Get subject by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching subject',
      error: error.message
    });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private
exports.updateSubject = async (req, res) => {
  try {
    const { name, code, isOptional } = req.body;
    
    let subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Get admin info
    const admin = await Admin.findById(req.user.id);
    
    // Check if subject belongs to admin's school
    if (subject.schoolName !== admin.schoolName) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Subject belongs to different school.'
      });
    }
    
    // Update fields
    if (name) subject.name = name;
    if (code) subject.code = code.toUpperCase();
    if (isOptional !== undefined) subject.isOptional = isOptional;
    
    await subject.save();
    
    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    });

  } catch (error) {
    console.error('Update subject error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this name already exists for this class'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating subject',
      error: error.message
    });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Get admin info
    const admin = await Admin.findById(req.user.id);
    
    // Check if subject belongs to admin's school
    if (subject.schoolName !== admin.schoolName) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Subject belongs to different school.'
      });
    }
    
    await subject.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
      data: subject
    });

  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting subject',
      error: error.message
    });
  }
};