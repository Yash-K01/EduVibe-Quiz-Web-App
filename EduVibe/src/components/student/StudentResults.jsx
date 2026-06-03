import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const StudentResults = () => {
  const [studentData, setStudentData] = useState(null);
  const [allResults, setAllResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizDetails, setQuizDetails] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

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
      fetchStudentResults(parsedUser._id);
    }
  }, [navigate]);

  const fetchStudentResults = async (studentId) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const response = await api.get(`/results/student/${studentId}`);
      const results = response.data.data || [];
      
      // Sort by submittedAt (latest first)
      const sortedResults = results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setAllResults(sortedResults);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuizDetails = async (quizId, result) => {
    setIsLoadingDetails(true);
    setSelectedQuiz(result);
    
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch quiz questions
      const quizRes = await api.get(`/quizzes/${quizId}`);
      const quiz = quizRes.data.data;
      
      // Fetch student's answers from result
      const answers = result.answers || [];
      
      setQuizDetails(quiz);
      setStudentAnswers(answers);
      setShowQuizModal(true);
    } catch (error) {
      console.error('Error fetching quiz details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 128, 0);
    doc.text('EduVibe - Student Performance Report', 14, 20);
    
    // Student Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Student Name: ${studentData?.studentName}`, 14, 40);
    doc.text(`Student ID: ${studentData?.studentId}`, 14, 50);
    doc.text(`Class: ${studentData?.className} - ${studentData?.division}`, 14, 60);
    doc.text(`Roll No: ${studentData?.rollNo}`, 14, 70);
    doc.text(`School: ${studentData?.schoolName}`, 14, 80);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 90);
    
    // Results Table
    const tableData = allResults.map((result, index) => [
      index + 1,
      result.quizName,
      result.subjectName,
      `${result.score}/${result.totalMarks}`,
      `${result.percentage}%`,
      new Date(result.submittedAt).toLocaleDateString()
    ]);
    
    doc.autoTable({
      startY: 100,
      head: [['#', 'Quiz Name', 'Subject', 'Score', 'Percentage', 'Date']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [19, 236, 19], textColor: [0, 0, 0] },
      styles: { fontSize: 10 },
    });
    
    // Summary
    const totalMarks = allResults.reduce((sum, r) => sum + r.score, 0);
    const totalPossible = allResults.reduce((sum, r) => sum + r.totalMarks, 0);
    const overallPercentage = totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(2) : 0;
    const totalQuizzes = allResults.length;
    const completedQuizzes = allResults.filter(r => r.score > 0).length;
    
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Summary', 14, finalY);
    doc.setFontSize(10);
    doc.text(`Total Quizzes Taken: ${totalQuizzes}`, 14, finalY + 10);
    doc.text(`Total Marks Obtained: ${totalMarks}/${totalPossible}`, 14, finalY + 20);
    doc.text(`Overall Percentage: ${overallPercentage}%`, 14, finalY + 30);
    
    // Save PDF
    doc.save(`${studentData?.studentName}_Results.pdf`);
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
          <p className="text-slate-600 dark:text-slate-400">Loading results...</p>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20 text-primary">
                  <span className="material-symbols-outlined text-3xl">school</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{studentData?.studentName}</h1>
                  <p className="text-slate-500 dark:text-slate-400">
                    Class {studentData?.className} - {studentData?.division} | Roll No: {studentData?.rollNo}
                  </p>
                  <p className="text-slate-400 text-sm">{studentData?.schoolName}</p>
                </div>
              </div>
              {allResults.length > 0 && (
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Download PDF Report
                </button>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">My Quiz Results</h2>
            <p className="text-zinc-500 dark:text-zinc-400">View all your quiz attempts and performance</p>
          </div>

          {allResults.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">assignment_turned_in</span>
              <p className="text-slate-500 dark:text-slate-400 text-lg">No quiz attempts yet</p>
              <p className="text-slate-400 text-sm mt-2">Take quizzes to see your results here</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 uppercase">#</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 uppercase">Quiz Name</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 uppercase">Subject</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 uppercase">Score</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 uppercase">Percentage</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 uppercase">Submitted On</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {allResults.map((result, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{result.quizName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{result.subjectName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{result.score}/{result.totalMarks}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={result.percentage >= 40 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {result.percentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(result.submittedAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => fetchQuizDetails(result.quizId, result)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          {allResults.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center">
                <p className="text-2xl font-bold text-primary">{allResults.length}</p>
                <p className="text-xs text-slate-500">Total Quizzes Taken</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {allResults.reduce((sum, r) => sum + r.score, 0)}/{allResults.reduce((sum, r) => sum + r.totalMarks, 0)}
                </p>
                <p className="text-xs text-slate-500">Total Marks</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {((allResults.reduce((sum, r) => sum + r.score, 0) / allResults.reduce((sum, r) => sum + r.totalMarks, 0)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500">Overall Percentage</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {allResults.filter(r => r.percentage >= 40).length}
                </p>
                <p className="text-xs text-slate-500">Quizzes Passed</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Quiz Details Modal */}
      {showQuizModal && quizDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {quizDetails.title} - Review
                </h2>
                <button onClick={() => setShowQuizModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <span className="material-icons">close</span>
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-primary/5 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Subject</p>
                    <p className="font-medium">{quizDetails.subjectName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Score</p>
                    <p className="font-medium">{selectedQuiz?.score}/{selectedQuiz?.totalMarks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Percentage</p>
                    <p className={`font-medium ${selectedQuiz?.percentage >= 40 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedQuiz?.percentage}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Submitted</p>
                    <p className="font-medium">{new Date(selectedQuiz?.submittedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              {isLoadingDetails ? (
                <div className="text-center py-8">
                  <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-slate-500 mt-2">Loading questions...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizDetails.questions?.map((question, qIdx) => {
                    const studentAnswer = studentAnswers.find(a => a.questionId === qIdx);
                    const isCorrect = studentAnswer?.isCorrect || false;
                    const selectedOption = studentAnswer?.selectedOption;
                    const correctOption = question.correctOption;
                    
                    return (
                      <div key={qIdx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                            {qIdx + 1}
                          </div>
                          <p className="font-medium text-slate-900 dark:text-white flex-1">{question.text}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isCorrect ? `+${question.marks}` : `0/${question.marks}`}
                          </span>
                        </div>
                        
                        <div className="ml-9 space-y-2">
                          {question.options.map((option, optIdx) => {
                            const isSelected = selectedOption === optIdx;
                            const isCorrectOption = correctOption === optIdx;
                            
                            let bgColor = '';
                            if (isCorrectOption) {
                              bgColor = 'bg-green-100 dark:bg-green-900/20 border-green-500';
                            } else if (isSelected && !isCorrect) {
                              bgColor = 'bg-red-100 dark:bg-red-900/20 border-red-500';
                            } else {
                              bgColor = 'bg-slate-50 dark:bg-slate-800';
                            }
                            
                            return (
                              <div key={optIdx} className={`p-2 rounded-lg border ${bgColor}`}>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium w-6">{String.fromCharCode(65 + optIdx)}.</span>
                                  <span className="text-sm">{option}</span>
                                  {isCorrectOption && (
                                    <span className="ml-auto text-green-600 text-xs">✓ Correct Answer</span>
                                  )}
                                  {isSelected && !isCorrect && (
                                    <span className="ml-auto text-red-600 text-xs">✗ Your Answer</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="flex justify-end mt-6 pt-4 border-t">
                <button onClick={() => setShowQuizModal(false)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600">
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

export default StudentResults;