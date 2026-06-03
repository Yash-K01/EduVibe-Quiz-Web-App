import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    schoolName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
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

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = 'School name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one letter and one number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.terms) {
      newErrors.terms = 'You must agree to the Terms of Service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    
    setTimeout(() => {
      popup.remove();
      navigate('/');
    }, 3000);
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
        baseURL: 'http://localhost:5000/api',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Sending to:', 'http://localhost:5000/api/auth/register');

      const response = await api.post('/auth/register', {
        schoolName: formData.schoolName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      console.log('📥 Registration response:', response.data);

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        
        showSuccessPopup('Registration Successful!', navigate);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error.code === 'ECONNABORTED') {
        setApiError('Request timeout. Please try again.');
      } else if (error.response) {
        console.log('Server error response:', error.response.data);
        
        if (error.response.data.errors) {
          const backendErrors = {};
          error.response.data.errors.forEach(err => {
            backendErrors[err.path] = err.msg;
          });
          setErrors(backendErrors);
          setApiError('Please fix the validation errors');
        } else {
          setApiError(error.response.data.message || 'Registration failed');
        }
      } else if (error.request) {
        console.log('No response from server');
        setApiError('Cannot connect to server. Please check if backend is running on http://localhost:5000');
      } else {
        setApiError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendConnection = async () => {
    try {
      const api = axios.create({ baseURL: 'http://localhost:5000/api' });
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
            {/* Test Connection Button */}
            <button
              type="button"
              onClick={testBackendConnection}
              className="text-xs text-zinc-500 hover:text-primary transition-colors"
            >
              Test Connection
            </button>
            
            {/* Home Link */}
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
          {/* Registration Card */}
          <div className="bg-white dark:bg-zinc-900 shadow-xl rounded-xl overflow-hidden border border-primary/10">
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">
                  Admin Registration
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
                  Empower your school with NCERT quizzes for grades 6-12.
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
                {/* School Name Field */}
                <div>
                  <label 
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" 
                    htmlFor="schoolName"
                  >
                    School Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <span className="material-icons text-lg">business</span>
                    </span>
                    <input
                      className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border ${errors.schoolName ? 'border-red-500' : 'border-primary/30'} rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all sm:text-sm`}
                      id="schoolName"
                      name="schoolName"
                      placeholder="e.g. Green Valley International"
                      type="text"
                      value={formData.schoolName}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    {errors.schoolName && (
                      <p className="mt-1 text-xs text-red-500">{errors.schoolName}</p>
                    )}
                  </div>
                </div>

                {/* Admin Email Field */}
                <div>
                  <label 
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" 
                    htmlFor="email"
                  >
                    Admin Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <span className="material-icons text-lg">alternate_email</span>
                    </span>
                    <input
                      className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border ${errors.email ? 'border-red-500' : 'border-primary/30'} rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all sm:text-sm`}
                      id="email"
                      name="email"
                      placeholder="admin@school.edu"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label 
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" 
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <span className="material-icons text-lg">lock_open</span>
                    </span>
                    <input
                      className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border ${errors.password ? 'border-red-500' : 'border-primary/30'} rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all sm:text-sm`}
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                    )}
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label 
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" 
                    htmlFor="confirmPassword"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <span className="material-icons text-lg">lock</span>
                    </span>
                    <input
                      className={`block w-full pl-10 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border ${errors.confirmPassword ? 'border-red-500' : 'border-primary/30'} rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all sm:text-sm`}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="••••••••"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Agreement */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      className="h-4 w-4 text-primary focus:ring-primary border-zinc-300 rounded"
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={formData.terms}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="ml-3 text-xs">
                    <label className="text-zinc-500 dark:text-zinc-400" htmlFor="terms">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary font-medium hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-primary font-medium hover:underline">
                        Privacy Policy
                      </Link>.
                    </label>
                    {errors.terms && (
                      <p className="mt-1 text-xs text-red-500">{errors.terms}</p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registering...
                    </>
                  ) : 'Register'}
                </button>
              </form>

              {/* Footer Link */}
              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Already registered?{' '}
                  <Link
                    className="font-semibold text-green-700 dark:text-primary hover:text-green-800 dark:hover:text-green-400 transition-colors"
                    to="/admin-login"
                  >
                    Continue to Login
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-8 text-center space-x-6">
            <Link className="text-xs text-zinc-500 hover:text-primary transition-colors" to="/help">
              Need help?
            </Link>
            <Link className="text-xs text-zinc-500 hover:text-primary transition-colors" to="/contact">
              Contact Sales
            </Link>
            <Link className="text-xs text-zinc-500 hover:text-primary transition-colors" to="/resources">
              Resource Guide
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Decorative */}
      <footer className="py-8 opacity-50 select-none pointer-events-none">
        <div className="flex justify-center items-center gap-12 overflow-hidden">
          <span className="text-6xl font-black text-primary/5 uppercase tracking-widest">
            Education
          </span>
          <span className="text-6xl font-black text-primary/5 uppercase tracking-widest">
            Growth
          </span>
          <span className="text-6xl font-black text-primary/5 uppercase tracking-widest">
            Success
          </span>
        </div>
      </footer>
    </div>
  );
};

export default AdminRegister;