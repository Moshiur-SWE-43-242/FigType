import React, { useState } from 'react';
import { Mail, CheckCircle2, User, KeyRound, Loader2, Award, Zap } from 'lucide-react';
import { User as UserType } from '../types';

interface Props {
  onAuthenticated: (user: UserType, token: string) => void;
  websiteLogo?: string;
}

export default function AuthInterface({ onAuthenticated, websiteLogo }: Props) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'PROFILE'>('EMAIL');
  const [otp, setOtp] = useState('');
  const [receivedToken, setReceivedToken] = useState('');
  const [smsNotification, setSmsNotification] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // New profile details
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');

  // Fallback WhatsApp OTP support
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [showWhatsappInput, setShowWhatsappInput] = useState(false);
  const [whatsappRequested, setWhatsappRequested] = useState(false);

  const submitWhatsappOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappNumber.trim()) {
      setErrorMsg('Please enter a valid WhatsApp number.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/whatsapp-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, whatsappNumber }),
      });
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (response.ok) {
          setWhatsappRequested(true);
          if (data.sandboxOtp) {
            setSmsNotification(data.sandboxOtp);
          }
        } else {
          setErrorMsg(data.error || 'Failed to request OTP via WhatsApp.');
        }
      } else {
        setErrorMsg('WhatsApp server configuration responded in unexpected format.');
      }
    } catch {
      setErrorMsg('Failed to establish WhatsApp security gateway connection.');
    } finally {
      setLoading(false);
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please specify a valid email address.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (response.ok) {
          setStep('OTP');
          // Sandbox assistance so they can easily capture the 6-digit code without finding logs!
          if (data.sandboxOtp) {
            setSmsNotification(data.sandboxOtp);
          }
        } else {
          setErrorMsg(data.error || 'Failed to trigger verification OTP.');
        }
      } else {
        setErrorMsg('The auth gateway returned an unexpected response. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Failed to establish API handshake.');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setErrorMsg('Please typestrike your 6-digit code.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (response.ok) {
          setReceivedToken(data.token);
          if (data.isNewUser) {
            setStep('PROFILE');
          } else {
            // Instantly login
            onAuthenticated(data.user, data.token);
          }
        } else {
          setErrorMsg(data.error || 'Incorrect or expired passkey.');
        }
      } else {
        setErrorMsg('The auth verification gateway returned an unexpected response.');
      }
    } catch (err) {
      setErrorMsg('API communication network dropped.');
    } finally {
      setLoading(false);
    }
  };

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !fullName) {
      setErrorMsg('Username and Full Name are both required.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${receivedToken}`
        },
        body: JSON.stringify({ userId: receivedToken, username, fullName }),
      });
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (response.ok) {
          onAuthenticated(data.user, receivedToken);
        } else {
          setErrorMsg(data.error || 'Failed to complete typist registration.');
        }
      } else {
        setErrorMsg('Registration portal returned an invalid format response.');
      }
    } catch (err) {
      setErrorMsg('Handshake disconnected during profile completion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-box" className="w-full max-w-md mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        {websiteLogo ? (
          <img 
            src={websiteLogo} 
            alt="FigType Brand Logo" 
            className="mx-auto max-h-16 max-w-[200px] object-contain rounded-xl border border-slate-800 p-2 bg-slate-950/40 neon-shadow-blue"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="mx-auto w-12 h-12 bg-gradient-to-tr from-[#00F3FF] to-[#8B5CF6] rounded-xl flex items-center justify-center neon-shadow-blue">
            <Zap className="w-6 h-6 text-white animate-pulse" />
          </div>
        )}
        <h2 className="text-2xl font-semibold text-white tracking-tight font-display">
          Welcome to <span className="text-[#00F3FF]">FigType</span>
        </h2>
        <p className="text-slate-400 text-xs font-sans">
          Authentication Gateway &bull; Powered by MiraCore Logix
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 text-[11px] font-mono text-[#FF4D6D] bg-[#FF4D6D]/10 border border-[#FF4D6D]/35 rounded-lg text-center animate-shake">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Step 1: Request OTP */}
      {step === 'EMAIL' && (
        <form onSubmit={submitEmail} className="space-y-4">
          <div className="space-y-1">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Request Access OTP
          </button>
        </form>
      )}

      {/* Step 2: Verify Access Passcode */}
      {step === 'OTP' && (
        <form onSubmit={submitOtp} className="space-y-4">
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
            <p className="text-center text-[11px] text-slate-400 leading-normal">
              We dispatched a telemetry code to <strong className="text-slate-200">{email}</strong>.
            </p>
            {smsNotification && (
              <div className="mt-2 p-2 bg-[#00F3FF]/10 border border-[#00F3FF]/30 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 font-mono">SANDBOX TELEMETRY CARRIER:</span>
                <p className="text-sm font-bold text-[#00F3FF] tracking-widest mt-0.5">{smsNotification}</p>
                <span className="text-[8px] text-[#00F3FF]/70">Enter the code above or type from console log to login instantly</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">6-Digit Access Passcode</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white tracking-widest text-center transition focus:ring-1 focus:ring-[#00F3FF]/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setStep('EMAIL')}
              className="py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-xs rounded-xl cursor-pointer transition"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Verify Passcode
            </button>
          </div>

          {/* WhatsApp Helper Fallback section */}
          <div className="pt-4 mt-2 border-t border-slate-800/60 space-y-3">
            {!showWhatsappInput ? (
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block font-mono">Can't receive OTP via email?</span>
                <button
                  type="button"
                  onClick={() => setShowWhatsappInput(true)}
                  className="mt-1 text-xs text-[#00F3FF] hover:underline hover:text-[#00D8E6] font-mono font-semibold"
                >
                  💬 Receive Verification OTP on WhatsApp
                </button>
              </div>
            ) : (
              <div className="p-3 bg-indigo-950/30 border border-indigo-950 rounded-xl space-y-2 text-left">
                <div className="font-mono text-[10px] text-indigo-200 leading-relaxed">
                  <span className="font-bold text-white uppercase block mb-1">WhatsApp Verification Gateway</span>
                  Type your WhatsApp phone number below to receive an automated verification code from the official support desk helpline of <strong className="text-white">Miracore Logix</strong> at <span className="text-[#00F3FF] font-bold">01841444413</span>.
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 01712345678"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="flex-grow px-3 py-2 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={submitWhatsappOtp}
                    disabled={loading || !whatsappNumber.trim()}
                    className="px-3 py-2 bg-[#00F3FF] hover:bg-[#00D8E6] text-slate-950 font-bold font-mono text-xs rounded-xl cursor-pointer transition disabled:opacity-40"
                  >
                    Send OTP
                  </button>
                </div>
                
                {whatsappRequested && (
                  <div className="p-2 border border-green-800/40 bg-green-950/20 rounded-lg text-center text-[10px] text-green-300 font-sans">
                    ✓ OTP successfully dispatched from WhatsApp <strong className="text-white">01841444413</strong>! Input the 6-digit code above.
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowWhatsappInput(false)}
                  className="text-[9px] text-slate-500 hover:text-white underline block mx-auto pt-1 font-mono"
                >
                  Never mind, return to standard email OTP
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Step 3: Complete Profiling */}
      {step === 'PROFILE' && (
        <form onSubmit={submitProfile} className="space-y-4">
          <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00FF95]" />
            <span className="text-[10px] text-slate-400 font-sans">Verification of {email} resolved! Complete registration.</span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Your Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Md Moshiur"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Desired Custom Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="MoshiurSWE"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none text-xs rounded-xl text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Establish Typist Registry
          </button>
        </form>
      )}

      {/* Guest Mode Trigger */}
      <div className="pt-4 border-t border-slate-950 text-center">
        <span className="text-[10px] text-slate-600 font-sans block">Want to preview the system first?</span>
        <button
          onClick={() => {
            // Provide arbitrary temporary user credentials for guest preview
            onAuthenticated({
              id: 'guest-' + Math.random().toString(36).substr(2, 5),
              email: 'guest@figtype.ai',
              username: `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
              fullName: 'Guest Observer',
              role: 'GUEST',
              xp: 0,
              level: 1,
              coins: 0,
              streak: 0,
              lastActive: new Date().toISOString(),
              createdAt: new Date().toISOString()
            }, '');
          }}
          className="text-[11px] underline font-semibold text-[#00F3FF] hover:text-[#0077FF] hover:cursor-pointer mt-1"
        >
          Enter Workspace as Guest Visitor &rarr;
        </button>
      </div>

    </div>
  );
}
