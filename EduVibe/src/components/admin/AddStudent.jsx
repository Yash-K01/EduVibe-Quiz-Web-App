import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddStudent = () => {
  const [students, setStudents] = useState([]);
  const [classWiseStudents, setClassWiseStudents] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    className: '',
    rollNo: '',
    gender: '',
    bloodGroup: '',
    email: '',
    password: '',
    schoolName: ''
  });

  const [editFormData, setEditFormData] = useState({
    studentName: '',
    studentId: '',
    className: '',
    rollNo: '',
    gender: '',
    bloodGroup: '',
    email: '',
    password: '',
    schoolName: ''
  });

  const [teachers, setTeachers] = useState([]);
  const [classList, setClassList] = useState([6, 7, 8, 9, 10, 11, 12]);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    fetchTeachers();
    
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setFormData(prev => ({ ...prev, schoolName: user.schoolName || 'EduVibe School' }));
      setEditFormData(prev => ({ ...prev, schoolName: user.schoolName || 'EduVibe School' }));
    }
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const response = await api.get('/students');
      const allStudents = response.data.data || [];
      setStudents(allStudents);
      
      const grouped = {};
      classList.forEach(cls => { grouped[cls] = []; });
      allStudents.forEach(student => {
        if (grouped[student.className]) {
          grouped[student.className].push(student);
        }
      });
      setClassWiseStudents(grouped);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const response = await api.get('/teachers');
      setTeachers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const generateStudentId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `STU${year}${randomNum}`;
  };

  const generateEmail = (name, studentId) => {
    const cleanedName = name.toLowerCase().replace(/\s/g, '.');
    return `${cleanedName}.${studentId}@eduvibe.edu`;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleClassSelect = (className) => {
    setSelectedClass(className);
    const studentId = generateStudentId();
    setFormData({
      studentName: '',
      studentId: studentId,
      className: className,
      rollNo: '',
      gender: '',
      bloodGroup: '',
      email: generateEmail('', studentId),
      password: generatePassword(),
      schoolName: formData.schoolName
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'studentName') {
        newData.email = generateEmail(value, prev.studentId);
      }
      return newData;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.studentName.trim()) newErrors.studentName = 'Student name is required';
    if (!formData.rollNo) newErrors.rollNo = 'Roll number is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.bloodGroup) newErrors.bloodGroup = 'Blood group is required';
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
      const response = await api.post('/students/add', formData);
      if (response.data.success) {
        setSuccessMessage('Student added successfully!');
        setTimeout(() => {
          setShowForm(false);
          setSuccessMessage('');
          fetchStudents();
        }, 2000);
      }
    } catch (error) {
      setApiError(error.response?.data?.message || 'Failed to add student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setApiError('');
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const response = await api.put(`/students/${selectedStudent._id}`, editFormData);
      if (response.data.success) {
        setSuccessMessage('Student updated successfully!');
        setTimeout(() => {
          setShowEditForm(false);
          setShowDetailModal(false);
          setSuccessMessage('');
          fetchStudents();
        }, 2000);
      }
    } catch (error) {
      setApiError(error.response?.data?.message || 'Failed to update student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const token = localStorage.getItem('token');
        const api = axios.create({
          baseURL: 'http://localhost:5000/api',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        await api.delete(`/students/${studentId}`);
        fetchStudents();
        setShowDetailModal(false);
        alert('Student deleted successfully');
      } catch (error) {
        alert('Failed to delete student');
      }
    }
  };

  const openDetailModal = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setEditFormData({
      studentName: student.studentName || '',
      studentId: student.studentId || '',
      className: student.className || '',
      rollNo: student.rollNo || '',
      gender: student.gender || '',
      bloodGroup: student.bloodGroup || '',
      email: student.email || '',
      password: student.password || '',
      schoolName: student.schoolName || ''
    });
    setShowEditForm(true);
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher?.teacherName || 'Not Assigned';
  };

  const getClassTeacherName = (className) => {
    const classTeacher = teachers.find(t => t.isClassTeacher && t.assignedClass === className);
    return classTeacher?.teacherName || 'Not Assigned';
  };

  const getSubjectWithTeacher = (subjects) => {
    if (!subjects || subjects.length === 0) return [];
    return subjects.map(subject => ({
      name: subject.subjectName,
      teacher: getTeacherName(subject.teacherId)
    }));
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Student Management</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Manage students class-wise</p>
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

          {/* Class Wise Cards */}
          <div className="space-y-6">
            {classList.map(className => {
              const classStudents = classWiseStudents[className] || [];
              const classTeacherName = getClassTeacherName(className);
              
              return (
                <div key={className} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Class {className}</h2>
                        <p className="text-sm text-zinc-500 mt-1">
                          Class Teacher: <span className="font-medium text-primary">{classTeacherName}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleClassSelect(className)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <span className="material-icons text-base">add</span>
                        Add New Student
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {classStudents.length === 0 ? (
                      <p className="text-center text-zinc-500 py-8">No students added yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Roll No</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gender</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Blood Group</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {classStudents.map(student => (
                              <tr key={student._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{student.rollNo}</td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{student.studentName}</td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{student.studentId}</td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{student.gender}</td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{student.bloodGroup}</td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <button onClick={() => openDetailModal(student)} className="p-1 text-blue-600 hover:text-blue-800" title="View Details">
                                      <span className="material-icons text-lg">visibility</span>
                                    </button>
                                    <button onClick={() => openEditModal(student)} className="p-1 text-green-600 hover:text-green-800" title="Edit">
                                      <span className="material-icons text-lg">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(student._id)} className="p-1 text-red-600 hover:text-red-800" title="Delete">
                                      <span className="material-icons text-lg">delete</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Student Form Modal - 2 inputs in a line */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add Student - Class {selectedClass}</h2>
                    <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                      <span className="material-icons">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Student Name *</label>
                        <input type="text" name="studentName" value={formData.studentName} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                        {errors.studentName && <p className="text-red-500 text-xs mt-1">{errors.studentName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Student ID</label>
                        <input type="text" value={formData.studentId} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-100 font-mono" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Roll Number *</label>
                        <input type="number" name="rollNo" value={formData.rollNo} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
                        {errors.rollNo && <p className="text-red-500 text-xs mt-1">{errors.rollNo}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Gender *</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                          <option value="">Select Gender</option>
                          {genders.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Blood Group *</label>
                        <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
                          <option value="">Select Blood Group</option>
                          {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                        {errors.bloodGroup && <p className="text-red-500 text-xs mt-1">{errors.bloodGroup}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" name="email" value={formData.email} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-100" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input type="text" name="password" value={formData.password} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-100 font-mono" />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                        {isSubmitting ? 'Adding...' : 'Add Student'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Edit Student Form Modal */}
          {showEditForm && selectedStudent && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Student</h2>
                    <button onClick={() => setShowEditForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                      <span className="material-icons">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Student Name *</label>
                        <input type="text" name="studentName" value={editFormData.studentName} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Student ID</label>
                        <input type="text" value={editFormData.studentId} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-100 font-mono" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Roll Number *</label>
                        <input type="number" name="rollNo" value={editFormData.rollNo} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Gender *</label>
                        <select name="gender" value={editFormData.gender} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg">
                          <option value="">Select Gender</option>
                          {genders.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Blood Group *</label>
                        <select name="bloodGroup" value={editFormData.bloodGroup} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg">
                          <option value="">Select Blood Group</option>
                          {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" name="email" value={editFormData.email} onChange={handleEditChange} className="w-full px-3 py-2 border rounded-lg" />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => setShowEditForm(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                        {isSubmitting ? 'Updating...' : 'Update Student'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Student Details Modal - Showing subject with teacher name */}
          {showDetailModal && selectedStudent && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Student Details</h2>
                    <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <p><span className="font-semibold">Name:</span> <span className="text-slate-600">{selectedStudent.studentName}</span></p>
                      <p><span className="font-semibold">Student ID:</span> <span className="text-slate-600 font-mono">{selectedStudent.studentId}</span></p>
                      <p><span className="font-semibold">Class:</span> <span className="text-slate-600">{selectedStudent.className}</span></p>
                      <p><span className="font-semibold">Roll No:</span> <span className="text-slate-600">{selectedStudent.rollNo}</span></p>
                      <p><span className="font-semibold">Gender:</span> <span className="text-slate-600">{selectedStudent.gender}</span></p>
                      <p><span className="font-semibold">Blood Group:</span> <span className="text-slate-600">{selectedStudent.bloodGroup}</span></p>
                      <p><span className="font-semibold">Email:</span> <span className="text-slate-600">{selectedStudent.email}</span></p>
                      <p><span className="font-semibold">School:</span> <span className="text-slate-600">{selectedStudent.schoolName}</span></p>
                      <p className="col-span-2"><span className="font-semibold">Class Teacher:</span> <span className="text-slate-600">{getClassTeacherName(selectedStudent.className)}</span></p>
                    </div>
                    
                    {/* Subjects with Teacher Names */}
                    <div>
                      <p className="font-semibold mb-2">Subjects with Teachers:</p>
                      <div className="space-y-2">
                        {selectedStudent.subjects && selectedStudent.subjects.length > 0 ? (
                          selectedStudent.subjects.map((subject, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <span className="text-sm">{subject.subjectName}</span>
                              <span className="text-sm text-primary">{getTeacherName(subject.teacherId)}</span>
                            </div>
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
                      openEditModal(selectedStudent);
                    }} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Edit Student</button>
                    <button onClick={() => handleDelete(selectedStudent._id)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete Student</button>
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

export default AddStudent;