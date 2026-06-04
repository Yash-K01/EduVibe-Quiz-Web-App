import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';

const MyQuizzes = () => {
  const [teacherData, setTeacherData] = useState(null);
  const [classWiseSubjects, setClassWiseSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [subjectQuizzes, setSubjectQuizzes] = useState([]);
  const [showQuizzesModal, setShowQuizzesModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [studentResults, setStudentResults] = useState([]);
  const [selectedSubjectForResults, setSelectedSubjectForResults] = useState(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const user = localStorage.getItem('user');

    if (!token || userType !== 'teacher') {
      navigate('/teacher-login');
      return;
    }

    if (user) {
      const parsedUser = JSON.parse(user);
      setTeacherData(parsedUser);
      fetchTeacherSubjects(parsedUser._id);
    }
  }, [navigate]);

  const fetchTeacherSubjects = async (teacherId) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const response = await api.get(`/teachers/${teacherId}`);
      
      if (response.data.success) {
        const teacher = response.data.data;
        
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
      }
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      setApiError('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuizzesBySubject = async (className, subjectName, subjectId) => {
    setIsLoadingResults(true);
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const response = await api.get(`/quizzes/class/${className}`);
      const allQuizzes = response.data.data || [];
      const filteredQuizzes = allQuizzes.filter(q => q.subjectName === subjectName);
      
      setSubjectQuizzes(filteredQuizzes);
      setSelectedSubject({ subjectName, subjectId });
      setSelectedClass(className);
      setShowQuizzesModal(true);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setApiError('Failed to load quizzes');
    } finally {
      setIsLoadingResults(false);
    }
  };

  const fetchStudentResultsForSubject = async (className, subjectName) => {
    setIsLoadingResults(true);
    setSelectedSubjectForResults({ subjectName, className });
    
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch all quizzes for this class and subject
      const quizzesRes = await api.get(`/quizzes/class/${className}`);
      const allQuizzes = quizzesRes.data.data || [];
      const subjectQuizzesList = allQuizzes.filter(q => q.subjectName === subjectName);
      
      // Fetch all students in this class
      const studentsRes = await api.get('/students');
      const allStudents = studentsRes.data.data || [];
      const classStudents = allStudents.filter(s => s.className === className);
      
      // Fetch results for each student
      const studentsWithResults = await Promise.all(classStudents.map(async (student) => {
        const resultsRes = await api.get(`/results/student/${student._id}`);
        const studentResults = resultsRes.data.data || [];
        
        // Create a map of quiz results
        const quizScores = {};
        let totalObtained = 0;
        let totalPossible = 0;
        
        subjectQuizzesList.forEach(quiz => {
          const result = studentResults.find(r => r.quizId === quiz._id);
          if (result) {
            quizScores[quiz.title] = { obtained: result.score, total: result.totalMarks };
            totalObtained += result.score;
            totalPossible += result.totalMarks;
          } else {
            quizScores[quiz.title] = { obtained: '-', total: quiz.totalMarks };
            totalPossible += quiz.totalMarks;
          }
        });
        
        const percentage = totalPossible > 0 ? ((totalObtained / totalPossible) * 100).toFixed(2) : 0;
        
        return {
          rollNo: student.rollNo,
          studentName: student.studentName,
          studentId: student.studentId,
          quizScores,
          totalObtained,
          totalPossible,
          percentage
        };
      }));
      
      setStudentResults({
        students: studentsWithResults,
        quizzes: subjectQuizzesList,
        className,
        subjectName
      });
      setShowResultsModal(true);
    } catch (error) {
      console.error('Error fetching results:', error);
      setApiError('Failed to load results');
    } finally {
      setIsLoadingResults(false);
    }
  };

  const downloadExcel = () => {
    if (!studentResults.students || studentResults.students.length === 0) return;
    
    const excelData = studentResults.students.map(student => {
      const row = {
        'Roll No': student.rollNo,
        'Student Name': student.studentName,
        'Student ID': student.studentId,
      };
      
      // Add quiz columns
      studentResults.quizzes.forEach(quiz => {
        const score = student.quizScores[quiz.title];
        row[quiz.title] = score.obtained !== '-' ? `${score.obtained}/${score.total}` : 'Not Taken';
      });
      
      // Add total and percentage
      row['Total'] = `${student.totalObtained}/${student.totalPossible}`;
      row['Percentage'] = `${student.percentage}%`;
      
      return row;
    });
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${studentResults.subjectName}_Class_${studentResults.className}`);
    XLSX.writeFile(workbook, `${studentResults.subjectName}_Class_${studentResults.className}_Results.xlsx`);
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
          <p className="text-slate-600 dark:text-slate-400">Loading quizzes...</p>
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Quizzes</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">View and manage quizzes for your subjects</p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{apiError}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}

          {classWiseSubjects.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">quiz</span>
              <p className="text-slate-500 dark:text-slate-400 text-lg">No quizzes created yet</p>
              <p className="text-slate-400 text-sm mt-2">Create your first quiz from the Create Quiz page</p>
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
                            <p className="text-xs text-slate-500">Code: {subject.subjectCode || 'N/A'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => fetchQuizzesBySubject(classItem.className, subject.subjectName, subject.subjectId)}
                          className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          Open Quizzes
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Quizzes List Modal */}
      {showQuizzesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Quizzes - {selectedSubject?.subjectName} (Class {selectedClass})
                </h2>
                <button onClick={() => setShowQuizzesModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <span className="material-icons">close</span>
                </button>
              </div>
              
              {isLoadingResults ? (
                <div className="text-center py-8">
                  <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-slate-500 mt-2">Loading quizzes...</p>
                </div>
              ) : subjectQuizzes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No quizzes created for this subject yet</p>
                  <button
                    onClick={() => {
                      setShowQuizzesModal(false);
                      navigate('/create-quiz');
                    }}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
                  >
                    Create Quiz
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {subjectQuizzes.map((quiz, idx) => (
                    <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{quiz.title}</h3>
                        <p className="text-xs text-slate-500">Duration: {quiz.duration} mins | Questions: {quiz.totalQuestions}</p>
                        <p className="text-xs text-slate-500">Created: {new Date(quiz.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowQuizzesModal(false);
                          fetchStudentResultsForSubject(selectedClass, selectedSubject?.subjectName);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                      >
                        See Results
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end mt-6 pt-4 border-t">
                <button onClick={() => setShowQuizzesModal(false)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Results Modal */}
      {showResultsModal && studentResults && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-7xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Results - {studentResults.subjectName} (Class {studentResults.className})
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={downloadExcel}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    Download Excel
                  </button>
                  <button onClick={() => setShowResultsModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <span className="material-icons">close</span>
                  </button>
                </div>
              </div>
              
              {isLoadingResults ? (
                <div className="text-center py-8">
                  <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-slate-500 mt-2">Loading results...</p>
                </div>
              ) : studentResults.students.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No students found in this class</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium border">Roll No</th>
                        <th className="px-4 py-3 text-left text-sm font-medium border">Student Name</th>
                        {studentResults.quizzes.map((quiz, idx) => (
                          <th key={idx} className="px-4 py-3 text-left text-sm font-medium border">{quiz.title}</th>
                        ))}
                        <th className="px-4 py-3 text-left text-sm font-medium border">Total</th>
                        <th className="px-4 py-3 text-left text-sm font-medium border">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {studentResults.students.map((student, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm border">{student.rollNo}</td>
                          <td className="px-4 py-3 text-sm font-medium border">{student.studentName}</td>
                          {studentResults.quizzes.map((quiz, qIdx) => {
                            const score = student.quizScores[quiz.title];
                            return (
                              <td key={qIdx} className="px-4 py-3 text-sm border">
                                {score.obtained !== '-' ? `${score.obtained}/${score.total}` : '-'}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-sm font-medium border">{student.totalObtained}/{student.totalPossible}</td>
                          <td className="px-4 py-3 text-sm border">
                            <span className={student.percentage >= 40 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {student.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex justify-end mt-6 pt-4 border-t">
                <button onClick={() => setShowResultsModal(false)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600">
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

export default MyQuizzes;