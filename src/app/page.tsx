'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { 
  ArrowRight, 
  Check, 
  Brain,
  MapPin,
  Camera,
  Users,
  Menu,
  X,
  Star,
  Shield,
  Zap,
  Globe,
  Award,
  TrendingUp,
  ChevronRight,
  Play,
  Building2,
  MessageSquare,
  BarChart3,
  Quote
} from 'lucide-react'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-lg border-b border-tan-200/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg bg-white">
                <Image
                  src="/beaver-samples/LOGO.png"
                  alt="HostBuddies logo"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
              <span className="text-2xl font-bold text-charcoal-900">
                HostBuddies
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-charcoal-700 hover:text-charcoal-900 transition-colors font-medium">
                Features
              </Link>
              <Link href="#pricing" className="text-charcoal-700 hover:text-charcoal-900 transition-colors font-medium">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-charcoal-700 hover:text-charcoal-900 transition-colors font-medium">
                Reviews
              </Link>
              <Link href="#contact" className="text-charcoal-700 hover:text-charcoal-900 transition-colors font-medium">
                Contact
              </Link>
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="text-charcoal-700 hover:text-charcoal-900 transition-colors font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/guest/session-123"
                  className="inline-flex items-center px-6 py-2.5 bg-charcoal-900 text-cream-50 rounded-xl font-semibold hover:bg-charcoal-800 hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Try Demo
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-charcoal-700 hover:text-charcoal-900 p-2 rounded-lg"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-tan-200">
              <div className="flex flex-col space-y-4">
                <Link href="#features" className="text-charcoal-700 hover:text-charcoal-900 transition-colors font-medium">
                  Features
                </Link>
                <Link href="#pricing" className="text-charcoal-700 hover:text-charcoal-900 transition-colors font-medium">
                  Pricing
                </Link>
                <Link href="#testimonials" className="text-charcoal-700 hover:text-charcoal-900 transition-colors font-medium">
                  Reviews
                </Link>
                <Link href="#contact" className="text-charcoal-700 hover:text-charcoal-900 transition-colors font-medium">
                  Contact
                </Link>
                <div className="pt-4 space-y-3">
                  <Link
                    href="/auth/login"
                    className="block text-center px-6 py-2.5 border border-tan-300 text-charcoal-700 rounded-xl font-semibold hover:bg-tan-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/guest/session-123"
                    className="block text-center px-6 py-2.5 bg-charcoal-900 text-cream-50 rounded-xl font-semibold hover:bg-charcoal-800 transition-colors"
                  >
                    Try Demo
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream-100 via-cream-50 to-cream-200">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-tan-100 text-tan-800 rounded-full text-sm font-semibold">
                  <Brain className="w-4 h-4 mr-2" />
                  AI-Powered Airbnb Consultant
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-charcoal-900 leading-tight">
                  Optimize Your
                  <span className="text-charcoal-900 block">
                    Airbnb Listings
                  </span>
                </h1>
                <p className="text-xl text-charcoal-600 leading-relaxed">
                  Our trained AI model analyzes your market, scans similar listings, and provides 
                  professional recommendations to boost your visibility, bookings, and revenue.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center px-8 py-4 bg-charcoal-900 text-cream-50 rounded-xl font-semibold text-lg hover:bg-charcoal-800 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="#demo"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-tan-300 text-charcoal-700 rounded-xl font-semibold text-lg hover:border-tan-400 hover:bg-tan-50 transition-all duration-300"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Link>
              </div>

              <div className="flex items-center space-x-8 text-sm text-charcoal-500">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-gold-600 mr-2" />
                  No setup fees
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-gold-600 mr-2" />
                  14-day free trial
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-gold-600 mr-2" />
                  Cancel anytime
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-charcoal-900 rounded-3xl blur-2xl opacity-10"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-tan-200">
                <div className="aspect-[4/5] bg-gradient-to-br from-tan-100 to-cream-200 rounded-2xl flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-charcoal-900 rounded-2xl flex items-center justify-center mx-auto">
                      <BarChart3 className="w-12 h-12 text-cream-50" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-charcoal-900">AI Analysis Demo</h3>
                      <p className="text-charcoal-600">See market insights in action</p>
                    </div>
                    <Link
                      href="/guest/session-123"
                      className="inline-flex items-center px-6 py-3 bg-charcoal-900 text-cream-50 rounded-xl font-semibold hover:bg-charcoal-800 hover:shadow-lg transition-all duration-300"
                    >
                      Try Now
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-charcoal-900 text-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold mb-2">10K+</div>
              <div className="text-cream-300">Properties Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold mb-2">45%</div>
              <div className="text-cream-300">Average Revenue Boost</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold mb-2">2M+</div>
              <div className="text-cream-300">Listings Scanned</div>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold mb-2">92%</div>
              <div className="text-cream-300">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-charcoal-900">
              AI-Powered
              <span className="text-charcoal-900"> Optimization</span>
            </h2>
            <p className="text-xl text-charcoal-600 max-w-3xl mx-auto">
              Advanced AI technology that analyzes your market and provides professional consulting to maximize your Airbnb success
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl border border-tan-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-charcoal-900 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-cream-50" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal-900 mb-4">Market Analysis AI</h3>
              <p className="text-charcoal-600 mb-6 leading-relaxed">
                Our trained AI scans thousands of similar listings in your area to identify optimization opportunities and market trends.
              </p>
              <ul className="space-y-2 text-sm text-charcoal-600">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-gold-600 mr-2" />
                  Competitor analysis
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-gold-600 mr-2" />
                  Pricing optimization
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-gold-600 mr-2" />
                  Market trend insights
                </li>
              </ul>
            </div>

            <div className="group p-8 rounded-2xl border border-tan-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-charcoal-900 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-cream-50" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal-900 mb-4">Listing Optimization</h3>
              <p className="text-charcoal-600 mb-6 leading-relaxed">
                Get AI-powered suggestions for title optimization, description improvements, and keyword strategies to boost visibility.
              </p>
              <ul className="space-y-2 text-sm text-charcoal-600">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-gold-600 mr-2" />
                  Title optimization
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-gold-600 mr-2" />
                  SEO keyword analysis
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-gold-600 mr-2" />
                  Description enhancement
                </li>
              </ul>
            </div>

            <div className="group p-8 rounded-2xl border border-tan-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-charcoal-900 rounded-xl flex items-center justify-center mb-6">
                <Award className="w-6 h-6 text-cream-50" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal-900 mb-4">Professional Recommendations</h3>
              <p className="text-charcoal-600 mb-6 leading-relaxed">
                Receive data-driven suggestions like "Similar properties with hot tubs see 35% more bookings" to guide your investments.
              </p>
              <ul className="space-y-2 text-sm text-charcoal-600">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-gold-600 mr-2" />
                  Amenity recommendations
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-gold-600 mr-2" />
                  Revenue impact analysis
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-gold-600 mr-2" />
                  Investment ROI predictions
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-cream-50 to-tan-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-charcoal-900">
              Trusted by smart hosts
            </h2>
            <p className="text-xl text-charcoal-600 max-w-3xl mx-auto">
              See how our AI-powered insights have transformed Airbnb businesses across the globe
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <Quote className="w-8 h-8 text-charcoal-600 mb-4" />
              <p className="text-charcoal-700 mb-6 leading-relaxed">
                "The AI recommended adding a hot tub based on market analysis. I invested $8K and bookings increased 40% within 2 months. ROI was incredible!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-charcoal-900 rounded-full flex items-center justify-center text-cream-50 font-bold mr-4">
                  S
                </div>
                <div>
                  <div className="font-semibold text-charcoal-900">Sarah Johnson</div>
                  <div className="text-charcoal-600 text-sm">Superhost, San Francisco</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <Quote className="w-8 h-8 text-charcoal-600 mb-4" />
              <p className="text-charcoal-700 mb-6 leading-relaxed">
                "HostBuddies analyzed my listing title and suggested keyword changes. My visibility increased 60% and I'm now ranking #3 in my area!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-charcoal-900 rounded-full flex items-center justify-center text-cream-50 font-bold mr-4">
                  M
                </div>
                <div>
                  <div className="font-semibold text-charcoal-900">Michael Chen</div>
                  <div className="text-charcoal-600 text-sm">Property Manager, NYC</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <Quote className="w-8 h-8 text-charcoal-600 mb-4" />
              <p className="text-charcoal-700 mb-6 leading-relaxed">
                "The market analysis showed similar properties with pools get 50% more bookings. I installed one and revenue doubled this season!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-charcoal-900 rounded-full flex items-center justify-center text-cream-50 font-bold mr-4">
                  E
                </div>
                <div>
                  <div className="font-semibold text-charcoal-900">Emma Rodriguez</div>
                  <div className="text-charcoal-600 text-sm">Boutique Host, Miami</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-charcoal-900">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-charcoal-600 max-w-3xl mx-auto">
              Choose the perfect plan for your hosting business. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-2xl border border-tan-200 hover:border-slate-300 transition-all duration-300">
              <div className="text-center space-y-4 mb-8">
                <h3 className="text-2xl font-bold text-charcoal-900">Starter</h3>
                <div className="text-4xl font-bold text-charcoal-900">
                  $29<span className="text-lg text-charcoal-600">/month</span>
                </div>
                <p className="text-charcoal-600">Perfect for new hosts</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-600 mr-3" />
                  <span>AI analysis for 1 property</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-600 mr-3" />
                  <span>Basic market insights</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-600 mr-3" />
                  <span>Email support</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-600 mr-3" />
                  <span>Basic analytics</span>
                </li>
              </ul>
              <Link
                href="/auth/signup"
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-tan-300 text-charcoal-700 rounded-xl font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
              >
                Start Free Trial
              </Link>
            </div>

            <div className="relative p-8 rounded-2xl bg-charcoal-900 text-cream-50 transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center space-y-4 mb-8">
                <h3 className="text-2xl font-bold">Professional</h3>
                <div className="text-4xl font-bold">
                  $79<span className="text-lg opacity-80">/month</span>
                </div>
                <p className="opacity-80">For growing hosts</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-400 mr-3" />
                  <span>AI analysis for 5 properties</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-400 mr-3" />
                  <span>Advanced market insights</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-400 mr-3" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-400 mr-3" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-400 mr-3" />
                  <span>Listing optimization tools</span>
                </li>
              </ul>
              <Link
                href="/auth/signup"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-white text-charcoal-600 rounded-xl font-semibold hover:bg-tan-50 transition-all duration-300"
              >
                Start Free Trial
              </Link>
            </div>

            <div className="p-8 rounded-2xl border border-tan-200 hover:border-slate-300 transition-all duration-300">
              <div className="text-center space-y-4 mb-8">
                <h3 className="text-2xl font-bold text-charcoal-900">Enterprise</h3>
                <div className="text-4xl font-bold text-charcoal-900">
                  $199<span className="text-lg text-charcoal-600">/month</span>
                </div>
                <p className="text-charcoal-600">For property managers</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-600 mr-3" />
                  <span>Unlimited properties</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-600 mr-3" />
                  <span>Custom AI personalities</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-600 mr-3" />
                  <span>24/7 phone support</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-600 mr-3" />
                  <span>White-label solution</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-gold-600 mr-3" />
                  <span>API access</span>
                </li>
              </ul>
              <Link
                href="/auth/signup"
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-tan-300 text-charcoal-700 rounded-xl font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all duration-300"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-charcoal-900 text-cream-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Ready to optimize your Airbnb with AI?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Let our trained AI analyze your market, optimize your listings, and provide professional recommendations to boost your revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-charcoal-600 rounded-xl font-semibold text-lg hover:bg-tan-50 transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="#contact"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-cream-50 rounded-xl font-semibold text-lg hover:bg-white hover:text-charcoal-600 transition-all duration-300"
            >
              Contact Sales
            </Link>
          </div>
          <p className="text-sm opacity-75">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-charcoal-900 text-cream-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-bold">HostBuddies</span>
              </div>
              <p className="text-cream-300 leading-relaxed">
                AI-powered Airbnb optimization platform that analyzes your market and provides professional consulting to maximize your revenue.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-cream-300">
                <li><Link href="#features" className="hover:text-cream-50 transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-cream-50 transition-colors">Pricing</Link></li>
                <li><Link href="/guest/session-123" className="hover:text-cream-50 transition-colors">Demo</Link></li>
                <li><Link href="/auth/signup" className="hover:text-cream-50 transition-colors">Free Trial</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-cream-300">
                <li><Link href="#" className="hover:text-cream-50 transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-cream-50 transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-cream-50 transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-cream-50 transition-colors">Status</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-cream-300">
                <li><Link href="#" className="hover:text-cream-50 transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-cream-50 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-cream-50 transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-cream-50 transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-charcoal-800 mt-12 pt-8 text-center text-cream-300">
            <p>&copy; 2024 HostBuddies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}