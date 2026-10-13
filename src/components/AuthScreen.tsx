import React, { useState } from 'react';
import {
  BookMarked,
  ShieldCheck,
  FileDown,
  Box,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, error: authError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('The sign-in popup was blocked by your browser. Please allow popups to proceed.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled. Please click the button to try again.');
      } else {
        setErrorMessage(err?.message || 'Authentication could not be completed. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] text-stone-900 flex flex-col justify-between selection:bg-stone-900 selection:text-white">
      {/* Top Masthead */}
      <header className="w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-md px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs">
            P
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-semibold text-stone-900 tracking-tight text-lg">
              PageCraft
            </span>
            <span className="text-xs text-stone-400 font-sans tracking-wide">
              Publishing Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
          <Lock className="w-3.5 h-3.5 text-stone-400" />
          <span>Private Workspace</span>
        </div>
      </header>

      {/* Main Split Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column: Sign-In Portal */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
              Editorial Studio Sign-In
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-stone-900 leading-[1.15]">
              Publish publication-grade eBooks and lead magnets.
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed max-w-md">
              Sign in to access your manuscript workbench, 4-chapter narrative architects,
              interactive 3D mockups, and client-side vector PDF generation.
            </p>
          </div>

          {/* Error Notice */}
          {(errorMessage || authError) && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage || authError}</span>
            </div>
          )}

          {/* Action Card */}
          <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-4">
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full py-3.5 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-sm transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs disabled:opacity-50 active:scale-[0.99]"
            >
              {/* Google G Logo */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.1-6.7-4.94H1.27v3.15C3.25 21.36 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.26c-.24-.72-.38-1.49-.38-2.26s.14-1.54.38-2.26V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.27 6.59l4.03 3.15c.94-2.84 3.58-4.99 6.7-4.99z"
                />
              </svg>
              <span>{isSigningIn ? 'Connecting...' : 'Continue with Google Account'}</span>
            </button>

            <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
              <span>Single sign-on</span>
              <span>Cloud Firestore sync</span>
            </div>
          </div>

          {/* Unboxed Feature Proofs */}
          <div className="space-y-2.5 pt-2 text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
              <span>Direct vector PDF engine bypasses iframe print restrictions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
              <span>Real-time 3D book perspective mockup renderer with PNG export</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
              <span>Distraction-free editorial reader with typography controls</span>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Showcase Preview */}
        <div className="lg:col-span-7 flex justify-center lg:justify-end">
          <div className="w-full max-w-lg bg-white border border-stone-200/90 rounded-2xl p-8 shadow-sm space-y-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 text-xs text-stone-400">
              <span className="font-mono">MANUSCRIPT PROOF · A4 AESTHETIC</span>
              <span>4 CHAPTERS · VERIFIED ICP</span>
            </div>

            {/* Simulated Book Header */}
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-amber-700 font-semibold">
                Strategy &amp; Architecture Monograph
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 leading-snug">
                The Modern SaaS Growth Engine
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                From Seed to $10M ARR: Playbooks for Customer Acquisition and Retention
              </p>
            </div>

            {/* Simulated ICP Box */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 space-y-1.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                Strategic Demographic Persona
              </div>
              <p className="text-xs text-stone-800 font-medium">
                VP of Growth &amp; Early Founders · B2B Cloud Platforms
              </p>
              <p className="text-xs text-stone-500 italic">
                "Transition from sporadic ad campaigns to a predictable product-led acquisition and retention machine."
              </p>
            </div>

            {/* Chapters Teaser */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between text-xs text-stone-700 py-1">
                <span className="font-medium">01. Architecting the Product-Led Flywheel</span>
                <span className="text-stone-400 font-mono text-[11px]">Foundation</span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-700 py-1">
                <span className="font-medium">02. Precision Demographic Targeting &amp; Inbound Moats</span>
                <span className="text-stone-400 font-mono text-[11px]">Acquisition</span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-700 py-1">
                <span className="font-medium">03. Pricing Dynamics &amp; Net Revenue Retention</span>
                <span className="text-stone-400 font-mono text-[11px]">Monetization</span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-700 py-1">
                <span className="font-medium">04. Scaling the Sales-Assist Enterprise Bridge</span>
                <span className="text-stone-400 font-mono text-[11px]">Expansion</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-stone-400">
              <span>Ready for Vector PDF Export</span>
              <span>jsPDF Client-Side Engine</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 px-6 lg:px-12 py-4 text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>PageCraft Publishing Studio · Editorial Web Architecture</span>
        <span>Secured via Firebase Authentication &amp; Firestore</span>
      </footer>
    </div>
  );
};
