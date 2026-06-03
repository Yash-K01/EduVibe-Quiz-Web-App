const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// Create uploads directory if not exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'student-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

// ============ SCHEMAS ============

// Admin Schema
const adminSchema = new mongoose.Schema({
  schoolName: String,
  email: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now }
});
const Admin = mongoose.model('Admin', adminSchema);

// NCERT Subject Schema (Master Subjects)
const ncertSubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  classes: [{ type: Number }],
  category: { type: String, enum: ['core', 'elective', 'language'], default: 'core' }
});
const NCERTSubject = mongoose.model('NCERTSubject', ncertSubjectSchema);

// School Subject Schema
const schoolSubjectSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  className: { type: Number, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'NCERTSubject', required: true },
  subjectName: { type: String, required: true },
  subjectCode: { type: String, required: true },
  isOptional: { type: Boolean, default: false }
});
const SchoolSubject = mongoose.model('SchoolSubject', schoolSubjectSchema);

// Teacher Schema
const teacherSchema = new mongoose.Schema({
  teacherId: { type: String, required: true, unique: true },
  teacherName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  qualifications: String,
  experience: Number,
  schoolName: { type: String, required: true },
  isClassTeacher: { type: Boolean, default: false },
  assignedClass: { type: Number, default: null },
  subjects: [{
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolSubject' },
    subjectName: String,
    className: Number
  }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  lastLogin: Date
}, { timestamps: true });
const Teacher = mongoose.model('Teacher', teacherSchema);

// Student Schema - UPDATED with profile fields
const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  studentName: { type: String, required: true },
  className: { type: Number, required: true },
  rollNo: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  schoolName: { type: String, required: true },
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  subjects: [{
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolSubject' },
    subjectName: String,
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
  }],
  photo: { type: String, default: '' },
  dateOfBirth: { type: String, default: '' },
  fatherName: { type: String, default: '' },
  motherName: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  parentMobile: { type: String, default: '' },
  admissionDate: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  lastLogin: Date
}, { timestamps: true });
const Student = mongoose.model('Student', studentSchema);

// ============ QUIZ SCHEMA ============
const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolSubject', required: true },
  subjectName: { type: String, required: true },
  className: { type: Number, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  teacherName: { type: String, required: true },
  duration: { type: Number, required: true, default: 60 },
  totalQuestions: { type: Number, required: true },
  totalMarks: { type: Number, default: 0 },
  questions: [{
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOption: { type: Number, required: true },
    marks: { type: Number, default: 1 },
    _id: false
  }],
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Quiz = mongoose.model('Quiz', quizSchema);

// ============ RESULT SCHEMA ============
const resultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  quizName: { type: String, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolSubject', required: true },
  subjectName: { type: String, required: true },
  className: { type: Number, required: true },
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  answers: [{
    questionId: { type: Number },
    questionText: String,
    selectedOption: Number,
    correctOption: Number,
    isCorrect: Boolean,
    marksObtained: Number
  }],
  submittedAt: { type: Date, default: Date.now }
});
const Result = mongoose.model('Result', resultSchema);

// ============ AUTH ROUTES ============

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server running' });
});

// Admin Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { schoolName, email, password } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ success: false, message: 'Email already registered' });
    
    const admin = await Admin.create({ schoolName, email, password });
    res.status(201).json({
      success: true,
      token: 'token-' + Date.now(),
      data: { id: admin._id, schoolName: admin.schoolName, email: admin.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin || admin.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    res.json({
      success: true,
      token: 'admin-token-' + Date.now(),
      data: { id: admin._id, schoolName: admin.schoolName, email: admin.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Teacher Login
app.post('/api/auth/teacher-login', async (req, res) => {
  try {
    const { teacherId, password } = req.body;
    const teacher = await Teacher.findOne({ teacherId }).select('+password');
    if (!teacher) {
      return res.status(401).json({ success: false, message: 'Invalid Teacher ID or password' });
    }
    if (teacher.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid Teacher ID or password' });
    }
    teacher.lastLogin = Date.now();
    await teacher.save();
    teacher.password = undefined;
    res.json({ success: true, token: 'teacher-token-' + Date.now(), data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Student Login
app.post('/api/auth/student-login', async (req, res) => {
  try {
    const { studentId, email, password } = req.body;
    
    let query = {};
    if (studentId) {
      query = { studentId: studentId };
    } else if (email) {
      query = { email: email };
    } else {
      return res.status(400).json({ success: false, message: 'Student ID or Email is required' });
    }
    
    const student = await Student.findOne(query).select('+password');
    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid Student ID or password' });
    }
    
    if (student.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid Student ID or password' });
    }
    
    student.lastLogin = Date.now();
    await student.save();
    student.password = undefined;
    
    res.json({ success: true, token: 'student-token-' + Date.now(), data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ SUBJECT ROUTES ============

// Get NCERT subjects by class
app.get('/api/subjects/ncert/:className', async (req, res) => {
  try {
    const subjects = await NCERTSubject.find({
      classes: { $in: [parseInt(req.params.className)] }
    }).sort({ category: 1, name: 1 });
    res.json({ success: true, data: subjects, count: subjects.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get school's selected subjects for a class
app.get('/api/subjects/school/:className', async (req, res) => {
  try {
    const admin = await Admin.findOne({});
    const subjects = await SchoolSubject.find({
      schoolId: admin._id,
      className: parseInt(req.params.className)
    }).populate('subjectId');
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save selected subjects for a class
app.post('/api/subjects/school/save', async (req, res) => {
  try {
    const { className, selectedSubjects } = req.body;
    const admin = await Admin.findOne({});
    
    await SchoolSubject.deleteMany({ schoolId: admin._id, className: parseInt(className) });
    
    const subjectsToSave = selectedSubjects.map(s => ({
      schoolId: admin._id,
      className: parseInt(className),
      subjectId: s.subjectId,
      subjectName: s.name,
      subjectCode: s.code,
      isOptional: s.isOptional || false
    }));
    
    const saved = await SchoolSubject.insertMany(subjectsToSave);
    res.json({ success: true, message: `${saved.length} subjects saved`, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ TEACHER ROUTES ============

// Generate unique teacher ID
app.get('/api/teachers/generate-id', async (req, res) => {
  try {
    const count = await Teacher.countDocuments();
    const teacherId = `TCH${new Date().getFullYear()}${(count + 1).toString().padStart(4, '0')}`;
    res.json({ success: true, teacherId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get assigned class teachers
app.get('/api/teachers/class-teachers', async (req, res) => {
  try {
    const admin = await Admin.findOne({});
    const classTeachers = await Teacher.find({ 
      schoolName: admin.schoolName,
      isClassTeacher: true 
    }).select('assignedClass');
    const assignedClasses = classTeachers.map(t => t.assignedClass).filter(c => c);
    res.json({ success: true, data: assignedClasses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new teacher
app.post('/api/teachers/add', async (req, res) => {
  try {
    const { 
      teacherName, 
      teacherId, 
      email, 
      phone, 
      qualifications, 
      experience, 
      schoolName, 
      subjects,
      isClassTeacher,
      assignedClass,
      password
    } = req.body;
    
    const admin = await Admin.findOne({ schoolName });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    
    const existing = await Teacher.findOne({ $or: [{ email }, { teacherId }] });
    if (existing) return res.status(400).json({ success: false, message: 'Teacher already exists' });
    
    if (isClassTeacher && assignedClass) {
      const existingClassTeacher = await Teacher.findOne({ 
        schoolName, 
        isClassTeacher: true, 
        assignedClass: assignedClass 
      });
      if (existingClassTeacher) {
        return res.status(400).json({ 
          success: false, 
          message: `Class ${assignedClass} already has a class teacher: ${existingClassTeacher.teacherName}` 
        });
      }
    }
    
    const plainPassword = password || 'teacher@123';
    
    const teacher = new Teacher({
      teacherId,
      teacherName,
      email,
      phone,
      password: plainPassword,
      qualifications: qualifications || '',
      experience: experience || 0,
      schoolName,
      subjects: subjects || [],
      isClassTeacher: isClassTeacher || false,
      assignedClass: assignedClass || null,
      createdBy: admin._id,
      isActive: true
    });
    
    await teacher.save();
    
    const teacherData = teacher.toObject();
    delete teacherData.password;
    
    res.json({ 
      success: true, 
      message: 'Teacher added successfully', 
      data: teacherData
    });
  } catch (error) {
    console.error('Add teacher error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all teachers
app.get('/api/teachers', async (req, res) => {
  try {
    const admin = await Admin.findOne({});
    const teachers = await Teacher.find({ schoolName: admin.schoolName }).select('-password');
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single teacher
app.get('/api/teachers/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select('-password');
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update teacher
app.put('/api/teachers/:id', async (req, res) => {
  try {
    const { teacherName, email, phone, qualifications, experience, subjects, isClassTeacher, assignedClass, isActive } = req.body;
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    
    if (teacherName) teacher.teacherName = teacherName;
    if (email) teacher.email = email;
    if (phone) teacher.phone = phone;
    if (qualifications !== undefined) teacher.qualifications = qualifications;
    if (experience !== undefined) teacher.experience = experience;
    if (subjects) teacher.subjects = subjects;
    if (isActive !== undefined) teacher.isActive = isActive;
    if (isClassTeacher !== undefined) teacher.isClassTeacher = isClassTeacher;
    if (assignedClass !== undefined) teacher.assignedClass = assignedClass;
    
    await teacher.save();
    teacher.password = undefined;
    res.json({ success: true, message: 'Teacher updated', data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete teacher
app.delete('/api/teachers/:id', async (req, res) => {
  try {
    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Teacher deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ STUDENT ROUTES ============

// Generate unique student ID
app.get('/api/students/generate-id', async (req, res) => {
  try {
    const count = await Student.countDocuments();
    const studentId = `STU${new Date().getFullYear()}${(count + 1).toString().padStart(4, '0')}`;
    res.json({ success: true, studentId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new student
app.post('/api/students/add', async (req, res) => {
  try {
    const { 
      studentName, 
      studentId, 
      className, 
      rollNo,
      gender,
      bloodGroup,
      email,
      password,
      schoolName, 
      classTeacher, 
      subjects 
    } = req.body;
    
    const admin = await Admin.findOne({ schoolName });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    
    const existing = await Student.findOne({ 
      $or: [{ studentId: studentId }, { email: email }] 
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student with this ID or Email already exists' 
      });
    }
    
    const student = await Student.create({
      studentId,
      studentName,
      className,
      rollNo,
      gender,
      bloodGroup,
      email,
      password,
      schoolName,
      classTeacher,
      subjects: subjects || [],
      createdBy: admin._id,
      isActive: true
    });
    
    student.password = undefined;
    
    console.log('✅ Student Created:', student.studentId, student.email);
    
    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      data: student
    });
    
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const admin = await Admin.findOne({});
    const students = await Student.find({ schoolName: admin.schoolName })
      .select('-password')
      .populate('classTeacher', 'teacherName teacherId')
      .populate('subjects.subjectId', 'name code');
    
    res.status(200).json({
      success: true,
      data: students,
      count: students.length
    });
    
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single student by ID
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .select('-password')
      .populate('classTeacher', 'teacherName teacherId')
      .populate('subjects.subjectId', 'name code')
      .populate('subjects.teacherId', 'teacherName');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update student
app.put('/api/students/:id', async (req, res) => {
  try {
    const { 
      studentName, 
      rollNo,
      gender,
      bloodGroup,
      email,
      classTeacher, 
      subjects, 
      isActive 
    } = req.body;
    
    let student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (studentName) student.studentName = studentName;
    if (rollNo) student.rollNo = rollNo;
    if (gender) student.gender = gender;
    if (bloodGroup) student.bloodGroup = bloodGroup;
    if (email) student.email = email;
    if (classTeacher) student.classTeacher = classTeacher;
    if (subjects) student.subjects = subjects;
    if (isActive !== undefined) student.isActive = isActive;
    
    await student.save();
    student.password = undefined;
    
    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
    
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete student
app.delete('/api/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ PROFILE ROUTES ============

// Get student profile
app.get('/api/student/profile/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update student profile with photo upload
app.put('/api/student/profile/:id', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Handle file upload
    if (req.file) {
      updates.photo = `/uploads/${req.file.filename}`;
    }
    
    const student = await Student.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.json({ success: true, message: 'Profile updated successfully', data: student });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ QUIZ ROUTES ============

// Create Quiz
app.post('/api/quizzes/create', async (req, res) => {
  try {
    const { title, description, subjectId, subjectName, className, teacherId, teacherName, duration, questions } = req.body;
    
    const totalQuestions = questions.length;
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    
    const quiz = new Quiz({
      title,
      description,
      subjectId,
      subjectName,
      className,
      teacherId,
      teacherName,
      duration,
      totalQuestions,
      totalMarks,
      questions,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await quiz.save();
    
    res.json({ success: true, message: 'Quiz created successfully', data: quiz });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Quizzes by Teacher
app.get('/api/quizzes/teacher', async (req, res) => {
  try {
    const { teacherId } = req.query;
    const quizzes = await Quiz.find({ teacherId }).sort({ createdAt: -1 });
    res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Quizzes by Class
app.get('/api/quizzes/class/:className', async (req, res) => {
  try {
    const { className } = req.params;
    const quizzes = await Quiz.find({ className: parseInt(className) }).sort({ createdAt: -1 });
    res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Get quizzes by class error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Quiz by ID
app.get('/api/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Quiz
app.put('/api/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    
    if (quiz.isPublished) {
      return res.status(400).json({ success: false, message: 'Published quizzes cannot be edited' });
    }
    
    const { title, description, duration, questions } = req.body;
    const totalQuestions = questions.length;
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    
    quiz.title = title;
    quiz.description = description;
    quiz.duration = duration;
    quiz.questions = questions;
    quiz.totalQuestions = totalQuestions;
    quiz.totalMarks = totalMarks;
    quiz.updatedAt = new Date();
    
    await quiz.save();
    
    res.json({ success: true, message: 'Quiz updated successfully', data: quiz });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Quiz
app.delete('/api/quizzes/:id', async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Publish Quiz
app.put('/api/quizzes/:id/publish', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    
    quiz.isPublished = true;
    quiz.updatedAt = new Date();
    await quiz.save();
    
    res.json({ success: true, message: 'Quiz published successfully', data: quiz });
  } catch (error) {
    console.error('Publish quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ RESULT ROUTES ============

// Submit Quiz Result
app.post('/api/results/submit', async (req, res) => {
  try {
    const { studentId, studentName, quizId, quizName, subjectId, subjectName, className, score, totalMarks, percentage, answers } = req.body;
    
    const existingResult = await Result.findOne({ studentId, quizId });
    if (existingResult) {
      return res.status(400).json({ success: false, message: 'Quiz already attempted' });
    }
    
    const result = new Result({
      studentId,
      studentName,
      quizId,
      quizName,
      subjectId,
      subjectName,
      className,
      score,
      totalMarks,
      percentage,
      answers
    });
    
    await result.save();
    
    res.json({ success: true, message: 'Result submitted successfully', data: result });
  } catch (error) {
    console.error('Submit result error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Results by Student
app.get('/api/results/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const results = await Result.find({ studentId }).sort({ submittedAt: -1 });
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Get student results error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Results by Quiz
app.get('/api/results/quiz/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const results = await Result.find({ quizId }).sort({ score: -1 });
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Results by Class and Subject
app.get('/api/results/class/:className/subject/:subjectId', async (req, res) => {
  try {
    const { className, subjectId } = req.params;
    const results = await Result.find({ 
      className: parseInt(className), 
      subjectId 
    }).populate('studentId', 'studentName rollNo studentId');
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Get class results error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅ SERVER RUNNING ON http://localhost:${PORT}`);
  console.log(`📌 Health: http://localhost:${PORT}/api/health\n`);
});