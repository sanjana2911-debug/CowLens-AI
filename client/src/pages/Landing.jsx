import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  HiHeart, HiClipboardList, HiBeaker, HiShieldCheck, HiChartBar,
  HiSparkles, HiArrowRight, HiChat, HiQrcode, HiLocationMarker,
} from 'react-icons/hi';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const featureCards = useMemo(() => [
    { icon: HiHeart, title: 'Herd Management', desc: 'Track all your cows with detailed profiles, medical history, and identification.', color: 'text-primary-600', bg: 'bg-primary-100' },
    { icon: HiClipboardList, title: 'Health Records', desc: 'Maintain comprehensive health records including checkups, treatments, and medications.', color: 'text-blue-600', bg: 'bg-blue-100' },
    { icon: HiBeaker, title: 'AI Diagnosis', desc: 'Get AI-powered preliminary diagnoses based on symptoms and health data.', color: 'text-purple-600', bg: 'bg-purple-100' },
    { icon: HiShieldCheck, title: 'Vaccination Tracking', desc: 'Never miss a vaccination with automated schedules and reminders.', color: 'text-green-600', bg: 'bg-green-100' },
    { icon: HiChat, title: 'AI Chat Assistant', desc: 'Ask health questions and get instant AI-powered responses.', color: 'text-blue-600', bg: 'bg-blue-100' },
    { icon: HiChartBar, title: 'Milk Production', desc: 'Track daily milk yield with beautiful charts and analytics.', color: 'text-amber-600', bg: 'bg-amber-100' },
    { icon: HiQrcode, title: 'QR Passport', desc: 'Generate digital health passports with QR codes for quick access.', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { icon: HiLocationMarker, title: 'Nearby Vets', desc: 'Find veterinary clinics near your location instantly.', color: 'text-red-600', bg: 'bg-red-100' },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">🐄</span>
              <span className="text-xl font-bold text-primary-700">
                CowLens <span className="text-primary-500">AI</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary flex items-center gap-2">
                  Dashboard <HiArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary">Sign In</Link>
                  <Link to="/register" className="btn-primary">Get Started Free</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <HiSparkles className="w-4 h-4" />
              AI-Powered Cattle Management Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Smart Cattle Management{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-emerald-500">with AI</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Track your herd's health, vaccinations, and medical records all in one place.
              Powered by advanced AI for smarter livestock management.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
                  Go to Dashboard <HiArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg px-8 py-3 shadow-lg shadow-primary-200">
                    Start Free Trial
                  </Link>
                  <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                    Watch Demo
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '98%', label: 'Diagnosis Accuracy' },
            { value: '10K+', label: 'Cows Tracked' },
            { value: '500+', label: 'Veterinarians' },
            { value: '24/7', label: 'AI Support' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
              className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <p className="text-3xl font-bold text-primary-600">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Everything You Need</h2>
          <p className="text-gray-500 mt-2">Comprehensive tools for modern cattle management</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureCards.map((feature, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}
              className="card hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
              <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-primary-600 to-emerald-600 rounded-3xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Herd Management?</h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">Join thousands of farmers using AI-powered insights for better cattle health and productivity.</p>
          {isAuthenticated ? (
            <Link to="/dashboard" className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-lg">
              Go to Dashboard <HiArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-lg">
              Get Started Free <HiArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl">🐄</span>
              <span className="font-bold text-primary-700">CowLens <span className="text-primary-500">AI</span></span>
            </Link>
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} CowLens AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;