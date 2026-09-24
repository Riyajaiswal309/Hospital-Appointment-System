import { Link } from 'react-router-dom';
import { Stethoscope, Calendar, Shield, Heart, ArrowRight, Star, Clock, Users } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg">MediBook</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Sign In
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium text-white bg-teal-600 px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 lg:pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-sm font-medium mb-6">
              <Heart className="w-4 h-4" />
              Trusted by 10,000+ patients
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
              Book appointments with top doctors, anytime.
            </h1>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              Find specialists across cardiology, neurology, pediatrics, and more.
              Manage your health records, prescriptions, and payments all in one place.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors"
              >
                Find a Doctor
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center border border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
            <div className="mt-10 flex gap-8">
              <div>
                <p className="text-2xl font-bold text-slate-900">500+</p>
                <p className="text-sm text-slate-500">Doctors</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">10k+</p>
                <p className="text-sm text-slate-500">Patients</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">50+</p>
                <p className="text-sm text-slate-500">Specialties</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-teal-100 to-blue-100">
              <img
                src="https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Doctor consultation"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-lg p-4 hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Secure & Private</p>
                  <p className="text-xs text-slate-500">Your data is protected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Everything you need for better healthcare
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            From booking appointments to managing prescriptions, we have got you covered.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Calendar, title: 'Easy Booking', desc: 'Search and book appointments with available doctors in seconds.' },
              { icon: Clock, title: 'Flexible Slots', desc: 'Choose from multiple time slots that fit your schedule.' },
              { icon: Users, title: 'For Everyone', desc: 'Patients, doctors, and admins each get a tailored experience.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="bg-teal-600 rounded-3xl p-8 lg:p-12 text-center">
          <Star className="w-10 h-10 text-white mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-3">Ready to take control of your health?</h2>
          <p className="text-teal-50 mb-6 max-w-xl mx-auto">
            Join thousands of patients who manage their healthcare journey with MediBook.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-teal-700 px-6 py-3 rounded-xl font-medium hover:bg-teal-50 transition-colors"
          >
            Get Started Today
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <p className="text-sm text-slate-500">© 2026 MediBook. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
