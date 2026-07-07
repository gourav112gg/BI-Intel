import React from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Database,
  Sparkles,
  Play,
  LayoutDashboard,
  Brain,
  ArrowRight,
  Sun,
  Moon,
  Workflow,
  FileText,
  CheckCircle,
  Code2,
  LineChart,
  GitCompare,
  Terminal,
} from 'lucide-react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  glowColor?: 'coral' | 'teal' | 'none';
}

function AnimatedCounter({ 
  value, 
  duration = 1000, 
  decimals = 0, 
  prefix = '', 
  suffix = '',
  glowColor = 'none'
}: AnimatedCounterProps) {
  const [count, setCount] = React.useState(0);
  const elementRef = React.useRef<HTMLSpanElement>(null);
  const [stage, setStage] = React.useState<'loading' | 'counting' | 'ready'>('loading');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let fallbackTimeout: NodeJS.Timeout;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          clearTimeout(fallbackTimeout);
          const delay = Math.random() * 150 + 100; 
          const t = setTimeout(() => {
            setStage('counting');
          }, delay);
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.05 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    // Fallback: automatically transition to counting after 600ms if observer didn't trigger
    fallbackTimeout = setTimeout(() => {
      setStage('counting');
    }, 600);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimeout);
    };
  }, []);

  React.useEffect(() => {
    if (stage !== 'counting') return;

    let start = 0;
    const end = value;
    const totalSteps = Math.min(60, duration / 16);
    const stepTime = duration / totalSteps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / totalSteps;
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const currentCount = start + (end - start) * easeProgress;
      
      setCount(currentCount);

      if (currentStep >= totalSteps) {
        setCount(end);
        setStage('ready');
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [stage, value, duration]);

  const glowStyles = {
    coral: 'text-coral filter drop-shadow-[0_0_10px_rgba(251,113,133,0.45)]',
    teal: 'text-teal filter drop-shadow-[0_0_10px_rgba(45,212,191,0.45)]',
    none: 'text-text'
  };

  const approxValueStr = value.toFixed(decimals);

  if (stage === 'loading') {
    return (
      <span ref={elementRef} className="inline-flex items-center select-none align-middle justify-center">
        {prefix && <span className="opacity-40 font-mono mr-0.5">{prefix}</span>}
        <span 
          className="inline-block relative overflow-hidden bg-neutral-300/40 dark:bg-neutral-700/40 animate-pulse rounded-md" 
          style={{ width: `${approxValueStr.length * 0.55}em`, height: '0.85em' }} 
        />
        {suffix && <span className="opacity-40 font-mono ml-0.5">{suffix}</span>}
      </span>
    );
  }

  return (
    <span 
      ref={elementRef} 
      className={`transition-all duration-300 ${stage === 'counting' ? glowStyles[glowColor] : ''}`}
    >
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}

interface TypingKeywordProps {
  text: string;
  delay?: number;
}

function TypingKeyword({ text, delay = 0.5 }: TypingKeywordProps) {
  const [displayedText, setDisplayedText] = React.useState('');
  const [isComplete, setIsComplete] = React.useState(false);
  const [hasStarted, setHasStarted] = React.useState(false);
  const elementRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => {
            setHasStarted(true);
          }, delay * 1000);
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  React.useEffect(() => {
    if (!hasStarted) return;

    let currentIndex = 0;
    const intervalTime = 160; // Perfect, readable pace (160ms per letter)
    
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        currentIndex++;
        setDisplayedText(text.slice(0, currentIndex));
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [hasStarted, text]);

  return (
    <span 
      ref={elementRef} 
      className="inline-flex text-coral not-italic font-serif font-medium whitespace-nowrap items-center"
    >
      <span>{displayedText}</span>
      <motion.span
        animate={{ opacity: isComplete ? [1, 0, 1] : 1 }}
        transition={{
          repeat: Infinity,
          duration: 0.8,
          ease: "easeInOut"
        }}
        className="inline-block w-[3px] h-[0.75em] bg-coral ml-1"
        style={{
          verticalAlign: 'middle',
          display: hasStarted ? 'inline-block' : 'none'
        }}
      />
    </span>
  );
}

interface LandingPageProps {
  onRedirectToDashboard: (targetTab?: 'datasets' | 'cleaning' | 'training' | 'dashboard') => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  isModelReady: boolean;
  selectedDataset: any;
}

export default function LandingPage({
  onRedirectToDashboard,
  theme,
  setTheme,
  isModelReady,
  selectedDataset,
}: LandingPageProps) {
  
  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 35 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: 0.8, ease: 'easeOut' } 
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.96, y: 15 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -40 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 40 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text transition-colors duration-200 selection:bg-coral/10 selection:text-coral font-sans overflow-x-hidden">
      
      {/* 1. NAVBAR */}
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="sticky top-0 z-50 bg-bg/85 backdrop-blur-md border-b border-line/60 transition-colors duration-200"
      >
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2.5 font-serif font-semibold text-xl tracking-tight cursor-pointer"
            onClick={() => handleScrollTo('hero-section')}
          >
            <svg className="w-6 h-6 stroke-coral" viewBox="0 0 26 26" fill="none" strokeWidth="2.4" strokeLinecap="round">
              <path d="M2 18c3-1 5-6 8-6s4 5 7 5 4-8 7-8" />
            </svg>
            <span className="font-serif font-black text-2xl tracking-tight text-text">BI Intel</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8 font-mono text-xs font-semibold text-text-muted">
            <button onClick={() => handleScrollTo('why')} className="hover:text-text cursor-pointer transition-colors relative group">
              Why Forecasting
              <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-coral transition-all group-hover:w-full" />
            </button>
            <button onClick={() => handleScrollTo('features')} className="hover:text-text cursor-pointer transition-colors relative group">
              Capabilities
              <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-coral transition-all group-hover:w-full" />
            </button>
            <button onClick={() => handleScrollTo('pipeline')} className="hover:text-text cursor-pointer transition-colors relative group">
              How It Works
              <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-coral transition-all group-hover:w-full" />
            </button>
            <button onClick={() => handleScrollTo('preview')} className="hover:text-text cursor-pointer transition-colors relative group">
              Interactive Preview
              <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-coral transition-all group-hover:w-full" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle in Nav */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-xl bg-panel2/60 border border-line/55 text-text-muted hover:text-text transition-all cursor-pointer"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onRedirectToDashboard()}
              className="bg-text text-surface px-4 py-2.5 rounded-xl text-xs font-mono font-bold hover:opacity-90 shadow-xs hover:shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
            >
              Enter Workspace
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* 2. HERO SECTION */}
      <header className="py-16 lg:py-24 relative max-w-6xl mx-auto px-6" id="hero-section">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={slideInLeft}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider uppercase text-teal bg-teal/10 px-3.5 py-1.5 rounded-full border border-teal/15">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
              PREDICTIVE ANALYTICS ENGINE
            </div>
            
            <h1 className="font-serif font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none text-text">
              See the shape<br />of what's <TypingKeyword text="coming." delay={0.6} />
            </h1>
            
            <p className="text-text-muted text-base sm:text-lg leading-relaxed max-w-xl font-sans font-normal">
              BI Intel turns a spreadsheet of past performance into a forecast with a visible margin of error — so a growth call is made from a probability band, not a guess dressed up as a number.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onRedirectToDashboard(isModelReady ? 'dashboard' : 'datasets')}
                className="bg-text text-surface px-6 py-3.5 rounded-xl text-sm font-semibold hover:opacity-95 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                {isModelReady ? 'View Predictive Dashboard' : 'Run a sample forecast'}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleScrollTo('pipeline')}
                className="border border-line hover:border-text-muted bg-surface text-text px-6 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                How the model works
              </motion.button>
            </div>
            
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-line/50">
              <motion.div whileHover={{ y: -2 }} className="transition-transform">
                <span className="block font-mono text-xl sm:text-2xl font-bold text-text">
                  <AnimatedCounter value={6.2} decimals={1} prefix="±" suffix="%" glowColor="teal" />
                </span>
                <span className="text-[11px] text-text-muted font-mono uppercase tracking-wider block mt-1">Error Margin</span>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} className="transition-transform">
                <span className="block font-mono text-xl sm:text-2xl font-bold text-text">
                  <AnimatedCounter value={5} prefix="" suffix="-Stage" glowColor="none" />
                </span>
                <span className="text-[11px] text-text-muted font-mono uppercase tracking-wider block mt-1">Data Pipeline</span>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} className="transition-transform">
                <span className="block font-mono text-xl sm:text-2xl font-bold text-text">
                  <AnimatedCounter value={3} prefix="" suffix=" Family" glowColor="none" />
                </span>
                <span className="text-[11px] text-text-muted font-mono uppercase tracking-wider block mt-1">Algorithm Suite</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Forecast Chart Signature Card */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={slideInRight}
            className="lg:col-span-5"
          >
            <motion.div 
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.3 }}
              className="bg-surface border border-line rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">90-day revenue forecast</span>
                  <span className="block font-mono text-3xl font-black text-coral mt-1">
                    <AnimatedCounter value={18.4} decimals={1} prefix="+" suffix="%" glowColor="coral" />
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">confidence</span>
                  <span className="block font-mono text-sm font-bold text-text mt-1">
                    <AnimatedCounter value={82} decimals={0} prefix="" suffix="%" glowColor="none" />
                  </span>
                </div>
              </div>
              
              <div className="h-44 w-full relative">
                <svg className="w-full h-full" viewBox="0 0 400 180" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="45" x2="400" y2="45" stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                  <line x1="0" y1="90" x2="400" y2="90" stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                  <line x1="0" y1="135" x2="400" y2="135" stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                  
                  {/* Confidence Band Area */}
                  <motion.path
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.2 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 1.2 }}
                    d="M0,120 C60,110 100,100 150,95 C220,88 260,60 400,20 L400,70 C260,105 220,125 150,132 C100,138 60,140 0,150 Z"
                    fill="url(#bandGrad)"
                  />
                  
                  {/* Historical Trend */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, duration: 1.6, ease: "easeInOut" }}
                    className="stroke-teal"
                    d="M0,135 C60,125 100,118 150,113 C220,105 260,75 400,45"
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.7"
                  />
                  
                  {/* Median Forecast */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 2.0, ease: "easeInOut" }}
                    className="stroke-coral"
                    d="M0,120 C60,110 100,100 150,95 C220,88 260,60 400,20"
                    fill="none"
                    strokeWidth="3"
                  />
                  
                  {/* Terminal Forecast Point */}
                  <motion.circle 
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 2.2, type: "spring", stiffness: 150 }}
                    cx="400" 
                    cy="20" 
                    r="5" 
                    fill="var(--coral)" 
                    className="animate-pulse" 
                  />
                  
                  <defs>
                    <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--coral)" />
                      <stop offset="100%" stopColor="var(--coral)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="flex gap-4 pt-4 border-t border-line/40 font-mono text-[10px] text-text-muted justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-coral inline-block" />
                  Forecast (median)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal inline-block" />
                  Historical trend
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-coral/20 border border-coral/30 inline-block" />
                  Confidence band
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* 3. PROBLEM / WHY SECTION */}
      <section className="bg-surface border-y border-line/60 py-20" id="why">
        <div className="max-w-6xl mx-auto px-6">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            variants={fadeInUp}
            className="max-w-xl space-y-4 mb-16"
          >
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-coral">
              The Problem
            </span>
            <h2 className="font-serif font-black text-3xl sm:text-4xl text-text leading-tight">
              Most "insights" are just last month, described politely.
            </h2>
            <p className="text-text-muted text-sm sm:text-base leading-relaxed">
              Dashboards are good at showing what already happened. BI Intel is built for the harder, more useful question: what happens next, and how sure are we.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -6, borderColor: "var(--coral)" }}
              className="border border-line/75 rounded-2xl p-6 space-y-4 bg-bg/40 transition-all duration-300"
            >
              <span className="font-mono text-xs text-text-muted font-bold tracking-wider block">01</span>
              <h3 className="font-serif font-semibold text-lg text-text">Hindsight isn't a plan</h3>
              <p className="text-text-muted text-xs leading-relaxed font-sans">
                A chart of the past explains yesterday. It doesn't tell you which lever to pull tomorrow to secure your business outcomes.
              </p>
            </motion.div>
            
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -6, borderColor: "var(--coral)" }}
              className="border border-line/75 rounded-2xl p-6 space-y-4 bg-bg/40 transition-all duration-300"
            >
              <span className="font-mono text-xs text-text-muted font-bold tracking-wider block">02</span>
              <h3 className="font-serif font-semibold text-lg text-text">Point estimates hide risk</h3>
              <p className="text-text-muted text-xs leading-relaxed font-sans">
                "+18% growth" means nothing without knowing whether that's a near-certainty or a coin flip. Probabilities drive robust decisions.
              </p>
            </motion.div>
            
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -6, borderColor: "var(--coral)" }}
              className="border border-line/75 rounded-2xl p-6 space-y-4 bg-bg/40 transition-all duration-300"
            >
              <span className="font-mono text-xs text-text-muted font-bold tracking-wider block">03</span>
              <h3 className="font-serif font-semibold text-lg text-text">Reports get skimmed</h3>
              <p className="text-text-muted text-xs leading-relaxed font-sans">
                A forecast needs to be legible at a glance — a shape, not an dense spreadsheet — or it never reaches and influences a key decision-maker.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 4. CAPABILITIES SECTION */}
      <section className="py-20" id="features">
        <div className="max-w-6xl mx-auto px-6">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            variants={fadeInUp}
            className="max-w-xl space-y-4 mb-16"
          >
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal">
              Capabilities
            </span>
            <h2 className="font-serif font-black text-3xl sm:text-4xl text-text leading-tight">
              Everything between raw data and a decision.
            </h2>
            <p className="text-text-muted text-sm sm:text-base leading-relaxed">
              Each stage is a working module, not a static slide — built to run on real, imperfect, real-world data files.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Capability 1 */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -5, scale: 1.01 }}
              className="bg-surface border border-line rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all group duration-300"
            >
              <div>
                <motion.div 
                  whileHover={{ rotate: 10, scale: 1.05 }}
                  className="w-10 h-10 rounded-xl bg-coral/10 border border-coral/15 flex items-center justify-center text-coral mb-4 transition-transform duration-200"
                >
                  <Database className="w-5 h-5" />
                </motion.div>
                <h3 className="font-serif font-semibold text-lg text-text mb-2">Data Collection</h3>
                <p className="text-text-muted text-xs leading-relaxed font-sans">
                  Ingests existing datasets or pulls fresh records, with a clear log of source, column dimensions, and collection dates.
                </p>
              </div>
              <span className="inline-block mt-4 text-[10px] font-mono font-bold text-coral bg-coral/10 px-2.5 py-1 rounded-full self-start">
                STAGE 1
              </span>
            </motion.div>

            {/* Capability 2 */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -5, scale: 1.01 }}
              className="bg-surface border border-line rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all group duration-300"
            >
              <div>
                <motion.div 
                  whileHover={{ rotate: -10, scale: 1.05 }}
                  className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/15 flex items-center justify-center text-teal mb-4 transition-transform duration-200"
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                <h3 className="font-serif font-semibold text-lg text-text mb-2">Cleaning &amp; Prep</h3>
                <p className="text-text-muted text-xs leading-relaxed font-sans">
                  Handles missing nulls, duplicate lines, and out-of-range statistical outliers before they can quietly bend a model's final coefficients.
                </p>
              </div>
              <span className="inline-block mt-4 text-[10px] font-mono font-bold text-teal bg-teal/10 px-2.5 py-1 rounded-full self-start">
                STAGE 2
              </span>
            </motion.div>

            {/* Capability 3 */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -5, scale: 1.01 }}
              className="bg-surface border border-line rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all group duration-300"
            >
              <div>
                <motion.div 
                  whileHover={{ rotate: 10, scale: 1.05 }}
                  className="w-10 h-10 rounded-xl bg-coral/10 border border-coral/15 flex items-center justify-center text-coral mb-4 transition-transform duration-200"
                >
                  <Play className="w-5 h-5" />
                </motion.div>
                <h3 className="font-serif font-semibold text-lg text-text mb-2">Prediction Model</h3>
                <p className="text-text-muted text-xs leading-relaxed font-sans">
                  Regression or classification algorithms, selected automatically to fit target labels — always scored with honest R² or accuracy readings.
                </p>
              </div>
              <span className="inline-block mt-4 text-[10px] font-mono font-bold text-coral bg-coral/10 px-2.5 py-1 rounded-full self-start">
                STAGE 3
              </span>
            </motion.div>

            {/* Capability 4 */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -5, scale: 1.01 }}
              className="bg-surface border border-line rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all group duration-300"
            >
              <div>
                <motion.div 
                  whileHover={{ rotate: -10, scale: 1.05 }}
                  className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/15 flex items-center justify-center text-teal mb-4 transition-transform duration-200"
                >
                  <Brain className="w-5 h-5" />
                </motion.div>
                <h3 className="font-serif font-semibold text-lg text-text mb-2">Insight Generation</h3>
                <p className="text-text-muted text-xs leading-relaxed font-sans">
                  Translates model coefficients and parameters into plain-language findings that a non-technical business stakeholder can digest and act on.
                </p>
              </div>
              <span className="inline-block mt-4 text-[10px] font-mono font-bold text-teal bg-teal/10 px-2.5 py-1 rounded-full self-start">
                STAGE 4
              </span>
            </motion.div>

            {/* Capability 5 */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -5, scale: 1.01 }}
              className="bg-surface border border-line rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all group duration-300"
            >
              <div>
                <motion.div 
                  whileHover={{ rotate: 10, scale: 1.05 }}
                  className="w-10 h-10 rounded-xl bg-coral/10 border border-coral/15 flex items-center justify-center text-coral mb-4 transition-transform duration-200"
                >
                  <LineChart className="w-5 h-5" />
                </motion.div>
                <h3 className="font-serif font-semibold text-lg text-text mb-2">Visualization</h3>
                <p className="text-text-muted text-xs leading-relaxed font-sans">
                  High-contrast forecast charts, actual fit alignments, and relative feature weights designed to be read in under five seconds.
                </p>
              </div>
              <span className="inline-block mt-4 text-[10px] font-mono font-bold text-coral bg-coral/10 px-2.5 py-1 rounded-full self-start">
                STAGE 5
              </span>
            </motion.div>

            {/* Capability 6 */}
            <motion.div 
              variants={fadeInUp}
              whileHover={{ y: -5, scale: 1.01 }}
              className="bg-surface border border-line rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all group duration-300"
            >
              <div>
                <motion.div 
                  whileHover={{ rotate: -10, scale: 1.05 }}
                  className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/15 flex items-center justify-center text-teal mb-4 transition-transform duration-200"
                >
                  <FileText className="w-5 h-5" />
                </motion.div>
                <h3 className="font-serif font-semibold text-lg text-text mb-2">Executive Report</h3>
                <p className="text-text-muted text-xs leading-relaxed font-sans">
                  A unified compile, ready to print to PDF or share with executive decks, with the main forecast, the statistical reasoning, and safety margins.
                </p>
              </div>
              <span className="inline-block mt-4 text-[10px] font-mono font-bold text-teal bg-teal/10 px-2.5 py-1 rounded-full self-start">
                STAGE 6
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section className="bg-[#0B0E17] text-[#EDEFF5] py-20 border-y border-[#2D3954]/50" id="pipeline">
        <div className="max-w-6xl mx-auto px-6">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            variants={fadeInUp}
            className="max-w-xl space-y-4 mb-16"
          >
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-coral">
              How It Works
            </span>
            <h2 className="font-serif font-black text-3xl sm:text-4xl leading-tight text-white">
              One pipeline, start to finish.
            </h2>
            <p className="text-[#A7ADBE] text-sm sm:text-base leading-relaxed">
              This is a real sequential engineering suite — each stage cleanly processes the data for the next phase.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="space-y-0 divide-y divide-[#2D3954]/30"
          >
            {/* Step 1 */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-12 gap-6 py-8 group">
              <span className="md:col-span-1 font-mono text-base font-bold text-coral transition-transform duration-300 group-hover:translate-x-1 block">01</span>
              <div className="md:col-span-11 space-y-2">
                <h4 className="font-serif font-bold text-lg text-white group-hover:text-coral transition-colors">Collect & Ingest</h4>
                <p className="text-[#A7ADBE] text-sm leading-relaxed max-w-3xl">
                  Select an pre-loaded source dataset (such as customer churn, real estate valuation, or concrete strength) or upload your custom CSV. Every field, datatype, and missing count is surfaced during profiling.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-12 gap-6 py-8 group">
              <span className="md:col-span-1 font-mono text-base font-bold text-coral transition-transform duration-300 group-hover:translate-x-1 block">02</span>
              <div className="md:col-span-11 space-y-2">
                <h4 className="font-serif font-bold text-lg text-white group-hover:text-coral transition-colors">Data Cleaning</h4>
                <p className="text-[#A7ADBE] text-sm leading-relaxed max-w-3xl">
                  Configure missing-value imputers (mean, median, or deletion), select standard/min-max scaler transforms, and strip duplicates. A live standard out (STDOUT) log displays precise transformation impacts.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-12 gap-6 py-8 group">
              <span className="md:col-span-1 font-mono text-base font-bold text-coral transition-transform duration-300 group-hover:translate-x-1 block">03</span>
              <div className="md:col-span-11 space-y-2">
                <h4 className="font-serif font-bold text-lg text-white group-hover:text-coral transition-colors">Coefficients Model Trainer</h4>
                <p className="text-[#A7ADBE] text-sm leading-relaxed max-w-3xl">
                  Pick predictor features (X) and target outputs (Y). Choose algorithms such as Ridge Regression, Lasso, Decision Trees, or Logistic classifiers. We partition the records, optimize weight vectors, and present performance coefficients.
                </p>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-12 gap-6 py-8 group">
              <span className="md:col-span-1 font-mono text-base font-bold text-coral transition-transform duration-300 group-hover:translate-x-1 block">04</span>
              <div className="md:col-span-11 space-y-2">
                <h4 className="font-serif font-bold text-lg text-white group-hover:text-coral transition-colors">Interactive Interpretation</h4>
                <p className="text-[#A7ADBE] text-sm leading-relaxed max-w-3xl">
                  Model weight factors are mapped to relative feature scores. An interactive value simulator provides real-time slider controls so you can tweak predictor features and instantaneously generate target predictions.
                </p>
              </div>
            </motion.div>

            {/* Step 5 */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-12 gap-6 py-8 group">
              <span className="md:col-span-1 font-mono text-base font-bold text-coral transition-transform duration-300 group-hover:translate-x-1 block">05</span>
              <div className="md:col-span-11 space-y-2">
                <h4 className="font-serif font-bold text-lg text-white group-hover:text-coral transition-colors">Executive Report Brief</h4>
                <p className="text-[#A7ADBE] text-sm leading-relaxed max-w-3xl">
                  The model generates written explanations of key predictions, relative sensitivities, and lists 3 strategic recommendations. The entire layout compiles into a beautifully styled modal ready for printing or PDF exports.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 6. TECH STACK SECTION */}
      <section className="py-20 border-b border-line/50">
        <div className="max-w-6xl mx-auto px-6">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            variants={fadeInUp}
            className="max-w-xl space-y-2 mb-12"
          >
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal">
              Under the Hood
            </span>
            <h2 className="font-serif font-black text-2xl sm:text-3xl text-text">
              Analytical core powered by standard modules.
            </h2>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-wrap gap-4"
          >
            <motion.div 
              variants={scaleIn}
              whileHover={{ scale: 1.04, rotate: 1 }}
              className="flex items-center gap-3 bg-surface border border-line rounded-full px-5 py-3 shadow-xs hover:border-text-muted/20 transition-all cursor-default"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#3776AB]" />
              <div className="font-sans text-xs font-semibold">
                React 18 &amp; Vite <span className="text-text-muted font-normal">/ Client Rendering</span>
              </div>
            </motion.div>
            
            <motion.div 
              variants={scaleIn}
              whileHover={{ scale: 1.04, rotate: -1 }}
              className="flex items-center gap-3 bg-surface border border-line rounded-full px-5 py-3 shadow-xs hover:border-text-muted/20 transition-all cursor-default"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-teal" />
              <div className="font-sans text-xs font-semibold">
                Scikit-Learn <span className="text-text-muted font-normal">/ Polynomial &amp; Linear Matrix Fit</span>
              </div>
            </motion.div>
            
            <motion.div 
              variants={scaleIn}
              whileHover={{ scale: 1.04, rotate: 1 }}
              className="flex items-center gap-3 bg-surface border border-line rounded-full px-5 py-3 shadow-xs hover:border-text-muted/20 transition-all cursor-default"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-coral" />
              <div className="font-sans text-xs font-semibold">
                Gemini LLM <span className="text-text-muted font-normal">/ Brief Synthesis &amp; Strategic Advisory</span>
              </div>
            </motion.div>
            
            <motion.div 
              variants={scaleIn}
              whileHover={{ scale: 1.04, rotate: -1 }}
              className="flex items-center gap-3 bg-surface border border-line rounded-full px-5 py-3 shadow-xs hover:border-text-muted/20 transition-all cursor-default"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#6C63B5]" />
              <div className="font-sans text-xs font-semibold">
                D3 &amp; Recharts <span className="text-text-muted font-normal">/ Responsive Vector Curves</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 7. DASHBOARD PREVIEW TEASER */}
      <section className="py-20 bg-bg" id="preview">
        <div className="max-w-6xl mx-auto px-6">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            variants={fadeInUp}
            className="max-w-xl space-y-4 mb-12"
          >
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-coral">
              Live Preview
            </span>
            <h2 className="font-serif font-black text-3xl text-text leading-tight">
              Interactive workspace built for rapid profiling.
            </h2>
            <p className="text-text-muted text-xs sm:text-sm">
              Below is an actual live configuration. Click anyway to enter the Workspace where you can load, transform, and train against real columns.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={scaleIn}
            onClick={() => onRedirectToDashboard()}
            className="group relative bg-[#0B0E17] border border-[#2D3954]/50 rounded-2xl p-4 sm:p-6 shadow-2xl cursor-pointer hover:scale-[1.005] hover:shadow-coral/5 transition-all duration-300"
          >
            <div className="absolute -top-3.5 right-6 bg-coral text-white font-mono text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-md animate-bounce">
              ENTER LIVE ENVIRONMENT
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[300px]">
              {/* Sidebar teaser */}
              <div className="md:col-span-3 border-r border-[#2D3954]/25 pr-4 flex flex-col justify-between hidden md:flex">
                <div className="space-y-2">
                  <div className="h-6 w-24 bg-[#1D263B] rounded-md animate-pulse" />
                  <div className="space-y-1.5 pt-4">
                    <div className="h-8 bg-coral/20 border border-coral/30 rounded-lg flex items-center px-3 gap-2">
                      <span className="w-2 h-2 rounded-full bg-coral animate-ping" />
                      <div className="h-2.5 w-16 bg-[#1D263B] rounded-sm" />
                    </div>
                    <div className="h-8 bg-[#1D263B]/40 rounded-lg flex items-center px-3 gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#2D3954]" />
                      <div className="h-2.5 w-16 bg-[#1D263B]/60 rounded-sm" />
                    </div>
                    <div className="h-8 bg-[#1D263B]/40 rounded-lg flex items-center px-3 gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#2D3954]" />
                      <div className="h-2.5 w-20 bg-[#1D263B]/60 rounded-sm" />
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-[#1D263B]/30 rounded-lg space-y-1">
                  <div className="h-2 w-12 bg-[#2D3954] rounded-sm" />
                  <div className="h-2.5 w-24 bg-[#2D3954] rounded-sm" />
                </div>
              </div>

              {/* Main panel teaser */}
              <div className="md:col-span-9 flex flex-col justify-between space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#141A29] border border-[#2D3954]/45 rounded-xl p-4 space-y-2">
                    <div className="h-2 w-16 bg-[#2D3954] rounded-sm font-mono text-[9px] uppercase tracking-wider text-text-muted">Target variable</div>
                    <div className="font-mono text-xs sm:text-sm font-bold text-white mt-1">REVENUE_USD</div>
                  </div>
                  <div className="bg-[#141A29] border border-[#2D3954]/45 rounded-xl p-4 space-y-2">
                    <div className="h-2 w-16 bg-[#2D3954] rounded-sm font-mono text-[9px] uppercase tracking-wider text-text-muted">Coefficient score</div>
                    <div className="font-mono text-xs sm:text-sm font-bold text-coral mt-1">
                      <AnimatedCounter value={87.3} decimals={1} prefix="" suffix="%" glowColor="coral" />
                    </div>
                  </div>
                  <div className="bg-[#141A29] border border-[#2D3954]/45 rounded-xl p-4 space-y-2">
                    <div className="h-2 w-12 bg-[#2D3954] rounded-sm font-mono text-[9px] uppercase tracking-wider text-text-muted">Confidence band</div>
                    <div className="font-mono text-xs sm:text-sm font-bold text-teal mt-1">
                      <AnimatedCounter value={95} decimals={0} prefix="" suffix="%" glowColor="teal" />
                    </div>
                  </div>
                </div>

                {/* Micro Chart representation */}
                <div className="bg-[#141A29]/70 border border-[#2D3954]/40 rounded-xl p-4 h-32 flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                    <motion.path
                      initial={{ pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 0.1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.8, ease: "easeInOut" }}
                      d="M0,85 C60,75 100,70 150,65 C220,55 260,35 400,10 L400,45 C260,70 220,85 150,90 Z"
                      fill="var(--coral)"
                    />
                    <motion.path
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.8, ease: "easeInOut", delay: 0.2 }}
                      d="M0,85 C60,75 100,70 150,65 C220,55 260,35 400,10"
                      fill="none"
                      stroke="var(--coral)"
                      strokeWidth="2.5"
                    />
                    <motion.circle 
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 2.0, type: "spring", stiffness: 150 }}
                      cx="400" 
                      cy="10" 
                      r="4.5" 
                      fill="var(--coral)" 
                    />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 8. CALL TO ACTION SECTION */}
      <section className="py-24 text-center max-w-4xl mx-auto px-6 space-y-8" id="cta-section">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={fadeInUp}
          className="space-y-6"
        >
          <h2 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl text-text leading-tight">
            Once the boundaries are set,<br />the forecast gets sharper.
          </h2>
          <p className="text-text-muted text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            BI Intel starts from structured pre-loaded datasets while training weight vectors — then opens up to any table schema you drop into our files list.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onRedirectToDashboard('datasets')}
            className="bg-text text-surface px-8 py-4 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            Start with a sample dataset
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-line/60 py-8 text-xs text-text-muted transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-medium text-text">BI Intel — Predictive Analytics Engine</span>
          <span className="font-mono text-[10px] uppercase">Engineered dynamically with Gemini advisory</span>
        </div>
      </footer>
    </div>
  );
}
