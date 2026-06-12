import React, { useState } from 'react';

interface AuthGatewayProps {
  onAuthenticated: (user: any, token: string) => void;
  websiteLogo?: string;
}

type AuthMode = 'LOGIN' | 'OTP_VERIFY' | 'REGISTER' | 'FORGOT_PWD' | 'RESET_VERIFY' | 'SET_PWD';

export default function AuthGateway({ onAuthenticated, websiteLogo }: AuthGatewayProps) {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState(''); 
  
  // Registration states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  // --- 1. Password Login ---
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch('/api/auth/password-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        onAuthenticated(data.user, data.token);
      } else {
        setError(data.error || 'Login failed. Incorrect email or password.');
      }
    } catch (err) {
      setError('Network error. Server might be down.');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Request OTP ---
  const handleRequestOtp = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setMode('OTP_VERIFY');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Verify OTP ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.isNewUser) {
          setToken(data.token);
          setMode('REGISTER');
        } else {
          onAuthenticated(data.user, data.token);
        }
      } else {
        setError(data.error || 'Invalid or expired OTP');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // --- 4. Register Profile ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ username, fullName, password }),
      });
      const data = await res.json();

      if (data.success) {
        // Registration success, login automatically
        const loginRes = await fetch('/api/auth/password-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        if (loginData.success) {
           onAuthenticated(loginData.user, loginData.token);
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // --- 5. Forgot Password Flow ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address to reset password.');
      return;
    }
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setMode('RESET_VERIFY');
      } else {
        setError(data.error || 'Failed to send reset code.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch('/api/auth/verify-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (data.success) {
        setToken(data.resetToken);
        setMode('SET_PWD');
      } else {
        setError(data.error || 'Invalid reset OTP');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken: token, password }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg('Password changed successfully! Please login.');
        setMode('LOGIN');
        setPassword('');
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // --- 6. Guest Login ---
  const handleGuestLogin = () => {
    const mockGuest = {
      id: 'guest-' + Math.random().toString(36).substr(2, 9),
      username: 'Guest_Typist',
      fullName: 'Guest User',
      role: 'GUEST',
      xp: 0, level: 1, coins: 0, streak: 0, badges: []
    };
    onAuthenticated(mockGuest, '');
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-xl shadow-[0_0_30px_rgba(0,243,255,0.05)]">
      
      {/* --- LOGO SECTION --- */}
      <div className="flex justify-center mb-6">
        {websiteLogo ? (
          <img 
            src={websiteLogo} 
            alt="FigTyp Logo" 
            className="w-28 h-28 object-contain rounded-2xl border border-slate-700 shadow-[0_0_25px_rgba(0,243,255,0.3)]" 
          />
        ) : (
          <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-[#00F3FF] to-[#8B5CF6] flex items-center justify-center font-display font-extrabold text-white text-5xl shadow-[0_0_25px_rgba(0,243,255,0.3)]">
            FT
          </div>
        )}
      </div>

      <div className="text-center mb-8">
        <h2 className="text-4xl font-extrabold text-white tracking-tight">Welcome to FigTyp</h2>
        <p className="text-slate-400 text-base mt-2">Secure Neural Authentication</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm text-center">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm text-center">
          {successMsg}
        </div>
      )}

      {/* ================= MODE: LOGIN ================= */}
      {mode === 'LOGIN' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm text-slate-400 mb-1">Email Address</label>
            <input
              id="login-email"
              type="email"
              required
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-lg bg-[#0B0F19] border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="login-password" className="block text-sm text-slate-400">Password</label>
              <button 
                type="button" 
                onClick={() => setMode('FORGOT_PWD')} 
                className="text-xs text-cyan-500 hover:text-cyan-400"
              >
                Forgot Password?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-[#0B0F19] border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Login Securely'}
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="px-3 text-xs text-slate-500 uppercase">Or Continue With</span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={loading}
              className="w-full bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              Login / Register via OTP
            </button>
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full bg-transparent hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold py-3 rounded-lg transition-colors"
            >
              Play as Guest
            </button>
          </div>
        </form>
      )}

      {/* ================= MODE: OTP VERIFY ================= */}
      {mode === 'OTP_VERIFY' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center mb-2">
            <p className="text-sm text-slate-400">We've sent a code to <span className="text-cyan-400">{email}</span></p>
          </div>
          <div>
            <label htmlFor="auth-otp" className="block text-sm text-slate-400 mb-1">Enter 6-Digit OTP</label>
            <input
              id="auth-otp"
              type="text"
              required
              maxLength={6}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-lg bg-[#0B0F19] border border-slate-700 text-white text-center text-2xl tracking-[0.5em] focus:border-cyan-400 focus:outline-none"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#8B5CF6] hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify Identity'}
          </button>
          <button type="button" onClick={() => setMode('LOGIN')} className="w-full text-slate-400 text-sm mt-2 hover:text-white">
            &larr; Back to Login
          </button>
        </form>
      )}

      {/* ================= MODE: REGISTER NEW PROFILE ================= */}
      {mode === 'REGISTER' && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="text-center mb-4 text-cyan-400 text-sm">
            Email verified! Let's complete your profile.
          </div>
          <div>
            <label htmlFor="reg-name" className="block text-sm text-slate-400 mb-1">Full Name</label>
            <input
              id="reg-name"
              type="text"
              required
              placeholder="e.g. John Doe"
              className="w-full px-4 py-3 rounded-lg bg-[#0B0F19] border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="reg-user" className="block text-sm text-slate-400 mb-1">Username</label>
            <input
              id="reg-user"
              type="text"
              required
              placeholder="e.g. johndoe123"
              className="w-full px-4 py-3 rounded-lg bg-[#0B0F19] border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
            />
          </div>
          <div>
            <label htmlFor="reg-pass" className="block text-sm text-slate-400 mb-1">Set Password</label>
            <input
              id="reg-pass"
              type="password"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="w-full px-4 py-3 rounded-lg bg-[#0B0F19] border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-lg mt-4 disabled:opacity-50">
            {loading ? 'Saving...' : 'Complete Account Setup'}
          </button>
        </form>
      )}

      {/* ================= MODE: FORGOT PASSWORD ================= */}
      {mode === 'FORGOT_PWD' && (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="text-center mb-2">
            <p className="text-sm text-slate-400">Enter your email to receive a password reset code.</p>
          </div>
          <div>
            <label htmlFor="reset-email" className="block text-sm text-slate-400 mb-1">Email Address</label>
            <input
              id="reset-email"
              type="email"
              required
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-lg bg-[#0B0F19] border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-lg disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Reset OTP'}
          </button>
          <button type="button" onClick={() => setMode('LOGIN')} className="w-full text-slate-400 text-sm mt-2 hover:text-white">
            &larr; Back to Login
          </button>
        </form>
      )}

      {/* ================= MODE: RESET VERIFY ================= */}
      {mode === 'RESET_VERIFY' && (
        <form onSubmit={handleVerifyResetOtp} className="space-y-4">
           <div className="text-center mb-2">
            <p className="text-sm text-slate-400">Reset code sent to <span className="text-cyan-400">{email}</span></p>
          </div>
          <div>
            <label htmlFor="reset-otp" className="block text-sm text-slate-400 mb-1">Enter Reset OTP</label>
            <input
              id="reset-otp"
              type="text"
              required
              maxLength={6}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-lg bg-[#0B0F19] border border-slate-700 text-white text-center text-2xl tracking-[0.5em] focus:border-cyan-400 focus:outline-none"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#8B5CF6] hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      )}

      {/* ================= MODE: SET NEW PASSWORD ================= */}
      {mode === 'SET_PWD' && (
        <form onSubmit={handleSetNewPassword} className="space-y-4">
          <div>
            <label htmlFor="new-pass" className="block text-sm text-slate-400 mb-1">Enter New Password</label>
            <input
              id="new-pass"
              type="password"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="w-full px-4 py-3 rounded-lg bg-[#0B0F19] border border-slate-700 text-white focus:border-cyan-400 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-lg disabled:opacity-50">
            {loading ? 'Saving...' : 'Save New Password'}
          </button>
        </form>
      )}

    </div>
  );
}