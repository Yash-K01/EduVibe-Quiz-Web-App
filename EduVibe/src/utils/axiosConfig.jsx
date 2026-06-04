import axios from 'axios';

// Use localhost, not 127.0.0.1
const axiosInstance = axios.create({
  baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method.toUpperCase()} Request to: ${config.baseURL}${config.url}`);
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`📥 Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request Timeout');
    } else if (error.response) {
      console.error('❌ Server Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ No Response - Backend not reachable');
      console.error('   Make sure backend is running on: https://eduvibe-quiz-web-app.onrender.com');
    } else {
      console.error('❌ Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;