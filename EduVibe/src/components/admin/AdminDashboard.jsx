import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    activeStudents: 0,
    activeTeachers: 0
  });
  const [classWiseData, setClassWiseData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || userType !== 'admin') {
      navigate('/admin-login');
      return;
    }
    
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const studentsRes = await api.get('/students');
      const teachersRes = await api.get('/teachers');

      const students = studentsRes.data.data || [];
      const teachers = teachersRes.data.data || [];

      const activeStudents = students.filter(s => s.isActive).length;
      const activeTeachers = teachers.filter(t => t.isActive).length;

      setStats({
        students: students.length,
        teachers: teachers.length,
        activeStudents: activeStudents,
        activeTeachers: activeTeachers
      });

      // Calculate class wise student count
      const classCount = {};
      [6,7,8,9,10,11,12].forEach(cls => { classCount[cls] = 0; });
      students.forEach(student => {
        if (classCount[student.className] !== undefined) {
          classCount[student.className]++;
        }
      });
      setClassWiseData(classCount);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('schoolName');
    navigate('/');
  };

  // Chart Data
  const studentChartData = {
    labels: ['Total Students', 'Active Students', 'Inactive Students'],
    datasets: [{
      data: [stats.students, stats.activeStudents, stats.students - stats.activeStudents],
      backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
      borderWidth: 0,
    }]
  };

  const teacherChartData = {
    labels: ['Total Teachers', 'Active Teachers', 'Inactive Teachers'],
    datasets: [{
      data: [stats.teachers, stats.activeTeachers, stats.teachers - stats.activeTeachers],
      backgroundColor: ['#8b5cf6', '#10b981', '#ef4444'],
      borderWidth: 0,
    }]
  };

  const classWiseChartData = {
    labels: ['6th', '7th', '8th', '9th', '10th', '11th', '12th'],
    datasets: [{
      label: 'Number of Students',
      data: [
        classWiseData[6] || 0,
        classWiseData[7] || 0,
        classWiseData[8] || 0,
        classWiseData[9] || 0,
        classWiseData[10] || 0,
        classWiseData[11] || 0,
        classWiseData[12] || 0
      ],
      backgroundColor: '#13ec13',
      borderRadius: 8,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  const LeftSidebar = () => {
    return (
      <aside className={`fixed left-0 top-[73px] h-[calc(100vh-73px)] bg-white dark:bg-background-dark border-r border-slate-200 dark:border-slate-800 z-40 overflow-y-auto transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className={`text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${!sidebarOpen && 'hidden'}`}>
              ADMIN MENU
            </h3>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-xl">{sidebarOpen ? 'menu_open' : 'menu'}</span>
            </button>
          </div>
          
          <Link to="/admin-dashboard" className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-lg bg-primary/10 text-primary transition-colors group ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">dashboard</span>
            </div>
            {sidebarOpen && <div><p className="font-medium">Dashboard</p><p className="text-xs text-slate-500">Overview & Analytics</p></div>}
          </Link>

          <Link to="/create-student" className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-lg hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors group ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-colors">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            {sidebarOpen && <div><p className="font-medium">Create Student</p><p className="text-xs text-slate-500">Add new student login</p></div>}
          </Link>

          <Link to="/create-teacher" className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-lg hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors group ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-colors">
              <span className="material-symbols-outlined">school</span>
            </div>
            {sidebarOpen && <div><p className="font-medium">Create Teacher</p><p className="text-xs text-slate-500">Add new teacher login</p></div>}
          </Link>

          <Link to="/add-subject" className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors group ${!sidebarOpen ? 'justify-center' : ''}`}>
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-colors">
              <span className="material-symbols-outlined">book</span>
            </div>
            {sidebarOpen && <div><p className="font-medium">Add Subject</p><p className="text-xs text-slate-500">Create new subject</p></div>}
          </Link>
        </div>
      </aside>
    );
  };

  const Header = () => {
    const schoolName = localStorage.getItem('schoolName') || 'School';
    return (
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-10 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin-dashboard" className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-slate-900">
                <span className="material-symbols-outlined text-2xl">auto_stories</span>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">EduVibe</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{schoolName}</p>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined theme-toggle-light">light_mode</span>
              <span className="material-symbols-outlined theme-toggle-dark text-primary">dark_mode</span>
            </button>
            <button onClick={handleLogout} className="flex items-center justify-center rounded-lg h-10 px-5 bg-red-500 text-white text-sm font-bold shadow-sm hover:bg-red-600 transition-colors">Logout</button>
          </div>
        </div>
      </header>
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

  const schoolName = localStorage.getItem('schoolName') || 'Admin';

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-slate-50 dark:bg-slate-900/50">
      <Header />
      <LeftSidebar />
      
      <main className={`flex-1 pt-20 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, {schoolName}!</p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Students</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.students}</p>
                </div>
                <div className="size-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-2xl">group</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active Students</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeStudents}</p>
                </div>
                <div className="size-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Teachers</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.teachers}</p>
                </div>
                <div className="size-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-600 text-2xl">school</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active Teachers</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeTeachers}</p>
                </div>
                <div className="size-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 text-2xl">verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Student Chart */}
            <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Student Overview</h3>
              <div className="h-80">
                <Pie data={studentChartData} options={chartOptions} />
              </div>
            </div>

            {/* Teacher Chart */}
            <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Teacher Overview</h3>
              <div className="h-80">
                <Pie data={teacherChartData} options={chartOptions} />
              </div>
            </div>

            {/* Class Wise Student Distribution */}
            <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Class Wise Student Distribution</h3>
              <div className="h-96">
                <Bar data={classWiseChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;