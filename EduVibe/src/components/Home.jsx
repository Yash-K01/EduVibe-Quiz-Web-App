import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  // Header Component
  const Header = () => {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-10 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-slate-900">
                <span className="material-symbols-outlined text-2xl">auto_stories</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">EduVibe</h2>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              aria-label="Toggle theme" 
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
              onClick={toggleTheme}
            >
              <span className="material-symbols-outlined theme-toggle-light">light_mode</span>
              <span className="material-symbols-outlined theme-toggle-dark text-primary">dark_mode</span>
            </button>
            
            <Link
              to="/admin-register"
              className="hidden sm:flex items-center justify-center rounded-lg h-10 px-5 text-sm font-semibold transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              Admin Registration
            </Link>
            
            <div className="relative group">
              <button
                className="flex items-center justify-center rounded-lg h-10 px-5 bg-primary text-slate-900 text-sm font-bold shadow-sm transition-transform active:scale-95 hover:bg-green-500 hover:scale-105 gap-1"
              >
                Login
                <span className="material-symbols-outlined text-base">arrow_drop_down</span>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link
                  to="/admin-login"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                  Admin Login
                </Link>
                
                <Link
                  to="/teacher-login"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">school</span>
                  Teacher Login
                </Link>
                
                <Link
                  to="/student-login"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">person</span>
                  Student Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  };

  // Hero Component
  const Hero = () => {
    return (
      <section className="relative px-6 py-20 md:py-32 lg:py-40 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center z-10 flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-slate-900 dark:text-primary text-sm font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-base">verified</span>
            NCERT Aligned Curriculum (Grades 6-12)
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight text-slate-900 dark:text-white">
            Master the <span className="text-primary">NCERT</span> <br className="hidden md:block"/> Curriculum.
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            The ultimate quiz platform for grades 6-12. Empowering teachers to assess student understanding topic-by-topic with data-driven insights.
          </p>
          
          <div className="mt-8 flex items-center gap-4 text-slate-400 dark:text-slate-600">
            <div className="h-px w-12 bg-current"></div>
            <span className="text-sm font-medium uppercase tracking-widest">Designed for Excellence</span>
            <div className="h-px w-12 bg-current"></div>
          </div>
        </div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10"></div>
      </section>
    );
  };

  // Features Component
  const Features = () => {
    const features = [
      {
        icon: "school",
        title: "NCERT Aligned",
        description: "Expert-curated question banks covering every chapter and learning objective for grades 6 through 12."
      },
      {
        icon: "quiz",
        title: "Topic-wise Quizzes",
        description: "Don't wait for final exams. Assess understanding immediately after every topic with targeted micro-quizzes."
      },
      {
        icon: "monitoring",
        title: "Instant Analytics",
        description: "Real-time performance dashboards. Identify learning gaps and track individual student growth over time."
      }
    ];

    return (
      <section className="bg-white dark:bg-slate-900/50 py-24 px-6 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Empowering Educators Worldwide
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Specifically designed to meet the rigorous standards of the NCERT curriculum from middle school to high school.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark hover:border-primary/50 transition-colors group">
                <div className="size-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-slate-900 transition-colors">
                  <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // CTA Component
  const CTA = () => {
    return (
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto rounded-3xl bg-slate-900 dark:bg-primary/10 p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-6">
            <h2 className="text-3xl md:text-5xl font-black text-white dark:text-white tracking-tight">
              Ready to transform your classroom?
            </h2>
            
            <p className="text-slate-300 dark:text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed">
              Join thousands of teachers using EduVibe for smarter, faster, and more effective student assessments.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link
                to="/admin-register"
                className="flex items-center justify-center rounded-xl h-14 px-10 bg-primary text-slate-900 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
              >
                Register as Admin
              </Link>
              
              <Link
                to="/contact"
                className="flex items-center justify-center rounded-xl h-14 px-10 bg-white/10 text-white text-lg font-bold hover:bg-white/20 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Footer Component
  const Footer = () => {
    return (
      <footer className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full gap-8 text-center md:text-left">
            
            <div className="flex flex-col gap-4 items-center md:items-start">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-8 rounded bg-primary text-slate-900">
                  <span className="material-symbols-outlined text-xl">auto_stories</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">EduVibe</h2>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs">
                The smartest way to master the NCERT curriculum for modern classrooms.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-slate-900 dark:text-white">Contact Us</h4>
              <div className="flex flex-col gap-3 items-center md:items-start text-slate-600 dark:text-slate-400">
                <a className="flex items-center gap-2 hover:text-primary transition-colors" href="tel:+15550000000">
                  <span className="material-symbols-outlined text-sm">call</span>
                  +1 (555) 000-0000
                </a>
                <a className="flex items-center gap-2 hover:text-primary transition-colors" href="mailto:support@eduvibe.com">
                  <span className="material-symbols-outlined text-sm">mail</span>
                  support@eduvibe.com
                </a>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 items-center md:items-start">
              <h4 className="font-bold text-slate-900 dark:text-white">Follow Us</h4>
              <div className="flex gap-4">
                <a className="size-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-primary/10 transition-colors text-slate-600 dark:text-slate-400" href="#">
                  <svg className="size-5 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8z"></path>
                  </svg>
                </a>
                
                <a className="size-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-primary/10 transition-colors text-slate-600 dark:text-slate-400" href="#">
                  <svg className="size-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                  </svg>
                </a>
                
                <a className="size-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-primary/10 transition-colors text-slate-600 dark:text-slate-400" href="#">
                  <svg className="size-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a2.7 2.7 0 00-2.7-2.7c-1.1 0-2.1.6-2.6 1.5v-1.3H10v7.8h3v-4.1c0-.7.6-1.3 1.3-1.3.7 0 1.3.6 1.3 1.3v4.1h3.1m-10.4-9.3c.9 0 1.6-.7 1.6-1.6 0-.9-.7-1.6-1.6-1.6-.9 0-1.6.7-1.6 1.6 0 .9.7 1.6 1.6 1.6M8.5 18.5v-7.8h-3v7.8h3z"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="w-full pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-500">
            <p>Copyright © 2023 EduVibe. All rights reserved. Designed for NCERT educational excellence.</p>
          </div>
        </div>
      </footer>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      
      <main className="flex-1 pt-20">
        <Hero />
        <Features />
        <CTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;