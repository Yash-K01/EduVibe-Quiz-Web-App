import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizResults, setQuizResults] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);

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

    setIsLoading(false);
  }, [navigate]);

  const fetchStudentResults = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const response = await api.get(`/results/student/${studentId}`);
      const results = response.data.data || [];
      setQuizResults(results);
      
      // Calculate performance data for charts
      const subjects = {};
      let totalMarks = 0;
      let totalPossible = 0;
      
      results.forEach(result => {
        if (!subjects[result.subjectName]) {
          subjects[result.subjectName] = {
            totalScore: 0,
            totalMarks: 0,
            quizzes: 0
          };
        }
        subjects[result.subjectName].totalScore += result.score;
        subjects[result.subjectName].totalMarks += result.totalMarks;
        subjects[result.subjectName].quizzes += 1;
        totalMarks += result.score;
        totalPossible += result.totalMarks;
      });
      
      const overallPercentage = totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(2) : 0;
      
      // Chart data for subject-wise performance
      const subjectChartData = {
        labels: Object.keys(subjects),
        datasets: [{
          label: 'Percentage Score',
          data: Object.values(subjects).map(s => ((s.totalScore / s.totalMarks) * 100).toFixed(2)),
          backgroundColor: '#13ec13',
          borderRadius: 8,
        }]
      };
      
      // Chart data for quiz-wise scores
      const quizChartData = {
        labels: results.map(r => r.quizName),
        datasets: [{
          label: 'Score Percentage',
          data: results.map(r => r.percentage),
          backgroundColor: '#3b82f6',
          borderRadius: 8,
        }]
      };
      
      setPerformanceData({
        overallPercentage,
        totalQuizzes: results.length,
        totalMarks,
        totalPossible,
        subjectChartData,
        quizChartData,
        subjects
      });
    } catch (error) {
      console.error('Error fetching results:', error);
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
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    {studentData?.studentName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {studentData?.studentId}
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
              STUDENT MENU
            </h3>
            
            <Link
              to="/student-dashboard"
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
              to="/student-subjects"
              className="flex items-center gap-3 px-4 py-3 mb-1 rounded-lg hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors group"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <div>
                <p className="font-medium">My Subjects</p>
                <p className="text-xs text-slate-500">View subjects</p>
              </div>
            </Link>

            <Link
              to="/my-results"
              className="flex items-center gap-3 px-4 py-3 mb-1 rounded-lg hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors group"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">assignment_turned_in</span>
              </div>
              <div>
                <p className="font-medium">My Results</p>
                <p className="text-xs text-slate-500">View scores</p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors group"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">account_circle</span>
              </div>
              <div>
                <p className="font-medium">Profile</p>
                <p className="text-xs text-slate-500">View profile</p>
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
            <Link to="/student-dashboard" className="flex items-center gap-3">
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

  const StudentInfo = () => {
    return (
      <div className="bg-white dark:bg-background-dark rounded-xl border border-green-500 p-6 mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{studentData?.studentName}</h2>
          <p className="text-slate-500 dark:text-slate-400">Class {studentData?.className} - {studentData?.division} | Roll No: {studentData?.rollNo}</p>
          <p className="text-slate-400 text-sm mt-1">{studentData?.schoolName}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{performanceData?.totalQuizzes || 0}</p>
            <p className="text-xs text-slate-500">Total Quizzes Taken</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{performanceData?.totalMarks || 0}/{performanceData?.totalPossible || 0}</p>
            <p className="text-xs text-slate-500">Total Marks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{performanceData?.overallPercentage || 0}%</p>
            <p className="text-xs text-slate-500">Overall Percentage</p>
          </div>
        </div>
      </div>
    );
  };

  const PerformanceCharts = () => {
    if (!performanceData || quizResults.length === 0) {
      return (
        <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">bar_chart</span>
          <p className="text-slate-500 dark:text-slate-400">No quiz attempts yet</p>
          <p className="text-slate-400 text-sm mt-1">Take quizzes to see your performance charts</p>
        </div>
      );
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Subject-wise Performance</h3>
          <div className="h-80">
            <Bar data={performanceData.subjectChartData} options={chartOptions} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quiz-wise Scores</h3>
          <div className="h-80">
            <Bar data={performanceData.quizChartData} options={chartOptions} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Quiz Attempts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quiz Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Submitted On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {quizResults.slice(0, 5).map((result, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{result.quizName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{result.subjectName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{result.score}/{result.totalMarks}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={result.percentage >= 40 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {result.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(result.submittedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
              Welcome back, {studentData?.studentName?.split(' ')[0]}!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Here's your learning dashboard
            </p>
          </div>

          <StudentInfo />
          
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">My Performance</h2>
            <PerformanceCharts />
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;