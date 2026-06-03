const mongoose = require('mongoose');
const NCERTSubject = require('./models/NCERTSubject');

const ncertSubjectsData = [
  // Core Subjects
  { name: 'Mathematics', code: 'MAT', classes: [6,7,8,9,10,11,12], category: 'core' },
  { name: 'Science', code: 'SCI', classes: [6,7,8,9,10], category: 'core' },
  { name: 'Physics', code: 'PHY', classes: [11,12], category: 'core' },
  { name: 'Chemistry', code: 'CHE', classes: [11,12], category: 'core' },
  { name: 'Biology', code: 'BIO', classes: [11,12], category: 'core' },
  { name: 'Social Science', code: 'SST', classes: [6,7,8,9,10], category: 'core' },
  { name: 'History', code: 'HIS', classes: [11,12], category: 'core' },
  { name: 'Geography', code: 'GEO', classes: [11,12], category: 'core' },
  { name: 'Political Science', code: 'POL', classes: [11,12], category: 'core' },
  { name: 'Economics', code: 'ECO', classes: [11,12], category: 'core' },
  
  // Languages
  { name: 'English', code: 'ENG', classes: [6,7,8,9,10,11,12], category: 'language' },
  { name: 'Hindi', code: 'HIN', classes: [6,7,8,9,10,11,12], category: 'language' },
  { name: 'Sanskrit', code: 'SAN', classes: [6,7,8,9,10,11,12], category: 'language' },
  { name: 'Urdu', code: 'URD', classes: [6,7,8,9,10,11,12], category: 'language' },
  
  // Elective Subjects for Classes 9-12
  { name: 'Information Technology', code: 'IT', classes: [9,10,11,12], category: 'elective' },
  { name: 'Artificial Intelligence', code: 'AI', classes: [9,10,11,12], category: 'elective' },
  { name: 'Computer Science', code: 'CS', classes: [11,12], category: 'elective' },
  { name: 'Physical Education', code: 'PE', classes: [9,10,11,12], category: 'elective' },
  { name: 'Fine Arts', code: 'ART', classes: [9,10,11,12], category: 'elective' },
  { name: 'Music', code: 'MUS', classes: [9,10,11,12], category: 'elective' },
  { name: 'Dance', code: 'DAN', classes: [9,10,11,12], category: 'elective' },
  { name: 'Home Science', code: 'HSC', classes: [9,10,11,12], category: 'elective' },
  { name: 'Accountancy', code: 'ACC', classes: [11,12], category: 'elective' },
  { name: 'Business Studies', code: 'BS', classes: [11,12], category: 'elective' },
  { name: 'Entrepreneurship', code: 'ENT', classes: [11,12], category: 'elective' },
  { name: 'Psychology', code: 'PSY', classes: [11,12], category: 'elective' },
  { name: 'Sociology', code: 'SOC', classes: [11,12], category: 'elective' },
];

async function seedNCERTSubjects() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/EduVibe');
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await NCERTSubject.deleteMany({});
    console.log('Cleared existing subjects');
    
    // Insert new data
    const result = await NCERTSubject.insertMany(ncertSubjectsData);
    console.log(`Inserted ${result.length} NCERT subjects`);
    
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedNCERTSubjects();