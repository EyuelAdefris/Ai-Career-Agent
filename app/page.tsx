'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import {
  Sparkles,
  FileText,
  Map,
  Bot,
  ArrowRight,
  Zap,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Star,
  Users,
  Award,
} from 'lucide-react';

/* ─────────────────────────── animation variants ─────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
};

/* ──────────────────────────────── data ──────────────────────────────────── */
const features = [
  {
    icon: FileText,
    title: 'Resume Generator',
    desc: 'Craft ATS-optimized resumes tailored to any job description in seconds. AI matches keywords, formats perfectly, and highlights your strengths.',
    gradient: 'from-indigo-500 to-blue-500',
    borderHover: 'hover:border-indigo-500/60',
    shadowHover: 'hover:shadow-indigo-500/10',
    iconBg: 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
    iconText: 'text-indigo-400',
    href: '/resume-generator',
  },
  {
    icon: FileText,
    title: 'Resume Analyzer',
    desc: 'Score your resume against live job specs, expose missing keywords, and get actionable fix recommendations in one click.',
    gradient: 'from-purple-500 to-violet-500',
    borderHover: 'hover:border-purple-500/60',
    shadowHover: 'hover:shadow-purple-500/10',
    iconBg: 'bg-purple-500/10 group-hover:bg-purple-500/20',
    iconText: 'text-purple-400',
    href: '/resume-analyzer',
  },
  {
    icon: Map,
    title: 'Career Roadmap',
    desc: 'Generate multi-phase learning trajectories with curated skills, projects, and milestones perfectly aligned to your target role.',
    gradient: 'from-cyan-500 to-teal-500',
    borderHover: 'hover:border-cyan-500/60',
    shadowHover: 'hover:shadow-cyan-500/10',
    iconBg: 'bg-cyan-500/10 group-hover:bg-cyan-500/20',
    iconText: 'text-cyan-400',
    href: '/career-roadmap',
  },
  {
    icon: Bot,
    title: 'AI Career Coach',
    desc: 'Practice mock interviews, get mentor-level career advice, and prepare for any technical screen — available 24/7.',
    gradient: 'from-pink-500 to-rose-500',
    borderHover: 'hover:border-pink-500/60',
    shadowHover: 'hover:shadow-pink-500/10',
    iconBg: 'bg-pink-500/10 group-hover:bg-pink-500/20',
    iconText: 'text-pink-400',
    href: '/ai-coach',
  },
];

const benefits = [
  { icon: Zap, text: 'Instant AI-powered feedback in under 5 seconds' },
  { icon: CheckCircle2, text: 'ATS-score boosts averaging 40% for users' },
  { icon: ShieldCheck, text: 'Privacy-first — your data is never sold' },
  { icon: TrendingUp, text: 'Personalized growth paths that evolve with you' },
  { icon: Award, text: 'Trusted by engineers at top-tier tech companies' },
  { icon: Users, text: 'Active community of 10,000+ career-driven developers' },
];

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '94%', label: 'Interview Success Rate' },
  { value: '40%', label: 'Avg. ATS Score Boost' },
  { value: '24/7', label: 'AI Coach Availability' },
];

/* ──────────────────────────── component ─────────────────────────────────── */
export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/70 selection:text-white font-sans overflow-x-hidden">

      {/* ── Scroll Progress Bar ── */}
      <motion.div
        style={{ width: progressWidth }}
        className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-[60]"
      />

      {/* ── Background ambient glows ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-60 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ═══════════════════════════ HEADER ═══════════════════════════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/75 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between gap-6">

          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              AI Career Suite
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
            {['Features', 'How It Works', 'Benefits'].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(' ', '-')}`}
                className="relative group hover:text-white transition-colors duration-200"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-indigo-400 to-purple-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3 shrink-0">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
                <UserButton />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm font-medium transition-colors duration-200 hover:bg-white/5">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5">
                    Get Started Free
                  </button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════ HERO ════════════════════════════════ */}
      <section className="relative pt-28 pb-24 px-6 max-w-7xl mx-auto text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-10 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold uppercase tracking-widest"
        >
          <Zap className="w-3.5 h-3.5 fill-indigo-400" />
          Powered by Eyuel Adefris
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-7 leading-[1.1]"
        >
          Accelerate Your Tech Career
          <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            With Precision AI Guidance
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-12 leading-relaxed"
        >
          Optimize your ATS resume, generate personalized learning roadmaps, and
          practice with your 24/7 AI Career Coach — all in one platform.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="group w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Open Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="group w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2">
                  Start Free Today
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold text-base transition-all duration-200 hover:bg-white/5">
                  View Demo
                </button>
              </SignInButton>
            </>
          )}
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="flex flex-col items-center">
              <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                {s.value}
              </span>
              <span className="text-xs text-slate-500 mt-1">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════ FEATURES GRID ═══════════════════════════ */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-4 block">
            What&apos;s Inside
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">
            Intelligent Features for<br className="hidden md:block" /> Modern Tech Careers
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Everything you need to stand out to recruiters and accelerate your engineering trajectory.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.title} href={f.href}>
                <motion.div
                  variants={fadeUp}
                  className={`group relative p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 ${f.borderHover} transition-all duration-300 hover:shadow-2xl ${f.shadowHover} hover:-translate-y-2 overflow-hidden cursor-pointer h-full flex flex-col justify-between`}
                >
                  {/* gradient bleed on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 rounded-2xl`} />

                  <div>
                    <div className={`relative p-3 ${f.iconBg} rounded-xl w-fit ${f.iconText} mb-6 transition-all duration-300 group-hover:scale-110`}>
                      <Icon className="w-7 h-7" />
                    </div>

                    <h3 className="relative text-xl font-bold text-white mb-3">{f.title}</h3>
                    <p className="relative text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>

                  {/* arrow reveal on hover */}
                  <div className="relative mt-6 flex items-center gap-1.5 text-xs font-semibold text-slate-500 group-hover:text-slate-300 transition-colors duration-300">
                    <span>Explore feature</span>
                    <ArrowRight className="w-3.5 h-3.5 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-4 block">
            Simple &amp; Powerful
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">How It Works</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Go from sign-up to career-ready in three simple steps.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
        >
          {/* connector line (desktop) */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.66%+16px)] right-[calc(16.66%+16px)] h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

          {[
            { step: '01', title: 'Create Your Account', desc: 'Sign up for free in under 30 seconds. No credit card required.', color: 'from-indigo-500 to-blue-500' },
            { step: '02', title: 'Choose Your Tool', desc: 'Pick from resume generation, analysis, roadmaps, or the AI coach.', color: 'from-purple-500 to-pink-500' },
            { step: '03', title: 'Land Your Dream Role', desc: 'Apply AI-driven insights to crush interviews and get hired faster.', color: 'from-cyan-500 to-teal-500' },
          ].map((item) => (
            <motion.div key={item.step} variants={fadeUp} className="flex flex-col items-center text-center">
              <div className={`relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-extrabold text-lg shadow-xl mb-6`}>
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════════ BENEFITS ════════════════════════════ */}
      <section id="benefits" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800/80 p-12 md:p-16 overflow-hidden">
          {/* glows */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-pink-400 mb-4 block">
              Why Developers Choose Us
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Everything You Need to Win
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.text}
                  variants={fadeUp}
                  className="flex items-start gap-4 p-5 rounded-xl bg-white/5 border border-white/[0.08] hover:border-indigo-500/40 hover:bg-white/[0.08] transition-all duration-200 group"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors shrink-0">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{b.text}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════ CTA BAND ════════════════════════════ */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-1.5 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">
            Ready to Level Up Your Career?
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10">
            Join thousands of engineers who used AI Career Suite to land roles at top-tier companies.
          </p>
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all duration-200"
            >
              Open Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
              <button className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all duration-200">
                Get Started — It&apos;s Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignUpButton>
          )}
        </motion.div>
      </section>

      {/* ═══════════════════════════ FOOTER ══════════════════════════════ */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-300">AI Career Suite</span>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} AI Career Suite. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-slate-600 font-medium">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
