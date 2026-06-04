import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  setAuthError: (err: string | null) => void;
}

export const AuthContext = React.createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === 'hitbit2024@gmail.com');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error: any) {
      console.error("Auth sign-in error in App.tsx: ", error);
      let errorMsg = "Login failed. Please verify your connection or check browser settings.";
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request' || String(error?.message || '').includes('popup-blocked')) {
        errorMsg = "Login Pop-up was Blocked/Cancelled. Note: in the iframe sandbox, browser blocks popups by default. Click 'Open in new tab' at the top-right to sign in successfully.";
      } else if (error?.message) {
        errorMsg = error.message;
      }
      setAuthError(errorMsg);
      throw error;
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Auth sign-out error in App.tsx: ", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, authError, loginWithGoogle, logout, setAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}
import { 
  Shield, DollarSign, Cpu, HelpCircle, 
  Settings, Check, Video, Lock, 
  MapPin, Heart, Sparkles, MessageSquare, 
  Bookmark, ChevronDown, UserCheck, Play 
} from 'lucide-react';
import EarningsCalculator from './components/EarningsCalculator';
import ApplicationForm from './components/ApplicationForm';
import AgencyConsole from './components/AgencyConsole';
import CastingDesk from './components/CastingDesk';

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 py-5 font-sans">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-left focus:outline-none group"
      >
        <span className="text-sm md:text-base font-bold uppercase tracking-tight text-slate-200 group-hover:text-brand-lime transition-colors">{question}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180 text-brand-lime' : ''}`} />
      </button>
      {open && (
        <p className="mt-3 text-xs md:text-sm text-neutral-400 leading-relaxed font-normal">
          {answer}
        </p>
      )}
    </div>
  );
}

export function AppContent() {
  const { user, loading, isAdmin, loginWithGoogle, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'talent' | 'auditions' | 'console'>('talent');
  const [registeredCandidate, setRegisteredCandidate] = useState<{
    id: string;
    displayName: string;
    email: string;
    primaryCategory: string;
  } | null>(null);

  // Page Scroll CTA helpers
  const handleScrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between selection:bg-brand-lime/30 selection:text-white">
      {/* Visual Background Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-brand-lime/5 to-transparent rounded-none blur-3xl pointer-events-none -z-10"></div>
      
      {/* Navigation Header */}
      <header className="border-b border-white/10 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-20 flex justify-between items-center">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-lime flex items-center justify-center shadow-lg shadow-brand-lime/10 rounded-none">
              <Video className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="font-extrabold font-display tracking-tight text-white leading-none block text-base md:text-lg uppercase italic">Vivid Creator</span>
              <span className="text-[9px] text-brand-lime font-mono tracking-widest uppercase block mt-0.5">Talent Network</span>
            </div>
          </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-1 sm:gap-6">
              <button
                onClick={() => {
                  setActiveTab('talent');
                  setTimeout(() => handleScrollToId('benefits-section'), 100);
                }}
                className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-white py-1.5 px-2 transition"
              >
                Benefits
              </button>
              <button
                onClick={() => {
                  setActiveTab('talent');
                  setTimeout(() => handleScrollToId('earnings-calculator-section'), 100);
                }}
                className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-white py-1.5 px-2 transition"
              >
                Estimator
              </button>
              <button
                onClick={() => {
                  setActiveTab('talent');
                  setTimeout(() => handleScrollToId('apply-form-section'), 100);
                }}
                className="text-xs font-bold uppercase tracking-widest text-slate-200 py-1.5 px-3 hover:text-brand-lime rounded-none"
              >
                Apply Form
              </button>
              <button
                onClick={() => {
                  setActiveTab('auditions');
                }}
                className="text-xs font-black uppercase tracking-widest text-black bg-brand-lime py-1.5 px-4 hover:bg-neutral-200 transition rounded-none font-sans"
              >
                ✦ Audition Lobby
              </button>
              <span className="w-px h-5 bg-white/10 mx-1 sm:mx-2"></span>
              
              {/* View Mode Toggle */}
              <div className="flex bg-neutral-900 border border-white/10 rounded-none p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('talent')}
                  className={`py-1.5 px-3 rounded-none text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
                    activeTab === 'talent'
                      ? 'bg-brand-lime text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('auditions')}
                  className={`py-1.5 px-3 rounded-none text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
                    activeTab === 'auditions'
                      ? 'bg-brand-lime text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Auditions
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('console')}
                  className={`py-1.5 px-3 rounded-none text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
                    activeTab === 'console'
                      ? 'bg-brand-lime text-black'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Console
                </button>
              </div>

              {/* Google Sign In / Account Status Widget */}
              <div className="flex items-center gap-2 pl-2">
                {user ? (
                  <div className="flex items-center gap-1.5 bg-neutral-900 border border-white/10 p-0.5 rounded-none">
                    {user.photoURL && (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || "User"} 
                        className="w-[28px] h-[28px] rounded-none object-cover border border-white/10"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        setActiveTab('talent');
                      }}
                      className="py-1 px-2 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Sign Out of Vivid"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const logged = await loginWithGoogle();
                        if (logged?.email === 'hitbit2024@gmail.com') {
                          setActiveTab('console');
                        }
                      } catch (err) {
                        console.error("Login failed: ", err);
                      }
                    }}
                    className="py-1.5 px-3 bg-brand-lime text-black text-[9px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                )}
              </div>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 md:px-6 py-12 flex-grow">
        {activeTab === 'talent' ? (
          <div className="space-y-24">
            
            {/* HERO HERO HERO */}
            <section className="text-center max-w-4xl mx-auto pt-8 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 py-1.5 px-4 bg-brand-lime/10 border border-brand-lime/20 text-[10px] text-brand-lime font-mono font-extrabold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-brand-lime" />
                <span>ACTIVE WORLDWIDE RECRUITMENT • CLASS OF 2026</span>
              </div>
              <h1 className="text-5xl md:text-8xl lg:text-[110px] font-black font-display tracking-tighter uppercase leading-[0.85] text-white mt-10 mb-8 select-none">
                OWN THE<br /><span className="text-brand-lime">SCREEN.</span>
              </h1>
              <p className="max-w-xl mx-auto text-base text-neutral-400 font-semibold leading-relaxed">
                Join the world's most exclusive boutique webcam network. We provide the platform, the traffic, and the tools. Stream from home under direct personal coach tutoring. Keep up to <strong className="text-white font-bold">80% of token tips</strong> with elite geoblocking privacy tools.
              </p>
              
              <div className="w-full mt-10 flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12 border-t border-b border-white/10 py-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-4xl font-extrabold font-display text-white tracking-tighter">$2.4k</div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mt-1">Avg. Weekly Earnings</div>
                </div>
                <div className="hidden sm:block border-l border-white/10 h-10"></div>
                <div className="text-center">
                  <div className="text-4xl font-extrabold font-display text-white tracking-tighter">15M+</div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mt-1">Tokens Distributed</div>
                </div>
                <div className="hidden sm:block border-l border-white/10 h-10"></div>
                <div className="text-center">
                  <div className="text-4xl font-extrabold font-display text-white tracking-tighter">24/7</div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold mt-1">Direct Manager Access</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-10 w-full max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => handleScrollToId('apply-form-section')}
                  className="w-full py-5 px-8 bg-brand-lime text-black font-black uppercase tracking-widest text-xs hover:scale-[0.98] transition-all rounded-none flex items-center justify-center gap-2.5 shadow-xl shadow-brand-lime/10 cursor-pointer"
                >
                  Apply Online (Must be 18+)
                  <UserCheck className="w-4 h-4 text-black" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollToId('earnings-calculator-section')}
                  className="w-full py-5 px-8 bg-neutral-900 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition-all rounded-none flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  Project Potential Income
                  <DollarSign className="w-4 h-4 text-white" />
                </button>
              </div>
            </section>

            {/* BENTO BENEFITS GRID */}
            <section id="benefits-section" className="space-y-12">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-[10px] text-brand-lime font-mono font-black uppercase tracking-[0.2em] block">STUDIO COOPERATION</span>
                <h2 className="text-3xl md:text-5xl font-black font-display tracking-tighter uppercase text-white">The Premium Agency Advantage</h2>
                <p className="text-xs text-neutral-400">Why independent models migrate to the Vivid Creator Network.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-neutral-900/40 border border-white/10 p-8 rounded-none flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center text-brand-lime mb-6 rounded-none">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold font-display uppercase tracking-tight text-white">Absolute Geoblocking</h3>
                    <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                      Complete visual masking. Blacklist your home city, state, or entire country of origin. Block specific IP ranges, VPNs, and localized search trackers to assure full lifestyle privacy.
                    </p>
                  </div>
                  <span className="text-[10px] text-brand-lime font-mono font-bold uppercase mt-6 tracking-wider">✓ 105 Countries supported</span>
                </div>

                <div className="bg-neutral-900/40 border border-white/10 p-8 rounded-none flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center text-brand-lime mb-6 rounded-none">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold font-display uppercase tracking-tight text-white">80% Token Royalty Share</h3>
                    <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                      Independent web performers often surrender 50% or more to platform commissions. Under our studio network, we leverage elite contract tiers to raise your payout share up to 80% with zero hidden fees.
                    </p>
                  </div>
                  <span className="text-[10px] text-brand-lime font-mono font-bold uppercase mt-6 tracking-wider">✓ Weekly direct payroll payouts</span>
                </div>

                <div className="bg-neutral-900/40 border border-white/10 p-8 rounded-none flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center text-brand-lime mb-6 rounded-none">
                      <Heart className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold font-display uppercase tracking-tight text-white">Dedicated Account Coaches</h3>
                    <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                      Accelerate your growth. Get paired with matching personal coaching experts to support screen resolution setups, professional lighting styles, stream schedules, and category curation.
                    </p>
                  </div>
                  <span className="text-[10px] text-brand-lime font-mono font-bold uppercase mt-6 tracking-wider">✓ Professional 24/7 technical hotline</span>
                </div>

                <div className="bg-neutral-900/40 border border-white/10 p-8 rounded-none md:col-span-1">
                  <div className="w-12 h-12 bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center text-brand-lime mb-6 rounded-none">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold font-display uppercase tracking-tight text-white">Hardware & Studio Stipends</h3>
                  <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                    Accepted creators inside our prime ranks receive free hardware stipends providing top-shelf 4K webcams, professional ringlights, and active stream software access.
                  </p>
                </div>

                <div className="bg-neutral-900/40 border border-white/10 p-8 rounded-none md:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center text-brand-lime mb-6 rounded-none">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold font-display uppercase tracking-tight text-white">Smart Copyright & Recording Masking</h3>
                    <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
                      We operate digital scraper scripts that actively scan internet archives, forums, and download communities. If any copyrighted content of your private stream appears, we file DMCA takedowns and seize materials within minutes.
                    </p>
                  </div>
                  <div className="flex gap-4 text-[10px] text-neutral-500 font-mono mt-6 font-bold uppercase tracking-wider">
                    <span>• Automated scraper scripts</span>
                    <span>• Rapid DMCA litigation</span>
                  </div>
                </div>
              </div>
            </section>

            {/* EARNINGS ESTIMATOR BLOCK */}
            <section id="earnings-calculator-section" className="space-y-6 scroll-mt-20">
              <div className="max-w-xl mx-auto text-center space-y-2">
                <span className="text-[10px] text-brand-lime font-mono font-black uppercase tracking-[0.2em] block">EARNINGS ESTIMATOR</span>
                <h2 className="text-3xl md:text-5xl font-black font-display tracking-tighter uppercase text-white">Project Your Payouts</h2>
                <p className="text-xs text-neutral-400">Drag sliders below to estimate your potential part-time or full-time income based on hourly token conversion trends.</p>
              </div>
              <EarningsCalculator />
            </section>

            {/* APPLICATION WORKFLOW */}
            <section id="apply-form-section" className="space-y-8 scroll-mt-20">
              <div className="max-w-xl mx-auto text-center space-y-2">
                <span className="text-[10px] text-brand-lime font-mono font-black uppercase tracking-[0.2em] block">SECURE APPLICATION PANEL</span>
                <h3 className="text-3xl md:text-5xl font-black font-display tracking-tighter uppercase text-white mt-2">Begin Your Creative Career</h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  Applications take less than 5 minutes. Real ID authentication and legal majority (18+) is verified safely prior to stream clearance.
                </p>
              </div>
              <ApplicationForm 
                onRegistrationSuccess={(candidate) => setRegisteredCandidate(candidate)}
                onGoToAuditions={() => setActiveTab('auditions')}
              />
            </section>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <section className="bg-neutral-900/40 border border-white/10 p-6 md:p-10 max-w-4xl mx-auto rounded-none">
              <div className="flex items-center gap-3 mb-8">
                <HelpCircle className="w-5 h-5 text-brand-lime" />
                <h3 className="text-lg font-black font-display uppercase tracking-wider text-white">Model FAQ</h3>
              </div>

              <div className="divide-y divide-white/10">
                <FAQItem 
                  question="Do I have to do specific content styles?" 
                  answer="Absolutely not! The style of your stream fits your complete personal comfort. Models specialize in everything, such as gaming style hubs, casual chats, artistic performance, cosplay showmanship, ASMR whispering, or romantic conversation. Your boundaries are fully respected, and you manage your own schedules." 
                />
                <FAQItem 
                  question="Can I block users from my location?" 
                  answer="Yes, absolute city, state, and geographic blocking is one of our central features. When you register, we mask your profile so that viewers logging in near your designated postal jurisdictions or specified coordinates cannot see your name, profile card, or stream." 
                />
                <FAQItem 
                  question="How do I convert tokens to real currency?" 
                  answer="Webcam buyers purchase platform tokens and use them to tip you in chat or request private visuals. We compile your accumulated tokens weekly, convert them directly at premium rates ($0.05 to $0.08 per token based on talent tiers) and transfer funds directly to your preferred accounts via wire transfer, direct deposit, or crypto options." 
                />
                <FAQItem 
                  question="Is there a registration cost or agency fee?" 
                  answer="No. Registration, training, geoblocking setups, and support line coaching are 100% complimentary. We generate revenue strictly by scaling overall platform viewership metrics, meaning we only make money when you make money." 
                />
              </div>
            </section>

          </div>
        ) : activeTab === 'auditions' ? (
          <div className="animate-fade-in pt-4">
            <CastingDesk initialApplicant={registeredCandidate} />
          </div>
        ) : (
          <div className="animate-fade-in pt-4">
            {/* AGENCY MONITORING DASHBOARD */}
            <div className="mb-10 border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl md:text-4xl font-black font-display text-white tracking-tighter uppercase flex items-center gap-3">
                  <Settings className="w-7 h-7 text-brand-lime" />
                  RECRUITMENT CONSOLE
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Direct management of candidate applications, profile reviewing, ratings tracking, and analytics.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('talent')}
                className="py-2.5 px-5 bg-white text-black font-bold uppercase tracking-wider text-[11px] rounded-none hover:bg-neutral-200 transition-colors"
              >
                Go back to Talent view
              </button>
            </div>
            
            <AgencyConsole />
          </div>
        )}
      </main>

      {/* Elegant Standard Footer */}
      <footer className="px-6 md:px-12 py-8 border-t border-white/10 bg-neutral-950 text-xs text-neutral-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-2 text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 text-center md:text-left">
            <span>Global Recruitment Open</span>
            <span>Secure Payments via Crypto/Bank</span>
            <span>Model Safety Guaranteed</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase text-neutral-400">LIVE: 1,402 Models Online Now</span>
            </div>
            <span className="text-neutral-700 hidden sm:inline">|</span>
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'talent' ? 'console' : 'talent')}
              className="text-brand-lime hover:underline font-bold uppercase tracking-wider text-[10px]"
            >
              {activeTab === 'talent' ? 'Recruiter Login' : 'Exit Console'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
