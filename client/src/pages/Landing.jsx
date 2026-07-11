import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiHeart,
  HiClipboardList,
  HiBeaker,
  HiShieldCheck,
} from 'react-icons/hi';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🐄</span>
              <span className="text-xl font-bold text-primary-700">
                CowLens <span className="text-primary-500">AI</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Smart Cattle Management{' '}
            <span className="text-primary-600">with AI</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            Track your herd's health, vaccinations, and medical records all in one place.
            AI-powered insights for better cattle management.
          </p>
          <div className="flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-lg px-8 py-3">
                  Start Free Trial
                </Link>
                <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: HiHeart,
              title: 'Herd Management',
              desc: 'Track all your cows with detailed profiles, medical history, and identification.',
            },
            {
              icon: HiClipboardList,
              title: 'Health Records',
              desc: 'Maintain comprehensive health records including checkups, treatments, and medications.',
            },
            {
              icon: HiBeaker,
              title: 'AI Diagnosis',
              desc: 'Get AI-powered preliminary diagnoses based on symptoms and health data.',
            },
            {
              icon: HiShieldCheck,
              title: 'Vaccination Tracking',
              desc: 'Never miss a vaccination with automated schedules and reminders.',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} CowLens AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;