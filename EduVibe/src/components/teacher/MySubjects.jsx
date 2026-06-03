import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';

const MySubjects = () => {
  const [teacherData, setTeacherData] = useState(null);
  const [classWiseSubjects, setClassWiseSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentPerformance, setStudentPerformance] = useState(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [quizData, setQuizData] = useState({});

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
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const response = await api.get(`/teachers/${parsedUser._id}`);
      
      if (response.data.success) {
        const teacher = response.data.data;
        setTeacherData(teacher);
        
        // Group subjects by class
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
        
        // Fetch quiz counts for each class
        for (const classItem of grouped) {
          await fetchQuizCount(classItem.className);
        }
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuizCount = async (className) => {
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const response = await api.get(`/quizzes/class/${className}`);
      const quizzes = response.data.data || [];
      
      setQuizData(prev => ({
        ...prev,
        [className]: quizzes.length
      }));
    } catch (error) {
      console.error('Error fetching quiz count:', error);
    }
  };

  const fetchStudentsWithPerformance = async (className, subjectName) => {
    setIsLoadingStudents(true);
    setSelectedClass(className);
    setSelectedSubject(subjectName);
    
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch all students
      const studentsRes = await api.get('/students');
      const allStudents = studentsRes.data.data || [];
      const filteredStudents = allStudents.filter(s => s.className === className);
      
      // Fetch quizzes for this class and subject
      const quizzesRes = await api.get(`/quizzes/class/${className}`);
      const allQuizzes = quizzesRes.data.data || [];
      const subjectQuizzes = allQuizzes.filter(q => q.subjectName === subjectName);
      
      // Fetch results for each student
      const studentsWithPerformance = await Promise.all(filteredStudents.map(async (student) => {
        const resultsRes = await api.get(`/results/student/${student._id}`);
        const studentResults = resultsRes.data.data || [];
        const subjectResults = studentResults.filter(r => r.subjectName === subjectName);
        
        const totalMarks = subjectResults.reduce((sum, r) => sum + r.score, 0);
        const totalPossible = subjectResults.reduce((sum, r) => sum + r.totalMarks, 0);
        const percentage = totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(2) : 0;
        
        // Detailed quiz marks
        const quizMarks = subjectQuizzes.map(quiz => {
          const result = subjectResults.find(r => r.quizId === quiz._id);
          return {
            quizName: quiz.title,
            obtained: result ? result.score : '-',
            total: quiz.totalMarks,
            percentage: result ? ((result.score / quiz.totalMarks) * 100).toFixed(2) : '-'
          };
        });
        
        return {
          ...student,
          totalMarks,
          totalPossible,
          percentage,
          quizMarks,
          quizzesTaken: subjectResults.length,
          quizzesMissed: subjectQuizzes.length - subjectResults.length
        };
      }));
      
      setStudentsList(studentsWithPerformance);
      setShowStudentModal(true);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const viewStudentPerformance = async (student, className, subjectName) => {
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch quizzes for this class and subject
      const quizzesRes = await api.get(`/quizzes/class/${className}`);
      const allQuizzes = quizzesRes.data.data || [];
      const subjectQuizzes = allQuizzes.filter(q => q.subjectName === subjectName);
      
      // Fetch student results
      const resultsRes = await api.get(`/results/student/${student._id}`);
      const studentResults = resultsRes.data.data || [];
      const subjectResults = studentResults.filter(r => r.subjectName === subjectName);
      
      const quizDetails = subjectQuizzes.map(quiz => {
        const result = subjectResults.find(r => r.quizId === quiz._id);
        return {
          quizName: quiz.title,
          obtained: result ? result.score : '-',
          total: quiz.totalMarks,
          percentage: result ? ((result.score / quiz.totalMarks) * 100).toFixed(2) : '-',
          submittedAt: result?.submittedAt
        };
      });
      
      const totalMarks = subjectResults.reduce((sum, r) => sum + r.score, 0);
      const totalPossible = subjectResults.reduce((sum, r) => sum + r.totalMarks, 0);
      const overallPercentage = totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(2) : 0;
      
      setStudentPerformance({
        studentName: student.studentName,
        studentId: student.studentId,
        rollNo: student.rollNo,
        className,
        subjectName,
        quizDetails,
        totalMarks,
        totalPossible,
        overallPercentage,
        quizzesTaken: subjectResults.length,
        quizzesMissed: subjectQuizzes.length - subjectResults.length,
        totalQuizzes: subjectQuizzes.length
      });
      setShowPerformanceModal(true);
    } catch (error) {
      console.error('Error fetching student performance:', error);
    }
  };

  const downloadExcel = (className, subjectName, students) => {
    // Prepare data for Excel
    const excelData = students.map(student => {
      const row = {
        'Roll No': student.rollNo,
        'Student Name': student.studentName,
        'Student ID': student.studentId,
      };
      
      // Add quiz columns
      student.quizMarks.forEach(quiz => {
        row[`${quiz.quizName} (/${quiz.total})`] = quiz.obtained !== '-' ? `${quiz.obtained}/${quiz.total}` : 'Not Taken';
      });
      
      // Add total and percentage
      row['Total Marks'] = `${student.totalMarks}/${student.totalPossible}`;
      row['Percentage'] = `${student.percentage}%`;
      
      return row;
    });
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${subjectName}_Class_${className}`);
    XLSX.writeFile(workbook, `${subjectName}_Class_${className}_Results.xlsx`);
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-600 dark:text-slate-400">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-b border-primary/10 py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors">
            <span className="material-icons text-2xl">arrow_back</span>
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined theme-toggle-light">light_mode</span>
              <span className="material-symbols-outlined theme-toggle-dark text-primary">dark_mode</span>
            </button>
            <button onClick={handleLogout} className="flex items-center justify-center rounded-lg h-10 px-5 bg-red-500 text-white text-sm font-bold shadow-sm hover:bg-red-600 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow px-4 py-12 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Subjects</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Subjects assigned to you with class-wise details</p>
          </div>

          {classWiseSubjects.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">menu_book</span>
              <p className="text-slate-500 dark:text-slate-400 text-lg">No subjects assigned yet</p>
              <p className="text-slate-400 text-sm mt-2">Contact your administrator to assign subjects</p>
            </div>
          ) : (
            <div className="space-y-6">
              {classWiseSubjects.map((classItem, idx) => (
                <div key={idx} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="bg-primary/10 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Class {classItem.className}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {classItem.subjects.map((subject, subIdx) => (
                      <div key={subIdx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">menu_book</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{subject.subjectName}</h3>
                            <p className="text-xs text-slate-500">Subject Code: {subject.subjectCode || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Total Quizzes Created:</span>
                            <span className="font-semibold text-primary">{quizData[classItem.className] || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Total Students:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">-</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => fetchStudentsWithPerformance(classItem.className, subject.subjectName)}
                            className="flex-1 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition-colors"
                          >
                            View Students
                          </button>
                          <button
                            onClick={() => downloadExcel(classItem.className, subject.subjectName, [])}
                            className="px-3 py-2 bg-green-500/10 text-green-600 rounded-lg text-sm font-medium hover:bg-green-500 hover:text-white transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">download</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Students List Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-6xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Students - Class {selectedClass} ({selectedSubject})
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadExcel(selectedClass, selectedSubject, studentsList)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    Download Excel
                  </button>
                  <button onClick={() => setShowStudentModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <span className="material-icons">close</span>
                  </button>
                </div>
              </div>
              
              {isLoadingStudents ? (
                <div className="text-center py-8">
                  <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-slate-500 mt-2">Loading students...</p>
                </div>
              ) : studentsList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No students found in this class</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Roll No</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Student Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Student ID</th>
                        {studentsList[0]?.quizMarks.map((quiz, idx) => (
                          <th key={idx} className="px-4 py-3 text-left text-sm font-medium">{quiz.quizName}</th>
                        ))}
                        <th className="px-4 py-3 text-left text-sm font-medium">Total</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Percentage</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {studentsList.map((student, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm">{student.rollNo}</td>
                          <td className="px-4 py-3 text-sm font-medium">{student.studentName}</td>
                          <td className="px-4 py-3 text-sm font-mono">{student.studentId}</td>
                          {student.quizMarks.map((quiz, qIdx) => (
                            <td key={qIdx} className="px-4 py-3 text-sm">
                              {quiz.obtained !== '-' ? `${quiz.obtained}/${quiz.total}` : '-'}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-sm font-medium">{student.totalMarks}/{student.totalPossible}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={student.percentage >= 40 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {student.percentage}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => viewStudentPerformance(student, selectedClass, selectedSubject)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="View Performance"
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
                <button onClick={() => setShowStudentModal(false)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Performance Modal */}
      {showPerformanceModal && studentPerformance && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Performance - {studentPerformance.studentName}
                </h2>
                <button onClick={() => setShowPerformanceModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <span className="material-icons">close</span>
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-500">Student ID</p>
                  <p className="font-semibold">{studentPerformance.studentId}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-500">Roll No</p>
                  <p className="font-semibold">{studentPerformance.rollNo}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-500">Class</p>
                  <p className="font-semibold">{studentPerformance.className}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-500">Subject</p>
                  <p className="font-semibold">{studentPerformance.subjectName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{studentPerformance.totalQuizzes}</p>
                  <p className="text-sm text-slate-600">Total Quizzes</p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{studentPerformance.quizzesTaken}</p>
                  <p className="text-sm text-slate-600">Quizzes Taken</p>
                </div>
                <div className="bg-red-100 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{studentPerformance.quizzesMissed}</p>
                  <p className="text-sm text-slate-600">Quizzes Missed</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Quiz-wise Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">Quiz Name</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Score</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Percentage</th>
                        <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {studentPerformance.quizDetails.map((quiz, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm">{quiz.quizName}</td>
                          <td className="px-4 py-2 text-sm">{quiz.obtained !== '-' ? `${quiz.obtained}/${quiz.total}` : '-'}</td>
                          <td className="px-4 py-2 text-sm">
                            {quiz.percentage !== '-' ? (
                              <span className={quiz.percentage >= 40 ? 'text-green-600' : 'text-red-600'}>
                                {quiz.percentage}%
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {quiz.obtained !== '-' ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Completed</span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                <span className="font-semibold">Overall Performance:</span>
                <div>
                  <span className="text-lg font-bold text-primary">{studentPerformance.totalMarks}/{studentPerformance.totalPossible}</span>
                  <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${studentPerformance.overallPercentage >= 40 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {studentPerformance.overallPercentage}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 pt-4 border-t">
                <button onClick={() => setShowPerformanceModal(false)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600">
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

export default MySubjects;