import React, { useState, useEffect } from 'react';
import { 
  Keyboard, BookOpen, Users, Bot, Award, Shield, HelpCircle, 
  Coins, Zap, LogOut, User, Bell, ChevronRight, Menu, X, Landmark
} from 'lucide-react';
import { User as UserType, TypingAttempt, CMSNotice } from './types';

import AuthInterface from './components/AuthInterface';
import PracticeArena from './components/PracticeArena';
import CourseTraining from './components/CourseTraining';
import OnlineContestArena from './components/OnlineContestArena';
import AICoachPanel from './components/AICoachPanel';
import Certificator from './components/Certificator';
import SuperAdminConsole from './components/SuperAdminConsole';
import AboutCompany from './components/AboutCompany';
import BrandedFooter from './components/BrandedFooter';
import UserProfilePanel from './components/UserProfilePanel';

type TabType = 'PRACTICE' | 'TRAINING' | 'MULTIPLAYER' | 'COACH' | 'REWARDS' | 'ADMIN' | 'ABOUT' | 'PROFILE';

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('PRACTICE');
  const [notices, setNotices] = useState<CMSNotice[]>([]);
  const [attempts, setAttempts] = useState<TypingAttempt[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [websiteLogo, setWebsiteLogo] = useState<string>('');
  const [founderPicture, setFounderPicture] = useState<string>('');
  const [mSquareLogo, setMSquareLogo] = useState<string>('');
  const [founderPictureSize, setFounderPictureSize] = useState<number>(48);

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    // If authenticated, fetch session-specific notices and attempts history
    if (user) {
      fetchGlobalCMSNotices();
      fetchMySessionAttempts(token || user.id);
    }
  }, [user, token]);

  const fetchBranding = async () => {
    try {
      const res = await fetch('/api/settings/logo');
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setWebsiteLogo(data.websiteLogo || '');
      }
    } catch (e) {
      console.warn("Could not fetch database website settings logo:", e);
    }
    try {
       const res = await fetch('/api/settings/founder-picture');
       const contentType = res.headers.get("content-type");
       if (res.ok && contentType && contentType.includes("application/json")) {
         const data = await res.json();
         setFounderPicture(data.founderPicture || '');
       }
     } catch (e) {
       console.warn("Could not fetch database website founder picture:", e);
     }
     try {
       const res = await fetch('/api/settings/founder-picture-size');
       const contentType = res.headers.get("content-type");
       if (res.ok && contentType && contentType.includes("application/json")) {
         const data = await res.json();
         setFounderPictureSize(data.founderPictureSize || 48);
       }
     } catch (e) {
       console.warn("Could not fetch database website founder picture size:", e);
     }
    try {
      const res = await fetch('/api/settings/m-square-logo');
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setMSquareLogo(data.mSquareLogo || '');
      }
    } catch (e) {
      console.warn("Could not fetch database website mSquareLogo:", e);
    }
  };

  const fetchGlobalCMSNotices = async () => {
    try {
      const res = await fetch('/api/notices');
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setNotices(data);
      }
    } catch (e) {
      console.warn("Could not fetch global CMS notices:", e);
    }
  };

  const fetchMySessionAttempts = async (explicitToken?: string) => {
    const activeToken = explicitToken || token;
    if (!activeToken) return;
    try {
      const res = await fetch('/api/attempts', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setAttempts(data);
      }
    } catch (e) {
      console.warn("Could not fetch typing attempts:", e);
    }
  };

  // Callback to award FigCoins and Leveling XP points
  const handleCoinsAwarded = (coinsBonus: number, xpBonus: number) => {
    if (!user) return;
    setUser((prevUser) => {
      if (!prevUser) return null;
      const totalXp = prevUser.xp + xpBonus;
      // Simple formula: each level takes (currentLevel * 150) XP
      const nextLevelThreshold = prevUser.level * 150;
      let nextLevel = prevUser.level;
      let remainingXp = totalXp;

      if (remainingXp >= nextLevelThreshold) {
        remainingXp -= nextLevelThreshold;
        nextLevel += 1;
      }

      return {
        ...prevUser,
        coins: prevUser.coins + coinsBonus,
        xp: remainingXp,
        level: nextLevel
      };
    });
  };

  const handleAuthenticated = (loggedInUser: UserType, userToken: string) => {
    setUser(loggedInUser);
    setToken(loggedInUser.id); // Simulating token matching database user id
    setActiveTab('PRACTICE');
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    setActiveTab('PRACTICE');
  };

  // If user is guest/logged in, load page, else render login pane
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between">
        
        {/* Simple Header */}
        <header className="border-b border-slate-900 bg-slate-950/80 p-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div 
              onClick={() => { window.location.href = '/'; }}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition duration-200 select-none active:scale-95 transform"
              title="Home Page"
            >
              {websiteLogo ? (
                <img src={websiteLogo} alt="Logo Brand" className="w-8 h-8 object-cover rounded-lg border border-slate-800" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00F3FF] to-blue-600 flex items-center justify-center font-display font-bold text-white text-md">
                  FT
                </div>
              )}
              <div>
                <span className="text-sm font-semibold tracking-wider font-display text-white uppercase block leading-none">
                  FIG<span className="text-[#00F3FF]">TYPE</span>
                </span>
                <span className="text-[7px] font-mono text-slate-500 uppercase block leading-none mt-0.5">MIRACORE</span>
                <span className="text-[7px] font-mono text-slate-500 uppercase block leading-none mt-0.5">ARENA</span>
              </div>
            </div>
            
            <div className="font-mono text-[10px] text-slate-500 uppercase flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#00F3FF]" /> Established 2025
            </div>
          </div>
        </header>

        {/* Hero split panel */}
        <main className="flex-1 flex flex-col justify-center py-12 px-6">
          <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 text-left">
              <span className="text-[10px] font-mono font-semibold tracking-widest text-[#00F3FF] uppercase px-3 py-1 bg-[#00F3FF]/10 rounded-full">
                The World's Premier Neural Typing Arena
              </span>
              <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
                Train Kinetic Muscle Memory with premium typing coaching
              </h1>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Unlock high-performance coding speeds under monitored practice workflows. Created by software engineers at Daffodil University, powered by MiraCore Logix.
              </p>

              <div className="grid grid-cols-2 gap-4 font-mono text-[11px] text-slate-500 border-t border-slate-900 pt-6">
                <div>
                  <strong className="text-slate-300 block mb-0.5">Dual Super Admin</strong>
                  Assigned program emails automatically.
                </div>
                <div>
                  <strong className="text-slate-300 block mb-0.5">Standard Exams</strong>
                  Accurate PDF seal certificates issued.
                </div>
              </div>
            </div>

            {/* Auth panel wrapper */}
            <AuthInterface onAuthenticated={handleAuthenticated} websiteLogo={websiteLogo} />

          </div>
        </main>

        <BrandedFooter onSelectTab={(tab) => setActiveTab(tab as TabType)} />
      </div>
    );
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  return (
    <div id="app-workspace" className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col justify-between">
      
      {/* Dynamic Mega Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur sticky top-0 z-50 p-4">
        {/* Marquee Banners CMS Notice board - placed INSIDE sticky header to guarantee no layout or navigation overlap */}
        {notices.length > 0 && (
          <div id="notices-marquee" className="bg-[#FF4D6D]/10 border border-[#FF4D6D]/15 text-slate-100 py-2 px-3 rounded-xl mb-3">
            <div className="w-full flex items-center justify-between gap-4 font-mono text-[10px] px-2 md:px-6">
              <div className="flex items-center gap-2 shrink-0">
                <Bell className="w-3.5 h-3.5 text-red-500 animate-bounce" />
                <strong className="text-[#FF4D6D] uppercase text-[9px]">CMS FLASH NOTICE:</strong>
              </div>
              
              <div className="flex-1 overflow-hidden relative h-4">
                <div className="absolute whitespace-nowrap animate-marquee flex items-center gap-8">
                  {notices.map((notice) => (
                    <span key={notice.id} className="text-slate-300">
                      &bull; <strong className="text-white">{notice.title}</strong>: {notice.content} 
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

         <div className="w-full flex items-center justify-between px-2 md:px-6">
          
          {/* Logo brand */}
          <div 
            onClick={() => setActiveTab('PRACTICE')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition duration-200 select-none active:scale-95 transform group"
            title="Home / Practice Arena"
          >
            {websiteLogo ? (
              <img src={websiteLogo} alt="Logo Brand" className="w-9 h-9 object-cover rounded-lg border border-slate-800 transition group-hover:border-[#00F3FF]/40" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#00F3FF] to-[#8B5CF6] flex items-center justify-center font-display font-extrabold text-white text-md shadow-md neon-shadow-blue transition group-hover:brightness-110">
                FT
              </div>
            )}
            <div>
              <span className="text-sm font-bold tracking-wider font-display text-white uppercase block group-hover:text-[#00F3FF] transition duration-250">
                FIG<span className="text-[#00F3FF]">TYPE</span>
              </span>
              <span className="text-[8px] font-mono text-slate-500 uppercase block leading-none">MIRACORE</span>
              <span className="text-[8px] font-mono text-slate-500 uppercase block leading-none mt-0.5">ARENA</span>
            </div>
          </div>

          {/* Desktop right-aligned consolidated navigation and widgets bar */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4 ml-auto">
            
            {/* Desktop Tab links selector */}
            <nav className="flex items-center gap-[3px] bg-slate-900/60 p-1 rounded-xl border border-slate-850">
              <button
                onClick={() => setActiveTab('PRACTICE')}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1 ${activeTab === 'PRACTICE' ? 'bg-[#00F3FF]/15 text-[#00F3FF] font-bold border-b-2 border-[#00F3FF]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Keyboard className="w-3.5 h-3.5" /> Practice Arena
              </button>
              <button
                onClick={() => setActiveTab('TRAINING')}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1 ${activeTab === 'TRAINING' ? 'bg-[#00F3FF]/15 text-[#00F3FF] font-bold border-b-2 border-[#00F3FF]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Courses
              </button>
              <button
                onClick={() => setActiveTab('MULTIPLAYER')}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1 ${activeTab === 'MULTIPLAYER' ? 'bg-[#00F3FF]/15 text-[#00F3FF] font-bold border-b-2 border-[#00F3FF]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Users className="w-3.5 h-3.5" /> Race Esports
              </button>
              <button
                onClick={() => setActiveTab('COACH')}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1 ${activeTab === 'COACH' ? 'bg-[#00F3FF]/15 text-[#00F3FF] font-bold border-b-2 border-[#00F3FF]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Bot className="w-3.5 h-3.5" /> Coach
              </button>
              <button
                onClick={() => setActiveTab('REWARDS')}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1 ${activeTab === 'REWARDS' ? 'bg-[#00F3FF]/15 text-[#00F3FF] font-bold border-b-2 border-[#00F3FF]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Award className="w-3.5 h-3.5" /> PDF Certificates
              </button>
              <button
                onClick={() => setActiveTab('ABOUT')}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1 ${activeTab === 'ABOUT' ? 'bg-[#00F3FF]/15 text-[#00F3FF] font-bold border-b-2 border-[#00F3FF]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Landmark className="w-3.5 h-3.5" /> About
              </button>
              <button
                onClick={() => setActiveTab('PROFILE')}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1 ${activeTab === 'PROFILE' ? 'bg-[#00F3FF]/15 text-[#00F3FF] font-bold border-b-2 border-[#00F3FF]' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <User className="w-3.5 h-3.5" /> Profile
              </button>
              
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('ADMIN')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition cursor-pointer flex items-center gap-1 ${activeTab === 'ADMIN' ? 'bg-red-500/20 text-red-400 font-bold border-b-2 border-red-500' : 'text-rose-400 hover:text-rose-200'}`}
                >
                  <Shield className="w-3.5 h-3.5 text-red-500" /> Admin
                </button>
              )}
            </nav>

            {/* User Account telemetry and economy widgets */}
            <div className="flex items-center gap-4">
              
              {/* XP circular level meter */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs">
                <Zap className="w-4 h-4 text-[#00F3FF] animate-pulse" />
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block leading-none">Level {user.level}</span>
                  <span className="text-slate-300 block">{user.xp} XP</span>
                </div>
              </div>

              {/* FigCoin balancing */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs text-amber-400">
                <Coins className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block leading-none">Coins</span>
                  <span className="font-bold text-amber-300">{user.coins} FigCoins</span>
                </div>
              </div>

              {/* User credentials logout toggle */}
              <div className="w-px h-8 bg-slate-850" />
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => setActiveTab('PROFILE')} 
                  className="text-right cursor-pointer group select-none"
                  title="View Account Profile & Analytics"
                >
                  <span className="text-xs font-semibold text-white group-hover:text-[#00F3FF] transition block truncate max-w-[100px]">{user.username}</span>
                  <span className="text-[9px] font-mono text-slate-500 uppercase block group-hover:text-[#00F3FF]/40 transition">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 border border-slate-850 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-lg cursor-pointer transition"
                  title="Logout from session workspace"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 bg-slate-900 border border-slate-850 rounded-lg cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-900 space-y-3 font-mono text-xs">
            <button
              onClick={() => { setActiveTab('PRACTICE'); setIsMobileMenuOpen(false); }}
              className={`w-full py-2.5 text-left px-2 rounded-lg flex items-center gap-2 ${activeTab === 'PRACTICE' ? 'bg-[#00F3FF]/10 text-[#00F3FF]' : 'text-slate-400'}`}
            >
              <Keyboard className="w-4 h-4" /> Practice Arena
            </button>
            <button
              onClick={() => { setActiveTab('TRAINING'); setIsMobileMenuOpen(false); }}
              className={`w-full py-2.5 text-left px-2 rounded-lg flex items-center gap-2 ${activeTab === 'TRAINING' ? 'bg-[#00F3FF]/10 text-[#00F3FF]' : 'text-slate-400'}`}
            >
              <BookOpen className="w-4 h-4" /> Academic Courses
            </button>
            <button
              onClick={() => { setActiveTab('MULTIPLAYER'); setIsMobileMenuOpen(false); }}
              className={`w-full py-2.5 text-left px-2 rounded-lg flex items-center gap-2 ${activeTab === 'MULTIPLAYER' ? 'bg-[#00F3FF]/10 text-[#00F3FF]' : 'text-slate-400'}`}
            >
              <Users className="w-4 h-4" /> Race Lobbies
            </button>
            <button
              onClick={() => { setActiveTab('COACH'); setIsMobileMenuOpen(false); }}
              className={`w-full py-2.5 text-left px-2 rounded-lg flex items-center gap-2 ${activeTab === 'COACH' ? 'bg-[#00F3FF]/10 text-[#00F3FF]' : 'text-slate-400'}`}
            >
              <Bot className="w-4 h-4" /> Coach
            </button>
            <button
              onClick={() => { setActiveTab('REWARDS'); setIsMobileMenuOpen(false); }}
              className={`w-full py-2.5 text-left px-2 rounded-lg flex items-center gap-2 ${activeTab === 'REWARDS' ? 'bg-[#00F3FF]/10 text-[#00F3FF]' : 'text-slate-400'}`}
            >
              <Award className="w-4 h-4" /> PDF Certificates
            </button>
            <button
              onClick={() => { setActiveTab('ABOUT'); setIsMobileMenuOpen(false); }}
              className={`w-full py-2.5 text-left px-2 rounded-lg flex items-center gap-2 ${activeTab === 'ABOUT' ? 'bg-[#00F3FF]/10 text-[#00F3FF]' : 'text-slate-400'}`}
            >
              <Landmark className="w-4 h-4" /> About Company
            </button>
            <button
              onClick={() => { setActiveTab('PROFILE'); setIsMobileMenuOpen(false); }}
              className={`w-full py-2.5 text-left px-2 rounded-lg flex items-center gap-2 ${activeTab === 'PROFILE' ? 'bg-[#00F3FF]/10 text-[#00F3FF]' : 'text-slate-400'}`}
            >
              <User className="w-4 h-4" /> Personal Profile
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => { setActiveTab('ADMIN'); setIsMobileMenuOpen(false); }}
                className={`w-full py-2.5 text-left px-2 rounded-lg flex items-center gap-2 ${activeTab === 'ADMIN' ? 'bg-red-500/10 text-red-400 font-bold' : 'text-rose-400'}`}
              >
                <Shield className="w-4 h-4" /> Super Admin Portal
              </button>
            )}

            <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-amber-500" /> {user.coins} Coins</span>
              <button 
                onClick={handleLogout}
                className="text-red-400 font-bold"
              >
                Logout Session &rarr;
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Render selected workspace tabs */}
      <main className="flex-grow">
        <div className="animate-fadeIn mt-1">
          {activeTab === 'PRACTICE' && (
            <PracticeArena 
              userToken={token} 
              onAttemptSaved={(att) => setAttempts([att, ...attempts])}
              onCoinsAwarded={handleCoinsAwarded}
            />
          )}

          {activeTab === 'TRAINING' && (
            <CourseTraining 
              userToken={token} 
              onCoinsAwarded={handleCoinsAwarded}
            />
          )}

          {activeTab === 'MULTIPLAYER' && (
            <OnlineContestArena 
              userToken={token} 
              username={user.username}
              onCoinsAwarded={handleCoinsAwarded}
            />
          )}

          {activeTab === 'COACH' && (
            <AICoachPanel 
              userToken={token} 
              recentAttempts={attempts}
            />
          )}

          {activeTab === 'REWARDS' && (
            <Certificator 
              userToken={token} 
              onCertificateIssued={fetchMySessionAttempts}
            />
          )}

           {activeTab === 'ABOUT' && (
            <AboutCompany websiteLogo={websiteLogo} founderPicture={founderPicture} mSquareLogo={mSquareLogo} founderPictureSize={founderPictureSize} />
          )}

          {activeTab === 'PROFILE' && (
            <UserProfilePanel 
              userToken={token}
              currentUser={user}
              onUserPropsUpdated={setUser}
              onLogoutTriggered={handleLogout}
            />
          )}

          {activeTab === 'ADMIN' && isSuperAdmin && (
            <SuperAdminConsole 
              userToken={token} 
              founderPictureSize={founderPictureSize}
              onLogoUpdated={(logoVal) => setWebsiteLogo(logoVal)}
              onFounderPictureUpdated={(picVal) => setFounderPicture(picVal)}
              onFounderPictureSizeUpdated={(size) => setFounderPictureSize(size)}
              onMSquareLogoUpdated={(mSquareVal) => setMSquareLogo(mSquareVal)}
            />
          )}
        </div>
      </main>

      {/* Branded Footer details */}
      <BrandedFooter onSelectTab={(tab) => setActiveTab(tab as TabType)} />

    </div>
  );
}
