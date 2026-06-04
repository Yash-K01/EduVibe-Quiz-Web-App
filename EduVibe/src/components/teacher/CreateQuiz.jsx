import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateQuiz = () => {
  const [teacherData, setTeacherData] = useState(null);
  const [classWiseSubjects, setClassWiseSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [quizzes, setQuizzes] = useState({});
  const [editingQuiz, setEditingQuiz] = useState(null);
  
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    subjectId: '',
    subjectName: '',
    className: '',
    totalQuestions: 0,
    duration: 60,
    questions: []
  });
  
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctOption: 0,
    marks: 1
  });
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionsList, setQuestionsList] = useState([]);
  const [step, setStep] = useState(1); // 1: select no of questions, 2: add questions
  const [totalQuestionsInput, setTotalQuestionsInput] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');

    if (!token || userType !== 'teacher') {
      navigate('/teacher-login');
      return;
    }

    fetchTeacherData();
  }, [navigate]);

  const fetchTeacherData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const parsedUser = JSON.parse(user);
      
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const response = await api.get(`/teachers/${parsedUser._id}`);
      
      if (response.data.success) {
        const teacher = response.data.data;
        setTeacherData(teacher);
        
        // Group subjects by class
        const subjectsByClass = {};
        teacher.subjects?.forEach(subject => {
          const className = subject.className;
          if (!subjectsByClass[className]) {
            subjectsByClass[className] = [];
          }
          subjectsByClass[className].push(subject);
        });
        
        const grouped = Object.keys(subjectsByClass).map(className => ({
          className: parseInt(className),
          subjects: subjectsByClass[className]
        }));
        
        setClassWiseSubjects(grouped);
        
        // Fetch existing quizzes for each subject
        await fetchQuizzesForSubjects(teacher._id);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuizzesForSubjects = async (teacherId) => {
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const response = await api.get('/quizzes/teacher', { params: { teacherId } });
      const allQuizzes = response.data.data || [];
      
      // Group quizzes by subject
      const quizzesBySubject = {};
      allQuizzes.forEach(quiz => {
        const key = `${quiz.subjectName}_${quiz.className}`;
        if (!quizzesBySubject[key]) {
          quizzesBySubject[key] = [];
        }
        quizzesBySubject[key].push(quiz);
      });
      
      setQuizzes(quizzesBySubject);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const handleCreateQuiz = (subject, className) => {
    setSelectedSubject(subject);
    setSelectedClass(className);
    setQuizData({
      title: '',
      description: '',
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      className: className,
      totalQuestions: 0,
      duration: 60,
      startDate: '',
      endDate: '',
      questions: []
    });
    setQuestionsList([]);
    setTotalQuestionsInput(0);
    setStep(1);
    setEditingQuiz(null);
    setShowQuizForm(true);
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizData({
      title: quiz.title,
      description: quiz.description,
      subjectId: quiz.subjectId,
      subjectName: quiz.subjectName,
      className: quiz.className,
      totalQuestions: quiz.questions?.length || 0,
      duration: quiz.duration,
      startDate: quiz.startDate?.split('T')[0] || '',
      endDate: quiz.endDate?.split('T')[0] || '',
      questions: quiz.questions || []
    });
    setQuestionsList(quiz.questions || []);
    setTotalQuestionsInput(quiz.questions?.length || 0);
    setStep(2);
    setShowQuizForm(true);
  };

  const handleTotalQuestionsSubmit = () => {
    if (totalQuestionsInput < 1) {
      setApiError('Please enter at least 1 question');
      return;
    }
    setQuizData({ ...quizData, totalQuestions: totalQuestionsInput });
    setQuestionsList([]);
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctOption: 0,
      marks: 1
    });
    setCurrentQuestionIndex(0);
    setStep(2);
    setApiError('');
  };

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion({ ...currentQuestion, [field]: value });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addQuestion = () => {
    if (!currentQuestion.text.trim()) {
      setApiError('Please enter question text');
      return;
    }
    if (currentQuestion.options.some(opt => !opt.trim())) {
      setApiError('Please fill all 4 options');
      return;
    }
    
    setQuestionsList([...questionsList, { ...currentQuestion}]);
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctOption: 0,
      marks: 1
    });
    
    if (currentQuestionIndex + 1 === totalQuestionsInput) {
      // All questions added
      setQuizData({ ...quizData, questions: [...questionsList, currentQuestion] });
      setStep(3);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
    setApiError('');
  };

  const handleSubmitQuiz = async () => {
    if (!quizData.title.trim()) {
      setApiError('Please enter quiz title');
      return;
    }
// Date validation removed - using system date only
// Quiz will be created with current system date
    
    setIsSubmitting(true);
    setApiError('');
    
    try {
      const token = localStorage.getItem('token');
      const api = axios.create({
        baseURL: 'https://eduvibe-quiz-web-app.onrender.com/api',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      const finalQuizData = {
        ...quizData,
        questions: questionsList,
        teacherId: teacherData?._id,
        teacherName: teacherData?.teacherName,
        isPublished: false
      };
      
      let response;
      if (editingQuiz) {
        response = await api.put(`/quizzes/${editingQuiz._id}`, finalQuizData);
      } else {
        response = await api.post('/quizzes/create', finalQuizData);
      }
      
      if (response.data.success) {
        setSuccessMessage(editingQuiz ? 'Quiz updated successfully!' : 'Quiz created successfully!');
        setTimeout(() => {
          setShowQuizForm(false);
          setSuccessMessage('');
          fetchQuizzesForSubjects(teacherData?._id);
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      setApiError(error.response?.data?.message || 'Failed to save quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuizCount = (subjectName, className) => {
    const key = `${subjectName}_${className}`;
    return quizzes[key]?.length || 0;
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-b border-primary/10 py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-primary transition-colors">
            <span className="material-icons text-2xl">arrow_back</span>
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined theme-toggle-light">light_mode</span>
              <span className="material-symbols-outlined theme-toggle-dark text-primary">dark_mode</span>
            </button>
            <button onClick={handleLogout} className="flex items-center justify-center rounded-lg h-10 px-5 bg-red-500 text-white text-sm font-bold shadow-sm hover:bg-red-600 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow px-4 py-12 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create Quiz</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Create quizzes for your subjects and classes</p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}

          <div className="space-y-6">
            {classWiseSubjects.map((classItem, idx) => (
              <div key={idx} className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="bg-primary/10 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Class {classItem.className}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {classItem.subjects.map((subject, subIdx) => {
                    const quizCount = getQuizCount(subject.subjectName, classItem.className);
                    return (
                      <div key={subIdx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">quiz</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{subject.subjectName}</h3>
                            <p className="text-xs text-slate-500">Total Quizzes: {quizCount}</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleCreateQuiz(subject, classItem.className)}
                          className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          + Create New Quiz
                        </button>
                        
                        {quizzes[`${subject.subjectName}_${classItem.className}`]?.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-medium text-slate-500">Created Quizzes:</p>
                            {quizzes[`${subject.subjectName}_${classItem.className}`].map((quiz, qIdx) => (
                              <div key={qIdx} className="flex items-center justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <span className="truncate flex-1">{quiz.title}</span>
                                {!quiz.isPublished && (
                                  <button
                                    onClick={() => handleEditQuiz(quiz)}
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                  >
                                    <span className="material-symbols-outlined text-base">edit</span>
                                  </button>
                                )}
                                {quiz.isPublished && (
                                  <span className="text-xs text-green-600">Published</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Create/Edit Quiz Modal */}
      {showQuizForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'} - {selectedSubject?.subjectName} (Class {selectedClass})
                </h2>
                <button onClick={() => setShowQuizForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <span className="material-icons">close</span>
                </button>
              </div>

              {apiError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {apiError}
                </div>
              )}

            {step === 1 && (
            <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium mb-1">Quiz Title</label>
                <input
                    type="text"
                    value={quizData.title}
                    onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="e.g., Mathematics Chapter 1 Test"
                />
                </div>
                <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                    value={quizData.description}
                    onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows="3"
                    placeholder="Quiz description"
                />
                </div>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                    <input
                    type="number"
                    value={quizData.duration}
                    onChange={(e) => setQuizData({ ...quizData, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                    min="1"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Number of Questions</label>
                    <input
                    type="number"
                    value={totalQuestionsInput}
                    onChange={(e) => setTotalQuestionsInput(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg"
                    min="1"
                    max="50"
                    />
                </div>
                </div>
                <div>
                <label className="block text-sm font-medium mb-1">Created On</label>
                <input
                    type="text"
                    value={new Date().toLocaleDateString()}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400"
                />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowQuizForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={handleTotalQuestionsSubmit} className="px-4 py-2 bg-primary text-white rounded-lg">Next: Add Questions</button>
                </div>
            </div>
            )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <p className="text-sm">Question {currentQuestionIndex + 1} of {totalQuestionsInput}</p>
                    <p className="text-xs text-slate-500">Marks per question: {currentQuestion.marks}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Question Text</label>
                    <textarea
                      value={currentQuestion.text}
                      onChange={(e) => handleQuestionChange('text', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows="3"
                      placeholder="Enter question here..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Options</label>
                    {currentQuestion.options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-2">
                        <span className="w-8 text-sm font-medium">{String.fromCharCode(65 + idx)}.</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          className="flex-1 px-4 py-2 border rounded-lg"
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        />
                        <input
                          type="radio"
                          name="correctOption"
                          checked={currentQuestion.correctOption === idx}
                          onChange={() => handleQuestionChange('correctOption', idx)}
                          className="h-4 w-4"
                        />
                        <span className="text-xs">Correct</span>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Marks</label>
                    <input
                      type="number"
                      value={currentQuestion.marks}
                      onChange={(e) => handleQuestionChange('marks', parseInt(e.target.value))}
                      className="w-32 px-4 py-2 border rounded-lg"
                      min="1"
                    />
                  </div>
                  
                  <div className="flex justify-between gap-3 pt-4">
                    <button onClick={() => setShowQuizForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                    <button onClick={addQuestion} className="px-4 py-2 bg-primary text-white rounded-lg">
                      {currentQuestionIndex + 1 === totalQuestionsInput ? 'Finish & Review' : 'Next Question'}
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-700">✓ All questions added successfully!</p>
                    <p className="text-sm text-slate-600 mt-2">Total Questions: {questionsList.length}</p>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {questionsList.map((q, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <p className="font-medium">Q{idx + 1}. {q.text}</p>
                        <div className="ml-4 mt-2 text-sm">
                          {q.options.map((opt, optIdx) => (
                            <p key={optIdx} className={optIdx === q.correctOption ? 'text-green-600 font-medium' : ''}>
                              {String.fromCharCode(65 + optIdx)}. {opt} {optIdx === q.correctOption && '(Correct)'}
                            </p>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Marks: {q.marks}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button onClick={() => setStep(2)} className="px-4 py-2 border rounded-lg">Back</button>
                    <button onClick={handleSubmitQuiz} disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
                      {isSubmitting ? 'Saving...' : editingQuiz ? 'Update Quiz' : 'Create Quiz'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateQuiz;