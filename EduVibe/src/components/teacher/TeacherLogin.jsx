import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Success Popup Function
const showSuccessPopup = (message, navigate) => {
  // Add animation style if not exists
  if (!document.getElementById('popup-style')) {
    const style = document.createElement('style');
    style.id = 'popup-style';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .animate-slide-in {
        animation: slideIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
  }

  const popup = document.createElement('div');
  popup.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in';
  popup.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="material-icons">check_circle</span>
      <div>
        <p class="font-semibold">${message}</p>
        <p class="text-sm opacity-90">Welcome to EduVibe</p>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  
  // Remove popup after 3 seconds and navigate
  setTimeout(() => {
    popup.remove();
    navigate('/teacher-dashboard');
  }, 3000);
};

const TeacherLogin = () => {
  const [formData, setFormData] = useState({
    teacherId: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.teacherId.trim()) {
      newErrors.teacherId = 'Teacher ID is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📤 Sending teacher login data:', {
        teacherId: formData.teacherId,
        password: '***hidden***',
        rememberMe: formData.rememberMe
      });

      // Send only teacherId and password
      const response = await api.post('/auth/teacher-login', {
        teacherId: formData.teacherId,
        password: formData.password,
        rememberMe: formData.rememberMe
      });

      console.log('📥 Teacher login response:', response.data);

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        localStorage.setItem('userType', 'teacher');
        
        showSuccessPopup('Teacher Login Successful!', navigate);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
      
    } catch (error) {
      console.error('❌ Teacher login error:', error);
      
      if (error.code === 'ECONNABORTED') {
        setApiError('Request timeout. Please try again.');
      } else if (error.response) {
        console.log('Server error response:', error.response.data);
        
        if (error.response.status === 401) {
          setApiError('Invalid Teacher ID or password');
        } else {
          setApiError(error.response.data.message || 'Login failed');
        }
      } else if (error.request) {
        console.log('No response from server');
        setApiError('Cannot connect to server. Please check if backend is running on https://eduvibe-quiz-web-app.onrender.com');
      } else {
        setApiError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendConnection = async () => {
    try {
      const api = axios.create({ baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api' });
      const response = await api.get('/health');
      alert(`✅ Backend connected! ${response.data.message}`);
    } catch (error) {
      alert('❌ Cannot connect to backend. Make sure server is running on port 5000');
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-b border-primary/10 py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <span className="material-icons text-white text-2xl">school</span>
            </div>
            <span className="text-2xl font-bold text-background-dark dark:text-white tracking-tight">
              EduVibe
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              <span className="material-icons text-lg">home</span>
              <span className="text-sm font-medium">Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content with Top Padding for Fixed Header */}
      <main className="flex-grow flex items-center justify-center px-4 py-12 pt-24">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-xl overflow-hidden border border-primary/10">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-3">
                  <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-icons text-3xl">school</span>
                  </div>
                </div>
                <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">
                  Teacher Login
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
                  Access your teaching dashboard and manage classes
                </p>
                <p>
                  TCH20268264 || UzYWkyv2
                </p>
              </div>

              {apiError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="material-icons text-red-500 text-sm">error</span>
                    <div className="flex-1">
                      <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                        {apiError}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                        Make sure backend is running: cd backend & node server.js
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Teacher ID Field */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Teacher ID *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <span className="material-icons text-lg">badge</span>
                    </span>
                    <input
                      className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border ${
                        errors.teacherId ? 'border-red-500' : 'border-primary/30'
                      } rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all sm:text-sm`}
                      name="teacherId"
                      type="text"
                      placeholder="Enter your Teacher ID"
                      value={formData.teacherId}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    {errors.teacherId && (
                      <p className="mt-1 text-xs text-red-500">{errors.teacherId}</p>
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <span className="material-icons text-lg">lock</span>
                    </span>
                    <input
                      className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border ${
                        errors.password ? 'border-red-500' : 'border-primary/30'
                      } rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all sm:text-sm`}
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                    )}
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      className="h-4 w-4 text-primary focus:ring-primary border-zinc-300 rounded cursor-pointer"
                      name="rememberMe"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      disabled={isLoading}
                      id="rememberMe"
                    />
                    <label 
                      htmlFor="rememberMe" 
                      className="ml-2 block text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer"
                    >
                      Remember me
                    </label>
                  </div>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:text-green-600 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </button>
              </form>

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-xs text-zinc-500">
                  Having trouble? Contact your school administrator
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherLogin;