import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddTeacher = () => {
  const [teachers, setTeachers] = useState([]);
  const [classTeachers, setClassTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    teacherName: '',
    teacherId: '',
    schoolName: '',
    email: '',
    password: '',
    phone: '',
    qualifications: '',
    experience: '',
    isClassTeacher: false,
    assignedClass: '',
    subjects: []
  });

  const [editFormData, setEditFormData] = useState({
    teacherName: '',
    teacherId: '',
    schoolName: '',
    email: '',
    phone: '',
    qualifications: '',
    experience: '',
    isClassTeacher: false,
    assignedClass: '',
    subjects: []
  });

  const [subjectList, setSubjectList] = useState([]);
  const [classList, setClassList] = useState([6, 7, 8, 9, 10, 11, 12]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClassSubjects, setSelectedClassSubjects] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
    fetchAvailableClasses();
    fetchSchoolSubjects();
    
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setFormData(prev => ({ ...prev, schoolName: user.schoolName || 'EduVibe School' }));
      setEditFormData(prev => ({ ...prev, schoolName: user.schoolName || 'EduVibe School' }));
    }
  }, []);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const response = await api.get('/teachers');
      const allTeachers = response.data.data || [];
      setTeachers(allTeachers);
      setClassTeachers(allTeachers.filter(t => t.isClassTeacher === true));
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const response = await api.get('/subjects');
      setSubjectList(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchSchoolSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subjectsByClass = {};
      for (const cls of classList) {
        const response = await api.get(`/subjects/school/${cls}`);
        subjectsByClass[cls] = response.data.data || [];
      }
      setSelectedClassSubjects(subjectsByClass);
    } catch (error) {
      console.error('Error fetching school subjects:', error);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const response = await api.get('/teachers/class-teachers');
      const assignedClasses = response.data.data || [];
      const allClasses = [6, 7, 8, 9, 10, 11, 12];
      const available = allClasses.filter(c => !assignedClasses.includes(c));
      setAvailableClasses(available);
    } catch (error) {
      console.error('Error fetching available classes:', error);
      setAvailableClasses([6, 7, 8, 9, 10, 11, 12]);
    }
  };

  const generateTeacherId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `TCH${year}${randomNum}`;
  };

  const generateEmail = (name) => {
    const cleanedName = name.toLowerCase().replace(/\s/g, '.');
    return `${cleanedName}@eduvibe.edu`;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'teacherName' && !prev.teacherId) {
        newData.teacherId = generateTeacherId();
        newData.email = generateEmail(value);
        newData.password = generatePassword();
      }
      return newData;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubjectSelection = (subjectId, subjectName, className, isSelected) => {
    setFormData(prev => {
      let updatedSubjects = [...prev.subjects];
      const existingIndex = updatedSubjects.findIndex(s => s.subjectId === subjectId && s.className === className);
      
      if (isSelected && existingIndex === -1) {
        updatedSubjects.push({ subjectId, subjectName, className });
      } else if (!isSelected && existingIndex !== -1) {
        updatedSubjects.splice(existingIndex, 1);
      }
      
      return { ...prev, subjects: updatedSubjects };
    });
  };

  const handleEditSubjectSelection = (subjectId, subjectName, className, isSelected) => {
    setEditFormData(prev => {
      let updatedSubjects = [...prev.subjects];
      const existingIndex = updatedSubjects.findIndex(s => s.subjectId === subjectId && s.className === className);
      
      if (isSelected && existingIndex === -1) {
        updatedSubjects.push({ subjectId, subjectName, className });
      } else if (!isSelected && existingIndex !== -1) {
        updatedSubjects.splice(existingIndex, 1);
      }
      
      return { ...prev, subjects: updatedSubjects };
    });
  };

  const isSubjectSelected = (subjectId, className) => {
    return formData.subjects.some(s => s.subjectId === subjectId && s.className === className);
  };

  const isEditSubjectSelected = (subjectId, className) => {
    return editFormData.subjects.some(s => s.subjectId === subjectId && s.className === className);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.teacherName.trim()) newErrors.teacherName = 'Teacher name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = 'Phone number must be 10 digits';
    if (formData.isClassTeacher && !formData.assignedClass) newErrors.assignedClass = 'Please select a class';
    if (formData.subjects.length === 0) newErrors.subjects = 'At least one subject must be assigned';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEditForm = () => {
    const newErrors = {};
    if (!editFormData.teacherName.trim()) newErrors.teacherName = 'Teacher name is required';
    if (!editFormData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(editFormData.phone.replace(/\D/g, ''))) newErrors.phone = 'Phone number must be 10 digits';
    if (editFormData.isClassTeacher && !editFormData.assignedClass) newErrors.assignedClass = 'Please select a class';
    if (editFormData.subjects.length === 0) newErrors.subjects = 'At least one subject must be assigned';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const response = await api.post('/teachers/add', formData);
      if (response.data.success) {
        // Store the password with the teacher data
        const newTeacher = response.data.data;
        newTeacher.defaultPassword = formData.password;
        
        setSuccessMessage(`Teacher added successfully! Password: ${formData.password}`);
        setTimeout(() => {
          setShowForm(false);
          setSuccessMessage('');
          setFormData({
            teacherName: '', teacherId: '', schoolName: formData.schoolName, email: '', password: '',
            phone: '', qualifications: '', experience: '', isClassTeacher: false, assignedClass: '', subjects: []
          });
          fetchTeachers();
          fetchAvailableClasses();
        }, 3000);
      }
    } catch (error) {
      setApiError(error.response?.data?.message || 'Failed to add teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validateEditForm()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const response = await api.put(`/teachers/${selectedTeacher._id}`, editFormData);
      if (response.data.success) {
        setSuccessMessage('Teacher updated successfully!');
        setTimeout(() => {
          setShowEditForm(false);
          setShowDetailModal(false);
          setSuccessMessage('');
          fetchTeachers();
          fetchAvailableClasses();
        }, 2000);
      }
    } catch (error) {
      setApiError(error.response?.data?.message || 'Failed to update teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        const token = localStorage.getItem('token');
        const api = axios.create({
          baseURL: 'http://localhost:5000/api',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        await api.delete(`/teachers/${teacherId}`);
        fetchTeachers();
        fetchAvailableClasses();
        setShowDetailModal(false);
        alert('Teacher deleted successfully');
      } catch (error) {
        alert('Failed to delete teacher');
      }
    }
  };

  const openDetailModal = (teacher) => {
    setSelectedTeacher(teacher);
    setShowDetailModal(true);
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setEditFormData({
      teacherName: teacher.teacherName || '',
      teacherId: teacher.teacherId || '',
      schoolName: teacher.schoolName || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      qualifications: teacher.qualifications || '',
      experience: teacher.experience || 0,
      isClassTeacher: teacher.isClassTeacher || false,
      assignedClass: teacher.assignedClass || '',
      subjects: teacher.subjects?.map(s => ({
        subjectId: s.subjectId?._id || s.subjectId,
        subjectName: s.subjectName || s.subjectId?.name,
        className: s.className || (s.class?.[0])
      })) || []
    });
    setShowEditForm(true);
  };

  const getTeacherPassword = (teacher) => {
    // Since backend doesn't return password, return default message
    return 'teacher@123';
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-b border-primary/10 py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors">
            <span className="material-icons text-2xl">arrow_back</span>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </header>

      <main className="flex-grow px-4 py-12 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Teacher Management</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Manage all teachers and class teachers</p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg">
              <p className="text-green-700 dark:text-green-400">{successMessage}</p>
            </div>
          )}

          {apiError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
              <p className="text-red-700 dark:text-red-400">{apiError}</p>
            </div>
          )}

          {/* Two Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* All Teachers Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">All Teachers</h2>
                <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-green-600 transition-colors">
                  + Add New Teacher
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {teachers.length === 0 ? (
                  <p className="text-center text-zinc-500 py-4">No teachers added yet</p>
                ) : (
                  teachers.map(teacher => (
                    <div key={teacher._id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{teacher.teacherName}</p>
                        <p className="text-xs text-zinc-500">{teacher.teacherId}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openDetailModal(teacher)} className="p-1 text-blue-600 hover:text-blue-800">
                          <span className="material-icons text-lg">visibility</span>
                        </button>
                        <button onClick={() => openEditModal(teacher)} className="p-1 text-green-600 hover:text-green-800">
                          <span className="material-icons text-lg">edit</span>
                        </button>
                        <button onClick={() => handleDelete(teacher._id)} className="p-1 text-red-600 hover:text-red-800">
                          <span className="material-icons text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Class Teachers Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Class Teachers</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {classTeachers.length === 0 ? (
                  <p className="text-center text-zinc-500 py-4">No class teachers assigned yet</p>
                ) : (
                  classTeachers.map(teacher => (
                    <div key={teacher._id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{teacher.teacherName}</p>
                        <p className="text-xs text-zinc-500">Class: {teacher.assignedClass} | ID: {teacher.teacherId}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openDetailModal(teacher)} className="p-1 text-blue-600 hover:text-blue-800">
                          <span className="material-icons text-lg">visibility</span>
                        </button>
                        <button onClick={() => openEditModal(teacher)} className="p-1 text-green-600 hover:text-green-800">
                          <span className="material-icons text-lg">edit</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Add Teacher Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Teacher</h2>
                    <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                      <span className="material-icons">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium mb-1">Teacher Name *</label>
                        <input type="text" name="teacherName" value={formData.teacherName} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                        {errors.teacherName && <p className="text-red-500 text-xs mt-1">{errors.teacherName}</p>}
                      </div>
                      <div><label className="block text-sm font-medium mb-1">Teacher ID</label>
                        <input type="text" value={formData.teacherId} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-100" /></div>
                      <div><label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" value={formData.email} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-100" /></div>
                      <div><label className="block text-sm font-medium mb-1">Password</label>
                        <input type="text" value={formData.password} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-100" /></div>
                      <div><label className="block text-sm font-medium mb-1">Phone Number *</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                      <div><label className="block text-sm font-medium mb-1">Qualifications</label>
                        <input type="text" name="qualifications" value={formData.qualifications} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" /></div>
                      <div><label className="block text-sm font-medium mb-1">Experience (years)</label>
                        <input type="number" name="experience" value={formData.experience} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" /></div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2"><input type="checkbox" name="isClassTeacher" checked={formData.isClassTeacher} onChange={handleChange} className="h-4 w-4" /> Class Teacher</label>
                      </div>
                      {formData.isClassTeacher && (
                        <div><label className="block text-sm font-medium mb-1">Select Class *</label>
                          <select name="assignedClass" value={formData.assignedClass} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                            <option value="">Select Class</option>
                            {availableClasses.map(cls => <option key={cls} value={cls}>Class {cls}</option>)}
                          </select>
                          {errors.assignedClass && <p className="text-red-500 text-xs mt-1">{errors.assignedClass}</p>}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Assign Subjects (Class-wise)</h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {classList.map(className => {
                          const subjectsForClass = selectedClassSubjects[className] || [];
                          if (subjectsForClass.length === 0) return null;
                          
                          return (
                            <div key={className} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                              <h4 className="text-md font-bold text-primary mb-3">Class {className}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {subjectsForClass.map(subject => (
                                  <label key={subject._id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                    <input
                                      type="checkbox"
                                      checked={isSubjectSelected(subject.subjectId?._id || subject._id, className)}
                                      onChange={(e) => handleSubjectSelection(
                                        subject.subjectId?._id || subject._id,
                                        subject.subjectName || subject.subjectId?.name,
                                        className,
                                        e.target.checked
                                      )}
                                      className="h-4 w-4 text-primary rounded"
                                    />
                                    <span className="text-sm">{subject.subjectName || subject.subjectId?.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {errors.subjects && <p className="text-red-500 text-xs mt-2">{errors.subjects}</p>}
                    </div>

                    {formData.subjects.length > 0 && (
                      <div className="p-4 bg-primary/5 rounded-lg">
                        <h4 className="text-sm font-semibold mb-2">Selected Subjects:</h4>
                        <div className="flex flex-wrap gap-2">
                          {formData.subjects.map((subject, idx) => (
                            <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              {subject.subjectName} - Class {subject.className}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                        {isSubmitting ? 'Adding...' : 'Add Teacher'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Edit Teacher Form Modal */}
          {showEditForm && selectedTeacher && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Teacher</h2>
                    <button onClick={() => setShowEditForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                      <span className="material-icons">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium mb-1">Teacher Name *</label>
                        <input type="text" name="teacherName" value={editFormData.teacherName} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" />
                        {errors.teacherName && <p className="text-red-500 text-xs mt-1">{errors.teacherName}</p>}
                      </div>
                      <div><label className="block text-sm font-medium mb-1">Teacher ID</label>
                        <input type="text" value={editFormData.teacherId} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-100" /></div>
                      <div><label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" name="email" value={editFormData.email} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" /></div>
                      <div><label className="block text-sm font-medium mb-1">Phone Number *</label>
                        <input type="tel" name="phone" value={editFormData.phone} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                      <div><label className="block text-sm font-medium mb-1">Qualifications</label>
                        <input type="text" name="qualifications" value={editFormData.qualifications} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" /></div>
                      <div><label className="block text-sm font-medium mb-1">Experience (years)</label>
                        <input type="number" name="experience" value={editFormData.experience} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" /></div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2"><input type="checkbox" name="isClassTeacher" checked={editFormData.isClassTeacher} onChange={handleEditChange} className="h-4 w-4" /> Class Teacher</label>
                      </div>
                      {editFormData.isClassTeacher && (
                        <div><label className="block text-sm font-medium mb-1">Select Class *</label>
                          <select name="assignedClass" value={editFormData.assignedClass} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg">
                            <option value="">Select Class</option>
                            {[6,7,8,9,10,11,12].map(cls => (
                              <option key={cls} value={cls} disabled={availableClasses.includes(cls) && editFormData.assignedClass !== cls}>
                                Class {cls} {availableClasses.includes(cls) && editFormData.assignedClass !== cls ? '(Available)' : ''}
                              </option>
                            ))}
                          </select>
                          {errors.assignedClass && <p className="text-red-500 text-xs mt-1">{errors.assignedClass}</p>}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Assign Subjects (Class-wise)</h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {classList.map(className => {
                          const subjectsForClass = selectedClassSubjects[className] || [];
                          if (subjectsForClass.length === 0) return null;
                          
                          return (
                            <div key={className} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                              <h4 className="text-md font-bold text-primary mb-3">Class {className}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {subjectsForClass.map(subject => (
                                  <label key={subject._id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                    <input
                                      type="checkbox"
                                      checked={isEditSubjectSelected(subject.subjectId?._id || subject._id, className)}
                                      onChange={(e) => handleEditSubjectSelection(
                                        subject.subjectId?._id || subject._id,
                                        subject.subjectName || subject.subjectId?.name,
                                        className,
                                        e.target.checked
                                      )}
                                      className="h-4 w-4 text-primary rounded"
                                    />
                                    <span className="text-sm">{subject.subjectName || subject.subjectId?.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {errors.subjects && <p className="text-red-500 text-xs mt-2">{errors.subjects}</p>}
                    </div>

                    {editFormData.subjects.length > 0 && (
                      <div className="p-4 bg-primary/5 rounded-lg">
                        <h4 className="text-sm font-semibold mb-2">Selected Subjects:</h4>
                        <div className="flex flex-wrap gap-2">
                          {editFormData.subjects.map((subject, idx) => (
                            <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              {subject.subjectName} - Class {subject.className}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => setShowEditForm(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                        {isSubmitting ? 'Updating...' : 'Update Teacher'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Details Modal */}
          {showDetailModal && selectedTeacher && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Teacher Details</h2>
                    <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <p><span className="font-semibold">Name:</span> <span className="text-slate-600">{selectedTeacher.teacherName}</span></p>
                      <p><span className="font-semibold">ID:</span> <span className="text-slate-600">{selectedTeacher.teacherId}</span></p>
                      <p><span className="font-semibold">Email:</span> <span className="text-slate-600">{selectedTeacher.email}</span></p>
                      <p><span className="font-semibold">Phone:</span> <span className="text-slate-600">{selectedTeacher.phone}</span></p>
                      <p><span className="font-semibold">Qualifications:</span> <span className="text-slate-600">{selectedTeacher.qualifications || 'N/A'}</span></p>
                      <p><span className="font-semibold">Experience:</span> <span className="text-slate-600">{selectedTeacher.experience || 0} years</span></p>
                      <p><span className="font-semibold">Class Teacher:</span> 
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${selectedTeacher.isClassTeacher ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {selectedTeacher.isClassTeacher ? `Yes (Class ${selectedTeacher.assignedClass})` : 'No'}
                        </span>
                      </p>
                      <p><span className="font-semibold">Status:</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${selectedTeacher.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {selectedTeacher.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <p className="font-semibold mb-2">Subjects Teaching:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTeacher.subjects?.length > 0 ? (
                          selectedTeacher.subjects.map((subject, idx) => (
                            <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              {subject.subjectName || subject.subjectId?.name} - Class {subject.className || subject.class?.[0]}
                            </span>
                          ))
                        ) : (
                          <p className="text-slate-500 text-sm">No subjects assigned</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Close</button>
                    <button onClick={() => {
                      setShowDetailModal(false);
                      openEditModal(selectedTeacher);
                    }} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Edit Teacher</button>
                    <button onClick={() => handleDelete(selectedTeacher._id)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete Teacher</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddTeacher;