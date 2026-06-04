import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentProfile = () => {
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    className: '',
    division: '',
    rollNo: '',
    gender: '',
    bloodGroup: '',
    email: '',
    dateOfBirth: '',
    fatherName: '',
    motherName: '',
    parentMobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    admissionDate: '',
    schoolName: ''
  });

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
      fetchStudentProfile(parsedUser._id);
    }
  }, [navigate]);

  const fetchStudentProfile = async (studentId) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const response = await api.get(`/student/profile/${studentId}`);
      
      if (response.data.success) {
        const profile = response.data.data;
        setFormData({
          studentName: profile.studentName || '',
          studentId: profile.studentId || '',
          className: profile.className || '',
          division: profile.division || '',
          rollNo: profile.rollNo || '',
          gender: profile.gender || '',
          bloodGroup: profile.bloodGroup || '',
          email: profile.email || '',
          dateOfBirth: profile.dateOfBirth || '',
          fatherName: profile.fatherName || '',
          motherName: profile.motherName || '',
          parentMobile: profile.parentMobile || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          pincode: profile.pincode || '',
          admissionDate: profile.admissionDate || '',
          schoolName: profile.schoolName || ''
        });
        
        if (profile.photo) {
          setPreviewUrl(`https://eduvibe-quiz-web-app.onrender.com${profile.photo}`);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setApiError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      if (selectedFile) {
        submitData.append('photo', selectedFile);
      }

      const response = await api.put(`/student/profile/${studentData._id}`, submitData);
      
      if (response.data.success) {
        setSuccessMessage('Profile updated successfully!');
        localStorage.setItem('user', JSON.stringify(response.data.data));
        setTimeout(() => {
          setSuccessMessage('');
          setIsEditing(false);
          fetchStudentProfile(studentData._id);
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setApiError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
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
            
            <Link to="/student-dashboard" className="flex items-center gap-3 px-4 py-3 mb-1 rounded-lg hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors group" onClick={() => setSidebarOpen(false)}>
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">dashboard</span>
              </div>
              <div><p className="font-medium">Dashboard</p><p className="text-xs text-slate-500">Overview</p></div>
            </Link>

            <Link to="/my-subjects" className="flex items-center gap-3 px-4 py-3 mb-1 rounded-lg hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors group" onClick={() => setSidebarOpen(false)}>
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <div><p className="font-medium">My Subjects</p><p className="text-xs text-slate-500">View subjects</p></div>
            </Link>

            <Link to="/my-results" className="flex items-center gap-3 px-4 py-3 mb-1 rounded-lg hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary transition-colors group" onClick={() => setSidebarOpen(false)}>
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">assignment_turned_in</span>
              </div>
              <div><p className="font-medium">My Results</p><p className="text-xs text-slate-500">View scores</p></div>
            </Link>

            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary transition-colors group" onClick={() => setSidebarOpen(false)}>
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">account_circle</span>
              </div>
              <div><p className="font-medium">Profile</p><p className="text-xs text-slate-500">View profile</p></div>
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
          <p className="text-slate-600 dark:text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
      <Header />
      <LeftSidebar />
      
      <main className={`flex-1 pt-20 transition-all duration-300 lg:ml-64`}>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Student Profile</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2">View and manage your profile information</p>
            </div>

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700">{successMessage}</p>
              </div>
            )}

            {apiError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{apiError}</p>
              </div>
            )}

            {/* ID Card Style Profile */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/20 to-primary/5 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Student Identity Card</h2>
                <p className="text-sm text-slate-500">EduVibe - School ID Card</p>
              </div>

              {/* ID Card Content */}
              <div className="p-6">
                {!isEditing ? (
                  // View Mode
                  <div>
                    {/* Photo and Basic Info */}
                    <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                      <div className="text-center">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Student" className="w-40 h-40 rounded-full object-cover border-4 border-primary mx-auto" />
                        ) : (
                          <div className="w-40 h-40 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto border-4 border-primary">
                            <span className="material-symbols-outlined text-6xl">person</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formData.studentName}</h3>
                        <p className="text-slate-500">Student ID: {formData.studentId}</p>
                        <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Class {formData.className}</span>
                          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Division {formData.division}</span>
                          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Roll No: {formData.rollNo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Personal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500">Email Address</p>
                        <p className="font-medium">{formData.email}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500">Gender</p>
                        <p className="font-medium">{formData.gender || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500">Blood Group</p>
                        <p className="font-medium">{formData.bloodGroup || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500">Date of Birth</p>
                        <p className="font-medium">{formData.dateOfBirth || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500">Father's Name</p>
                        <p className="font-medium">{formData.fatherName || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500">Mother's Name</p>
                        <p className="font-medium">{formData.motherName || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500">Parent Mobile</p>
                        <p className="font-medium">{formData.parentMobile || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500">Admission Date</p>
                        <p className="font-medium">{formData.admissionDate || 'Not specified'}</p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-xs text-slate-500 mb-2">Address</p>
                      <p className="font-medium">{formData.address || 'Not specified'}</p>
                      <p className="text-sm mt-1">{formData.city && `${formData.city}, `}{formData.state && `${formData.state} - `}{formData.pincode}</p>
                    </div>

                    {/* School Info */}
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <p className="text-xs text-slate-500">School</p>
                      <p className="font-semibold text-primary">{formData.schoolName}</p>
                    </div>

                    <div className="flex justify-end mt-6">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                ) : (
                  // Edit Mode
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Photo Upload */}
                    <div className="text-center">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Student" className="w-32 h-32 rounded-full object-cover border-4 border-primary mx-auto" />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto border-4 border-primary">
                          <span className="material-symbols-outlined text-5xl">person</span>
                        </div>
                      )}
                      <div className="mt-2">
                        <label className="cursor-pointer text-primary text-sm hover:underline">
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                          Upload Photo
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Student Name</label>
                        <input type="text" name="studentName" value={formData.studentName} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Student ID</label>
                        <input type="text" value={formData.studentId} readOnly className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg">
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Blood Group</label>
                        <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg">
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option><option value="A-">A-</option>
                          <option value="B+">B+</option><option value="B-">B-</option>
                          <option value="AB+">AB+</option><option value="AB-">AB-</option>
                          <option value="O+">O+</option><option value="O-">O-</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Date of Birth</label>
                        <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Parent Mobile</label>
                        <input type="tel" name="parentMobile" value={formData.parentMobile} onChange={handleInputChange} placeholder="10-digit mobile number" className="w-full px-4 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Father's Name</label>
                        <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Mother's Name</label>
                        <input type="text" name="motherName" value={formData.motherName} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" className="w-full px-4 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">City</label>
                        <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">State</label>
                        <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Pincode</label>
                        <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Admission Date</label>
                        <input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg" />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                      <button type="submit" disabled={isSaving} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentProfile;