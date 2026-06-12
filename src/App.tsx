import React, { useState, useEffect } from 'react';
import { 
  Keyboard, BookOpen, Users, Bot, Award, Shield, HelpCircle, 
  Coins, Zap, LogOut, User, Bell, ChevronRight, Menu, X, Landmark
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { User as UserType, TypingAttempt, CMSNotice } from './types';

import AuthGateway from './components/AuthGateway';
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
    // Read directly from LocalStorage so it works without backend and updates instantly!
    const localNotices = localStorage.getItem('figtyp_notices');
    if (localNotices) {
      setNotices(JSON.parse(localNotices));
    } else {
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

  const handleCoinsAwarded = (coinsBonus: number, xpBonus: number) => {
    if (!user) return;
    setUser((prevUser) => {
      if (!prevUser) return null;
      let totalXp = prevUser.xp + xpBonus;
      let currentLevel = prevUser.level;
      let remainingXp = totalXp;
      let nextLevelThreshold = currentLevel * 150;

      while (remainingXp >= nextLevelThreshold) {
        remainingXp -= nextLevelThreshold;
        currentLevel += 1;
        nextLevelThreshold = currentLevel * 150;
      }

      return {
        ...prevUser,
        coins: prevUser.coins + coinsBonus,
        xp: remainingXp,
        level: currentLevel
      };
    });
  };

  const handleAuthenticated = (loggedInUser: UserType, userToken: string) => {
    setUser(loggedInUser);
    setToken(userToken);
    setActiveTab('PRACTICE');
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    setActiveTab('PRACTICE');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between">
        
        <header className="border-b border-slate-900 bg-slate-950/80 p-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            
            {/* Left Side: Logo & Brand Name */}
            <div 
              onClick={() => { window.location.href = '/'; }}
              className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition duration-200 select-none active:scale-95 transform"
              title="Home Page"
            >
              {websiteLogo ? (
                <img src={websiteLogo} alt="Logo Brand" className="w-14 h-14 object-cover rounded-xl border border-slate-800 shadow-md" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#00F3FF] to-blue-600 flex items-center justify-center font-display font-bold text-white text-xl shadow-md">
                  FT
                </div>
              )}
              <div className="flex flex-col justify-center text-left">
                <span className="text-2xl font-extrabold tracking-wider font-display text-white uppercase block leading-tight">
                  FIG<span className="text-[#00F3FF]">TYP</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase block leading-none mt-1">MIRACORE</span>
                <span className="text-[10px] font-mono text-slate-500 uppercase block leading-none mt-0.5">ARENA</span>
              </div>
            </div>
            
            {/* Right Side: Established 2025 */}
            <div className="font-mono text-[10px] text-slate-500 uppercase flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#00F3FF]" /> Established 2025
            </div>

          </div>
        </header>

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

            <AuthGateway onAuthenticated={handleAuthenticated} websiteLogo={websiteLogo} />

          </div>
        </main>

        <BrandedFooter onSelectTab={(tab) => setActiveTab(tab as TabType)} />
      </div>
    );
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  return (
    <div id="app-workspace" className="min-h-screen bg-[#06080F] text-slate-100 flex flex-col justify-between">
      
      <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur sticky top-0 z-50 p-4 pb-0">
         <div className="w-full flex items-center justify-between px-2 md:px-6 pb-4">
          
          {/* Main Dashboard Logo - Resized */}
          <div 
            onClick={() => setActiveTab('PRACTICE')}
            className="flex items-center gap-4 cursor-pointer hover:opacity-85 transition duration-200 select-none active:scale-95 transform group"
            title="Home / Practice Arena"
          >
            {websiteLogo ? (
              <img src={websiteLogo} alt="Logo Brand" className="w-14 h-14 object-cover rounded-xl border border-slate-800 transition group-hover:border-[#00F3FF]/40 shadow-lg" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#00F3FF] to-[#8B5CF6] flex items-center justify-center font-display font-extrabold text-white text-xl shadow-lg neon-shadow-blue transition group-hover:brightness-110">
                FT
              </div>
            )}
            <div className="flex flex-col justify-center text-left">
              <span className="text-2xl font-extrabold tracking-wider font-display text-white uppercase block group-hover:text-[#00F3FF] transition duration-250 leading-tight">
                FIG<span className="text-[#00F3FF]">TYP</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase block leading-none mt-1">MIRACORE</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase block leading-none mt-0.5">ARENA</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 lg:gap-4 ml-auto">
            
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

            <div className="flex items-center gap-4">
              
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs">
                <Zap className="w-4 h-4 text-[#00F3FF] animate-pulse" />
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block leading-none">Level {user.level}</span>
                  <span className="text-slate-300 block">{user.xp} XP</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs text-amber-400">
                <Coins className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-slate-500 text-[9px] uppercase block leading-none">Coins</span>
                  <span className="font-bold text-amber-300">{user.coins} FigCoins</span>
                </div>
              </div>

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

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 bg-slate-900 border border-slate-850 rounded-lg cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

        {/* CMS Notice Marquee - Scrolling directly below the main menu bar */}
        {notices.length > 0 && (
          <div className="bg-[#FF4D6D]/10 border-t border-[#FF4D6D]/20 text-slate-100 py-1.5 px-3 overflow-hidden flex items-center -mx-4 md:-mx-6 px-4 md:px-6">
            <div className="flex items-center gap-2 shrink-0 bg-[#FF4D6D]/20 px-2 py-0.5 rounded border border-[#FF4D6D]/30 z-10">
              <Bell className="w-3 h-3 text-red-500 animate-bounce" />
              <strong className="text-[#FF4D6D] uppercase text-[10px] font-mono tracking-widest">CMS FLASH:</strong>
            </div>
            <div className="ml-3 overflow-hidden flex-1">
              <div className="animate-marquee whitespace-nowrap inline-flex items-center text-[11px] font-mono text-slate-300 gap-12">
                {notices.map((notice) => (
                  <span key={notice.id} className="inline-flex items-center gap-2">
                    <span className="text-white font-bold">{notice.title}</span>
                    <span>&bull;</span>
                    <span>{notice.content}</span>
                    <span className="text-slate-500 ml-2">[{new Date(notice.createdAt).toLocaleDateString()}]</span>
                  </span>
                ))}
                {notices.map((notice) => (
                  <span key={`${notice.id}-repeat`} className="inline-flex items-center gap-2">
                    <span className="text-white font-bold">{notice.title}</span>
                    <span>&bull;</span>
                    <span>{notice.content}</span>
                    <span className="text-slate-500 ml-2">[{new Date(notice.createdAt).toLocaleDateString()}]</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-900 space-y-3 font-mono text-xs pb-4">
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

      <main className="flex-grow overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="mt-1"
          >
            {activeTab === 'PRACTICE' && (
              <PracticeArena 
                userToken={token} 
                recentAttempts={attempts}
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
                currentUser={user}
                recentAttempts={attempts}
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
          </motion.div>
        </AnimatePresence>
      </main>

      <BrandedFooter onSelectTab={(tab) => setActiveTab(tab as TabType)} />

    </div>
  );
}