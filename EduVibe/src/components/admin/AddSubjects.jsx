import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddSubjects = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [savedSubjects, setSavedSubjects] = useState([]);
  const [allSavedSubjects, setAllSavedSubjects] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const navigate = useNavigate();

  // Fetch all saved subjects on load
  useEffect(() => {
    fetchAllSavedSubjects();
  }, []);

  // Fetch subjects when class is selected
  useEffect(() => {
    if (selectedClass && showForm) {
      fetchSubjectsByClass();
      fetchSavedSubjects();
    }
  }, [selectedClass, showForm]);

  const fetchAllSavedSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const classes = [6, 7, 8, 9, 10, 11, 12];
      const results = {};
      
      for (const cls of classes) {
        const response = await api.get(`/subjects/school/${cls}`);
        results[cls] = response.data.data || [];
      }
      
      setAllSavedSubjects(results);
    } catch (error) {
      console.error('Error fetching all subjects:', error);
    }
  };

  const fetchSubjectsByClass = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const response = await api.get(`/subjects/ncert/${selectedClass}`);
      setAvailableSubjects(response.data.data || []);
      setSelectedSubjects([]);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setApiError('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const response = await api.get(`/subjects/school/${selectedClass}`);
      const saved = response.data.data || [];
      setSavedSubjects(saved);
      
      const preSelected = saved.map(s => s.subjectId?._id || s.subjectId);
      setSelectedSubjects(preSelected);
    } catch (error) {
      console.error('Error fetching saved subjects:', error);
    }
  };

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedSubjects.length === availableSubjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(availableSubjects.map(s => s._id));
    }
  };

  const handleSave = async () => {
    if (!selectedClass) {
      setApiError('Please select a class first');
      return;
    }

    if (selectedSubjects.length === 0) {
      setApiError('Please select at least one subject');
      return;
    }

    setIsSaving(true);
    setApiError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const subjectsToSave = availableSubjects
        .filter(subject => selectedSubjects.includes(subject._id))
        .map(subject => ({
          subjectId: subject._id,
          name: subject.name,
          code: subject.code,
          isOptional: subject.category === 'elective'
        }));

      const response = await api.post('/subjects/school/save', {
        className: selectedClass,
        selectedSubjects: subjectsToSave
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        await fetchAllSavedSubjects();
        fetchSavedSubjects();
        setShowForm(false);
        setSelectedClass('');
        setAvailableSubjects([]);
        setSelectedSubjects([]);
      }
    } catch (error) {
      console.error('Error saving subjects:', error);
      setApiError(error.response?.data?.message || 'Failed to save subjects');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClass = (cls) => {
    setSelectedClass(cls.toString());
    setShowForm(true);
    setTimeout(() => {
      document.getElementById('subject-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAddClass = (cls) => {
    setSelectedClass(cls.toString());
    setShowForm(true);
    setTimeout(() => {
      document.getElementById('subject-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedClass('');
    setAvailableSubjects([]);
    setSelectedSubjects([]);
    setApiError('');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-b border-primary/10 py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors"
          >
            <span className="material-icons text-2xl">arrow_back</span>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </header>

      <main className="flex-grow px-4 py-12 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">School Subjects Configuration</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Select which subjects your school offers for each class
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-icons text-green-500">check_circle</span>
                <p className="text-green-700 dark:text-green-400">{successMessage}</p>
              </div>
            </div>
          )}

          {apiError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-icons text-red-500">error</span>
                <p className="text-red-700 dark:text-red-400">{apiError}</p>
              </div>
            </div>
          )}

          {/* Subject Cards Section - Always visible */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Class Wise Subjects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[6, 7, 8, 9, 10, 11, 12].map((cls) => {
                const subjects = allSavedSubjects[cls] || [];
                return (
                  <div key={cls} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all min-h-[220px]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Class {cls}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddClass(cls)}
                          className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-lg hover:bg-primary hover:text-white transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => handleEditClass(cls)}
                          className="text-sm border border-primary/30 text-primary px-3 py-1 rounded-lg hover:bg-primary hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 mt-3">
                      {subjects.length === 0 ? (
                        <p className="text-sm text-zinc-500 italic">No subjects added</p>
                      ) : (
                        subjects.map((subject, idx) => (
                          <p key={idx} className="text-sm text-slate-600 dark:text-slate-400">
                            • {subject.subjectName || subject.subjectId?.name}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Section - Only shows when a class is selected for editing */}
          {showForm && (
            <div id="subject-form" className="bg-white dark:bg-zinc-900 shadow-xl rounded-xl overflow-hidden border border-primary/10 mt-8">
              <div className="p-8">
                <div className="mb-8">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Selected Class: <span className="font-bold text-primary">Class {selectedClass}</span>
                  </label>
                </div>

                {isLoading && (
                  <div className="text-center py-8">
                    <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-500 mt-2">Loading subjects...</p>
                  </div>
                )}

                {!isLoading && availableSubjects.length > 0 && (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Available Subjects for Class {selectedClass}
                      </h2>
                      <button
                        onClick={handleSelectAll}
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedSubjects.length === availableSubjects.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 mb-8">
                      {/* Core Subjects */}
                      {availableSubjects.filter(s => s.category === 'core').length > 0 && (
                        <div>
                          <h3 className="text-md font-semibold text-blue-600 dark:text-blue-400 mb-2">Core Subjects</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableSubjects.filter(s => s.category === 'core').map(subject => (
                              <label key={subject._id} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedSubjects.includes(subject._id)}
                                  onChange={() => handleSubjectToggle(subject._id)}
                                  className="h-4 w-4 text-primary focus:ring-primary border-zinc-300 rounded"
                                />
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">{subject.name}</p>
                                  <p className="text-xs text-zinc-500">Code: {subject.code}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Languages */}
                      {availableSubjects.filter(s => s.category === 'language').length > 0 && (
                        <div>
                          <h3 className="text-md font-semibold text-green-600 dark:text-green-400 mb-2">Languages</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableSubjects.filter(s => s.category === 'language').map(subject => (
                              <label key={subject._id} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedSubjects.includes(subject._id)}
                                  onChange={() => handleSubjectToggle(subject._id)}
                                  className="h-4 w-4 text-primary focus:ring-primary border-zinc-300 rounded"
                                />
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">{subject.name}</p>
                                  <p className="text-xs text-zinc-500">Code: {subject.code}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Elective Subjects */}
                      {availableSubjects.filter(s => s.category === 'elective').length > 0 && (
                        <div>
                          <h3 className="text-md font-semibold text-purple-600 dark:text-purple-400 mb-2">Elective Subjects</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableSubjects.filter(s => s.category === 'elective').map(subject => (
                              <label key={subject._id} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedSubjects.includes(subject._id)}
                                  onChange={() => handleSubjectToggle(subject._id)}
                                  className="h-4 w-4 text-primary focus:ring-primary border-zinc-300 rounded"
                                />
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">{subject.name}</p>
                                  <p className="text-xs text-zinc-500">Code: {subject.code}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Selected Summary */}
                    <div className="mb-6 p-4 bg-primary/5 rounded-lg">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Selected Subjects</h3>
                      <div className="flex flex-wrap gap-2">
                        {availableSubjects
                          .filter(s => selectedSubjects.includes(s._id))
                          .map(subject => (
                            <span key={subject._id} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              {subject.name}
                            </span>
                          ))}
                        {selectedSubjects.length === 0 && (
                          <p className="text-sm text-zinc-500">No subjects selected</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={handleCancel}
                        className="px-6 py-2.5 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving || selectedSubjects.length === 0}
                        className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : 'Save Subjects for Class'}
                      </button>
                    </div>
                  </>
                )}

                {!isLoading && availableSubjects.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-zinc-500">No subjects available for Class {selectedClass}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddSubjects;