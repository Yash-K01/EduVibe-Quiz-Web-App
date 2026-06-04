import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TeacherDashboard = () => {
  const [teacherData, setTeacherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalQuizzesCreated: 0,
    totalQuizzesPublished: 0
  });
  const [classWiseSubjects, setClassWiseSubjects] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [showClassStudentsModal, setShowClassStudentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);
  const [studentQuizDetails, setStudentQuizDetails] = useState(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingQuizDetails, setIsLoadingQuizDetails] = useState(false);
  const [apiError, setApiError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');

    if (!token || userType !== 'teacher') {
      navigate('/teacher-login');
      return;
    }

    fetchTeacherData();
  }, [navigate]);

  const fetchTeacherData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const parsedUser = JSON.parse(user);
      
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const response = await api.get(`/teachers/${parsedUser._id}`);
      
      if (response.data.success) {
        const teacher = response.data.data;
        setTeacherData(teacher);
        localStorage.setItem('user', JSON.stringify(teacher));
        
        const totalSubjects = teacher.subjects?.length || 0;
        
        setStats({
          totalSubjects: totalSubjects,
          totalQuizzesCreated: 0,
          totalQuizzesPublished: 0
        });
        
        const subjectsByClass = {};
        teacher.subjects?.forEach(subject => {
          const className = subject.className;
          if (!subjectsByClass[className]) {
            subjectsByClass[className] = [];
          }
          subjectsByClass[className].push(subject);
        });
        
        const grouped = Object.keys(subjectsByClass).map(className => ({
          className: parseInt(className),
          subjects: subjectsByClass[className]
        }));
        
        setClassWiseSubjects(grouped);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setApiError('Failed to load teacher data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassStudents = async (className) => {
    setIsLoadingStudents(true);
    setApiError('');
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch all students and filter by class
      const response = await api.get('/students');
      const allStudents = response.data.data || [];
      const filteredStudents = allStudents.filter(s => s.className === parseInt(className));
      
      setClassStudents(filteredStudents);
      setSelectedClass(className);
      setShowClassStudentsModal(true);
      
      if (filteredStudents.length === 0) {
        setApiError('No students found in this class');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setApiError('Failed to load students');
      setClassStudents([]);
      setSelectedClass(className);
      setShowClassStudentsModal(true);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchStudentQuizDetails = async (studentId, studentName, className) => {
    setIsLoadingQuizDetails(true);
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch all quizzes for this class
      let allQuizzes = [];
      try {
        const quizzesRes = await api.get(`/quizzes/class/${className}`);
        allQuizzes = quizzesRes.data.data || [];
      } catch (error) {
        console.log('No quizzes found for this class');
      }
      
      // Fetch student's results
      let studentResults = [];
      try {
        const resultsRes = await api.get(`/results/student/${studentId}`);
        studentResults = resultsRes.data.data || [];
      } catch (error) {
        console.log('No results found for this student');
      }
      
      // Calculate quiz statistics
      const quizzesTaken = studentResults.length;
      const quizzesMissed = allQuizzes.length - quizzesTaken;
      const totalQuizzes = allQuizzes.length;
      
      // Get subject-wise performance
      const subjectWisePerformance = {};
      studentResults.forEach(result => {
        const subjectNameResult = result.subjectName;
        if (!subjectWisePerformance[subjectNameResult]) {
          subjectWisePerformance[subjectNameResult] = {
            total: 0,
            taken: 0,
            scores: []
          };
        }
        subjectWisePerformance[subjectNameResult].total++;
        subjectWisePerformance[subjectNameResult].taken++;
        subjectWisePerformance[subjectNameResult].scores.push({
          quizName: result.quizName,
          score: result.score,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          submittedAt: result.submittedAt
        });
      });
      
      setStudentQuizDetails({
        studentId,
        studentName,
        className,
        totalQuizzes,
        quizzesTaken,
        quizzesMissed,
        quizzesTakenList: studentResults,
        subjectWisePerformance
      });
      setSelectedStudent({ studentId, studentName });
      setShowStudentDetailModal(true);
    } catch (error) {
      console.error('Error fetching student quiz details:', error);
      setApiError('Failed to load student quiz details');
      
      // Set dummy data for testing if no data exists
      setStudentQuizDetails({
        studentId,
        studentName,
        className,
        totalQuizzes: 0,
        quizzesTaken: 0,
        quizzesMissed: 0,
        quizzesTakenList: [],
        subjectWisePerformance: {}
      });
      setSelectedStudent({ studentId, studentName });
      setShowStudentDetailModal(true);
    } finally {
      setIsLoadingQuizDetails(false);
    }
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    navigate('/');
  };

  const LeftSidebar = () => {
    return (
      <>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed left-4 top-24 z-40 bg-primary text-slate-900 p-2 rounded-lg shadow-lg"
        >
          <span className="material-symbols-outlined">
            {sidebarOpen ? 'close' : 'menu'}
          </span>
        </button>

        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside className={`
          fixed left-0 top-[73px] h-[calc(100vh-73px)] bg-white dark:bg-background-dark border-r border-slate-200 dark:border-slate-800 
          transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto w-64
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4">
            <div className="mb-6 p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">school</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    {teacherData?.teacherName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {teacherData?.teacherId}
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
              TEACHER MENU
            </h3>
            
            <Link
              to="/teacher-dashboard"
              className="flex items-center gap-3 px-4 py-3 mb-1 rounded-lg bg-primary/10 text-primary transition-colors group"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">dashboard</span>
              </div>
              <div>
                <p className="font-medium">Dashboard</p>
                <p className="text-xs text-slate-500">Overview</p>
              </div>
            </Link>

            <Link
              to="/my-subjects"
              className="flex items-center gap-3 px-4 py-3 mb-1 rounded-lg hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors group"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <div>
                <p className="font-medium">My Subjects</p>
                <p className="text-xs text-slate-500">Subjects I teach</p>
              </div>
            </Link>

            <Link
              to="/create-quiz"
              className="flex items-center gap-3 px-4 py-3 mb-1 rounded-lg hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors group"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                <span className="material-symbols-outlined">quiz</span>
              </div>
              <div>
                <p className="font-medium">Create Quiz</p>
                <p className="text-xs text-slate-500">Create new quiz</p>
              </div>
            </Link>

            <Link
              to="/teacher-quizzes"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors group"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                <span className="material-symbols-outlined">assignment</span>
              </div>
              <div>
                <p className="font-medium">My Quizzes</p>
                <p className="text-xs text-slate-500">View created quizzes</p>
              </div>
            </Link>
          </div>
        </aside>
      </>
    );
  };

  const Header = () => {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-10 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/teacher-dashboard" className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-slate-900">
                <span className="material-symbols-outlined text-2xl">school</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">EduVibe</h2>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              aria-label="Toggle theme" 
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
              onClick={toggleTheme}
            >
              <span className="material-symbols-outlined theme-toggle-light">light_mode</span>
              <span className="material-symbols-outlined theme-toggle-dark text-primary">dark_mode</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center justify-center rounded-lg h-10 px-5 bg-red-500 text-white text-sm font-bold shadow-sm hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
    );
  };

  const DashboardStats = () => {
    const statsData = [
      { title: 'Total Subjects Assigned', value: stats.totalSubjects, icon: 'menu_book', color: 'blue' },
      { title: 'Total Quiz Created', value: stats.totalQuizzesCreated, icon: 'quiz', color: 'green' },
      { title: 'Total Quiz Published', value: stats.totalQuizzesPublished, icon: 'publish', color: 'purple' },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {statsData.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`size-12 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400 flex items-center justify-center`}>
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
            </div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</h3>
          </div>
        ))}
      </div>
    );
  };

  const MyClasses = () => {
    if (!teacherData?.isClassTeacher) return null;

    const assignedClass = teacherData.assignedClass;
    
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">My Classes</h2>
        <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">class</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Class {assignedClass}</h3>
              <p className="text-sm text-slate-500">You are the class teacher for this class</p>
            </div>
            <button
              onClick={() => fetchClassStudents(assignedClass)}
              className="ml-auto px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              View Students
            </button>
          </div>
        </div>
      </div>
    );
  };

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showSubjectStudentModal, setShowSubjectStudentModal] = useState(false);
  const [subjectStudents, setSubjectStudents] = useState([]);

  const handleViewDetails = async (className, subjectName) => {
    setSelectedSubject({ className, subjectName });
    setShowSubjectStudentModal(true);
    setIsLoadingStudents(true);
    
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch all students and filter by class
      const response = await api.get('/students');
      const allStudents = response.data.data || [];
      const filteredStudents = allStudents.filter(s => s.className === parseInt(className));
      setSubjectStudents(filteredStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      setSubjectStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const AssignedSubjects = () => {
    if (classWiseSubjects.length === 0) {
      return (
        <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">menu_book</span>
          <p className="text-slate-500 dark:text-slate-400">No subjects assigned yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {classWiseSubjects.map((classItem, idx) => (
          <div key={idx} className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-primary/5 px-6 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Class {classItem.className}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {classItem.subjects.map((subject, subIdx) => (
                <div key={subIdx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-primary/50 transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined">menu_book</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{subject.subjectName}</h4>
                  </div>
                  <button
                    onClick={() => handleViewDetails(classItem.className, subject.subjectName)}
                    className="mt-2 text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View Details
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-900/50">
      <Header />
      <LeftSidebar />
      
      <main className={`flex-1 pt-20 transition-all duration-300 lg:ml-64`}>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Welcome back, {teacherData?.teacherName?.split(' ')[0]}!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Here's your teaching dashboard overview
            </p>
          </div>

          <DashboardStats />
          <MyClasses />
          
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">My Assigned Subjects</h2>
            <AssignedSubjects />
          </div>
        </div>
      </main>

      {/* Class Students Modal */}
      {showClassStudentsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Students - Class {selectedClass}
                </h2>
                <button onClick={() => setShowClassStudentsModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <span className="material-icons">close</span>
                </button>
              </div>
              
              {apiError && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                  {apiError}
                </div>
              )}
              
              {isLoadingStudents ? (
                <div className="text-center py-8">
                  <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-slate-500 mt-2">Loading students...</p>
                </div>
              ) : classStudents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No students found in this class</p>
                  <p className="text-sm text-slate-400 mt-2">Please add students to this class first</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Roll No</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Student Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Student ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {classStudents.map((student, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm">{student.rollNo}</td>
                          <td className="px-4 py-3 text-sm font-medium">{student.studentName}</td>
                          <td className="px-4 py-3 text-sm font-mono">{student.studentId}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => fetchStudentQuizDetails(student._id, student.studentName, selectedClass)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="View Quiz Details"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex justify-end mt-6 pt-4 border-t">
                <button onClick={() => setShowClassStudentsModal(false)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Quiz Details Modal */}
      {showStudentDetailModal && studentQuizDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Quiz Details - {selectedStudent?.studentName}
                </h2>
                <button onClick={() => setShowStudentDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <span className="material-icons">close</span>
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{studentQuizDetails.totalQuizzes}</p>
                  <p className="text-sm text-slate-600">Total Quizzes</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{studentQuizDetails.quizzesTaken}</p>
                  <p className="text-sm text-slate-600">Quizzes Taken</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{studentQuizDetails.quizzesMissed}</p>
                  <p className="text-sm text-slate-600">Quizzes Missed</p>
                </div>
              </div>

              {/* Subject-wise Performance */}
              {Object.keys(studentQuizDetails.subjectWisePerformance).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Subject-wise Performance</h3>
                  <div className="space-y-3">
                    {Object.keys(studentQuizDetails.subjectWisePerformance).map((subject, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900 dark:text-white">{subject}</h4>
                          <span className="text-sm text-primary">
                            {studentQuizDetails.subjectWisePerformance[subject].taken} / {studentQuizDetails.subjectWisePerformance[subject].total} quizzes taken
                          </span>
                        </div>
                        <div className="space-y-2">
                          {studentQuizDetails.subjectWisePerformance[subject].scores.map((quiz, qIdx) => (
                            <div key={qIdx} className="flex justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded">
                              <span>{quiz.quizName}</span>
                              <span className={quiz.percentage >= 40 ? 'text-green-600' : 'text-red-600'}>
                                {quiz.score}/{quiz.totalMarks} ({quiz.percentage}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Quiz Attempts */}
              {studentQuizDetails.quizzesTakenList.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">All Quiz Attempts</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">Quiz Name</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Subject</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Score</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Percentage</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Submitted On</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {studentQuizDetails.quizzesTakenList.map((quiz, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-sm">{quiz.quizName}</td>
                            <td className="px-4 py-2 text-sm">{quiz.subjectName}</td>
                            <td className="px-4 py-2 text-sm">{quiz.score}/{quiz.totalMarks}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={quiz.percentage >= 40 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                {quiz.percentage}%
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">{quiz.submittedAt ? new Date(quiz.submittedAt).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {studentQuizDetails.quizzesTakenList.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-500">No quiz attempts found for this student</p>
                </div>
              )}
              
              <div className="flex justify-end mt-6 pt-4 border-t">
                <button onClick={() => setShowStudentDetailModal(false)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subject Students Modal */}
      {showSubjectStudentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Students - Class {selectedSubject?.className} ({selectedSubject?.subjectName})
                </h2>
                <button onClick={() => setShowSubjectStudentModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <span className="material-icons">close</span>
                </button>
              </div>
              
              {isLoadingStudents ? (
                <div className="text-center py-8">
                  <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-slate-500 mt-2">Loading students...</p>
                </div>
              ) : subjectStudents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No students found in this class</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Roll No</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Student Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Student ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {subjectStudents.map((student, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm">{student.rollNo}</td>
                          <td className="px-4 py-3 text-sm font-medium">{student.studentName}</td>
                          <td className="px-4 py-3 text-sm font-mono">{student.studentId}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => fetchStudentQuizDetails(student._id, student.studentName, selectedSubject?.className)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="View Quiz Details"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex justify-end mt-6 pt-4 border-t">
                <button onClick={() => setShowSubjectStudentModal(false)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;