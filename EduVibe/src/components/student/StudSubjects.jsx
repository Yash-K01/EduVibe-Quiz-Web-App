import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudSubject = () => {
  const [studentData, setStudentData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectQuizzes, setSubjectQuizzes] = useState([]);
  const [showQuizzesModal, setShowQuizzesModal] = useState(false);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const user = localStorage.getItem('user');

    if (!token || userType !== 'student') {
      navigate('/student-login');
      return;
    }

    if (user) {
      const parsedUser = JSON.parse(user);
      setStudentData(parsedUser);
      fetchStudentSubjects(parsedUser._id, parsedUser.className);
    }
  }, [navigate]);

  const fetchStudentSubjects = async (studentId, className) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const response = await api.get(`/subjects/school/${className}`);
      const schoolSubjects = response.data.data || [];
      
      let studentSubjects = schoolSubjects;
      if (studentData?.subjects && studentData.subjects.length > 0) {
        const studentSubjectIds = studentData.subjects.map(s => s.subjectId);
        studentSubjects = schoolSubjects.filter(s => studentSubjectIds.includes(s.subjectId?._id || s.subjectId));
      }
      
      setSubjects(studentSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjectQuizzes = async (subjectName, subjectId) => {
    setIsLoadingQuizzes(true);
    setSelectedSubject({ subjectName, subjectId });
    
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const response = await api.get(`/quizzes/class/${studentData?.className}`);
      const allQuizzes = response.data.data || [];
      
      const filteredQuizzes = allQuizzes.filter(q => q.subjectName === subjectName);
      
      const resultsRes = await api.get(`/results/student/${studentData?._id}`);
      const studentResults = resultsRes.data.data || [];
      
      const quizzesWithMarks = filteredQuizzes.map(quiz => {
        const result = studentResults.find(r => r.quizId === quiz._id);
        return {
          ...quiz,
          obtainedMarks: result ? result.score : null,
          totalMarks: quiz.totalMarks,
          percentage: result ? result.percentage : null,
          submittedAt: result ? result.submittedAt : null,
          status: result ? 'Completed' : 'Pending'
        };
      });
      
      setSubjectQuizzes(quizzesWithMarks);
      setShowQuizzesModal(true);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setIsLoadingQuizzes(false);
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
          {/* Student Info Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20 text-primary">
                <span className="material-symbols-outlined text-3xl">person</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{studentData?.studentName}</h1>
                <p className="text-slate-500 dark:text-slate-400">
                  Class {studentData?.className} - {studentData?.division} | Roll No: {studentData?.rollNo}
                </p>
                <p className="text-slate-400 text-sm">{studentData?.schoolName}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">My Subjects</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">Click on any subject to view your quiz performance</p>
          </div>

          {subjects.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">menu_book</span>
              <p className="text-slate-500 dark:text-slate-400 text-lg">No subjects assigned yet</p>
              <p className="text-slate-400 text-sm mt-2">Contact your school administrator to assign subjects</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject, index) => (
                <div key={index} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:border-primary/50 hover:shadow-lg transition-all group">
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
                    onClick={() => fetchSubjectQuizzes(subject.subjectName, subject.subjectId?._id || subject.subjectId)}
                    className="w-full px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition-colors"
                  >
                    View Quizzes & Marks
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Quizzes Modal */}
      {showQuizzesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedSubject?.subjectName} - Quiz Performance
                </h2>
                <button onClick={() => setShowQuizzesModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <span className="material-icons">close</span>
                </button>
              </div>
              
              {isLoadingQuizzes ? (
                <div className="text-center py-8">
                  <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-slate-500 mt-2">Loading quizzes...</p>
                </div>
              ) : subjectQuizzes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No quizzes found for this subject</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Quiz Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Duration</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Score</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Percentage</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Submitted On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {subjectQuizzes.map((quiz, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{quiz.title}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{quiz.duration} mins</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {quiz.obtainedMarks !== null ? `${quiz.obtainedMarks}/${quiz.totalMarks}` : '-'}
                           </td>
                          <td className="px-4 py-3 text-sm">
                            {quiz.percentage !== null ? (
                              <span className={quiz.percentage >= 40 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                {quiz.percentage}%
                              </span>
                            ) : '-'}
                           </td>
                          <td className="px-4 py-3 text-sm">
                            {quiz.status === 'Completed' ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Completed</span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Pending</span>
                            )}
                           </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {quiz.submittedAt ? new Date(quiz.submittedAt).toLocaleDateString() : '-'}
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Summary Stats */}
              {subjectQuizzes.length > 0 && (
                <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Total Quizzes</p>
                      <p className="text-lg font-bold text-primary">{subjectQuizzes.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Quizzes Completed</p>
                      <p className="text-lg font-bold text-green-600">{subjectQuizzes.filter(q => q.status === 'Completed').length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Quizzes Pending</p>
                      <p className="text-lg font-bold text-yellow-600">{subjectQuizzes.filter(q => q.status === 'Pending').length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Average Score</p>
                      <p className="text-lg font-bold text-blue-600">
                        {(() => {
                          const completedQuizzes = subjectQuizzes.filter(q => q.percentage !== null);
                          if (completedQuizzes.length === 0) return '0%';
                          const avg = completedQuizzes.reduce((sum, q) => sum + q.percentage, 0) / completedQuizzes.length;
                          return `${avg.toFixed(1)}%`;
                        })()}
                      </p>
                    </div>
                  </div>
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
    </div>
  );
};

export default StudSubject;