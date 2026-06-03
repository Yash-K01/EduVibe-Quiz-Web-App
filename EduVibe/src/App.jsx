import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Common Components
import Home from './components/Home';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import AdminRegister from './components/admin/AdminRegister';
import AdminLogin from './components/admin/AdminLogin';
import AddStudent from './components/admin/AddStudent';
import AddTeacher from './components/admin/AddTeacher';
import AddSubjects from './components/admin/AddSubjects';

// Teacher Components
import TeacherLogin from './components/teacher/TeacherLogin';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import TeacherSubject from './components/teacher/MySubjects';
import CreateQuiz from './components/teacher/CreateQuiz';
import MyQuizzes from './components/teacher/MyQuizzes';

// Student Components
import StudentLogin from './components/student/StudentLogin';
import StudentDashboard from './components/student/StudentDashboard';
import StudentSubject from './components/student/StudSubjects';
import StudentResults from './components/student/StudentResults';
import StudentProfile from './components/student/StudentProfile';

function App() {
  return (
    <Router>
      <Routes>
        {/* Common Routes */}
        <Route path="/" element={<Home />} />
        
        {/* Admin Routes */}
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/create-student" element={<AddStudent />} />
        <Route path="/create-teacher" element={<AddTeacher />} />
        <Route path="/add-subject" element={<AddSubjects />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        
        {/* Teacher Routes */}
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/my-subjects" element={<TeacherSubject />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/teacher-quizzes" element={<MyQuizzes />} />
        
        {/* Student Routes */}
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student-subjects" element={<StudentSubject />} />
        <Route path="/my-results" element={<StudentResults />} />
        <Route path="/profile" element={<StudentProfile />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;