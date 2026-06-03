import axios from '../utils/axiosConfig';

const authService = {
  // Login admin
  async login(credentials) {
    try {
      console.log('🔐 Attempting login with:', credentials.email);
      
      const response = await axios.post('/auth/login', credentials);
      
      console.log('✅ Login response:', response.data);
      
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        console.log('💾 Token saved to localStorage');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Handle specific error cases
      if (error.message === 'Network Error') {
        throw { message: 'Cannot connect to server. Please check if backend is running on http://localhost:5000' };
      }
      
      if (error.response) {
        throw error.response.data;
      }
      
      throw { message: 'Login failed. Please try again.' };
    }
  },

  // Register admin
  async register(userData) {
    try {
      console.log('📝 Attempting registration:', userData.email);
      
      const response = await axios.post('/auth/register', userData);
      
      console.log('✅ Registration response:', response.data);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error.message === 'Network Error') {
        throw { message: 'Cannot connect to server. Please check if backend is running.' };
      }
      
      if (error.response) {
        throw error.response.data;
      }
      
      throw { message: 'Registration failed. Please try again.' };
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('👋 Logged out');
  },

  // Get current user
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};

export default authService;