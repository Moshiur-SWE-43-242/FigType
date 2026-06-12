import React, { useState, useEffect, useRef } from 'react';
import { User, ShieldCheck, Mail, Zap, Coins, Flame, Award, Trash, Save, LogOut, CheckCircle, Activity, Trophy, Code, Printer, FileText, Camera } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, BarChart, Bar } from 'recharts';
import { User as UserType } from '../types';
import { jsPDF } from 'jspdf';

interface Props {
  userToken: string;
  currentUser: UserType;
  onUserPropsUpdated: (updated: UserType) => void;
  onLogoutTriggered: () => void;
}

interface UserStats {
  attemptsCount: number;
  averageWpm: number;
  bestWpm: number;
  averageAccuracy: number;
  levels: number;
  coinsBalance: number;
  activeStreakCount: number;
}

const areaChartTooltipStyle = {
  backgroundColor: '#090d16',
  border: '1px solid #1e293b',
  borderRadius: '8px',
};

const tooltipLabelStyleCyan = {
  color: '#00F3FF',
  fontWeight: 'bold' as const,
};

const tooltipLabelStyleGreen = {
  color: '#00FF95',
  fontWeight: 'bold' as const,
};

function LevelProgressBar({ xp, level }: { xp: number; level: number }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      const percentage = `${Math.min(100, (xp / (level * 150)) * 100)}%`;
      ref.current.style.width = percentage;
    }
  }, [xp, level]);

  return (
    <div className="w-full h-2 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
      <div ref={ref} className="h-full bg-[#00F3FF] neon-shadow-blue transition-all duration-300 progress-fill" />
    </div>
  );
}

const PRESET_AVATARS = [
  { name: 'Neon Samurai', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80' },
  { name: 'Cybernetic Spec', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80' },
  { name: 'Hologram Operator', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=150&auto=format&fit=crop&q=80' },
  { name: 'Quantum Core', url: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=150&auto=format&fit=crop&q=80' }
];

const METRIC_BADGES = [
  { id: 'FIRST_STEPS', title: 'First Stride', desc: 'Sustained positive activity progression on courses', milestone: 'Earn XP > 0', icon: 'CheckCircle', color: 'text-emerald-400 border-emerald-500/30' },
  { id: 'FLAMING_SPEEDSTER', title: 'Flaming Speedster', desc: 'Broke basic speed barriers in speed match', milestone: 'Hit speed >= 60 WPM', icon: 'Flame', color: 'text-amber-400 border-amber-500/30' },
  { id: 'TACTICAL_ELITE', title: 'Tactical Elite', desc: 'Elite muscle-memory velocity index certified', milestone: 'Hit speed >= 90 WPM', icon: 'ShieldCheck', color: 'text-cyan-400 border-cyan-500/30' },
  { id: 'PERFECT_CADENCE', title: 'Perfect Accuracy', desc: 'Zero neuromuscular kinetic coordination slippage', milestone: 'Accuracy >= 98% in tests', icon: 'Award', color: 'text-purple-400 border-purple-500/30' },
  { id: 'STREAK_WARRIOR', title: 'Pace Keeper', desc: 'Outstanding operational consistency streak', milestone: 'Keep a streak >= 3 days', icon: 'Flame', color: 'text-rose-400 border-rose-500/30' },
  { id: 'COIN_COLLECTOR', title: 'Coin Baron', desc: 'Earned and banked bountiful gold tokens', milestone: 'Bank coins count >= 100', icon: 'Coins', color: 'text-yellow-400 border-yellow-500/30' },
  { id: 'LEVEL_MASTER', title: 'Grand Archivist', desc: 'Possesses master-level tactile endurance', milestone: 'Achieve level >= 5', icon: 'Zap', color: 'text-pink-400 border-pink-500/30' }
];

export default function UserProfilePanel({ userToken, currentUser, onUserPropsUpdated, onLogoutTriggered }: Props) {
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [socialLink, setSocialLink] = useState(currentUser.socialLink || '');
  const [institute, setInstitute] = useState(currentUser.institute || '');
  const [professionalRole, setProfessionalRole] = useState(currentUser.professionalRole || '');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [attemptsList, setAttemptsList] = useState<any[]>([]);

  // Client-side computed live telemetry derived directly from valid sessions
  const validAttempts = (attemptsList || []).filter(a => (a.wpm || 0) > 0);
  const liveAttemptsCount = validAttempts.length;
  const liveAverageWpm = liveAttemptsCount 
    ? Math.round(validAttempts.reduce((sum, item) => sum + (Number(item.wpm) || 0), 0) / liveAttemptsCount) 
    : 0;
  const liveBestWpm = liveAttemptsCount 
    ? Math.max(...validAttempts.map(a => Number(a.wpm) || 0)) 
    : 0;
  const liveAverageAccuracy = liveAttemptsCount 
    ? Number((validAttempts.reduce((sum, item) => sum + (Number(item.accuracy) || 0), 0) / liveAttemptsCount).toFixed(1)) 
    : 100;

  const displayStats = {
    averageWpm: liveAverageWpm,
    bestWpm: liveBestWpm,
    averageAccuracy: liveAverageAccuracy,
    attemptsCount: liveAttemptsCount,
    levels: stats?.levels || currentUser.level,
    coinsBalance: stats?.coinsBalance || currentUser.coins,
    activeStreakCount: stats?.activeStreakCount || currentUser.streak
  };
  
  const [themePreference, setThemePreference] = useState(currentUser.themePreference || 'theme_cyan');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [dragActive, setDragActive] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const importGoogleAvatar = async () => {
    if (!currentUser.email) {
      alert("No email address attached to this profile.");
      return;
    }
    const emailLower = currentUser.email.toLowerCase().trim();
    if (!emailLower.endsWith('gmail.com')) {
      alert("Automatic Google account sync is available for Gmail profile addresses only.");
      return;
    }
    
    // Construct unavatar.io/gmail link which pulls public Google profile photos instantly
    const googleAvatar = `https://unavatar.io/gmail/${emailLower}`;
    setAvatarUrl(googleAvatar);
    await saveSettings(themePreference, googleAvatar);
    alert("Successfully linked and imported your official Google profile image!");
  };

  const downloadPdfReport = () => {
    try {
      const doc = new jsPDF();
      
      // Theme colors
      const primaryColor = [13, 27, 44]; // Deep slate
      const secondaryColor = [0, 243, 255]; // Neon blue/cyan
      const textColor = [25, 30, 36]; // Off-black
      const darkGray = [80, 80, 80];
      const lightGray = [240, 242, 245];
      
      // Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, 'F');
      
      // Banner text
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("FIGTYP TYPING PERFORMANCE REPORT", 20, 25);
      
      // Accent line
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.rect(0, 38, 210, 2, 'F');
      
      // Profile Details Section
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("USER PROFILE SPECIFICATIONS", 20, 55);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 57, 190, 57);
      
      // User info fields
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      doc.setFont("Helvetica", "bold");
      doc.text("Full Name:", 20, 68);
      doc.setFont("Helvetica", "normal");
      doc.text(String(currentUser.fullName || currentUser.username || 'N/A'), 50, 68);
      
      doc.setFont("Helvetica", "bold");
      doc.text("Email Address:", 20, 75);
      doc.setFont("Helvetica", "normal");
      doc.text(String(currentUser.email || 'N/A'), 50, 75);
      
      doc.setFont("Helvetica", "bold");
      doc.text("Account Status:", 20, 82);
      doc.setFont("Helvetica", "normal");
      doc.text(String(currentUser.role || 'USER'), 50, 82);
      
      // Level/Streak Cards (Side column or small cards)
      doc.setFont("Helvetica", "bold");
      doc.text("Current Level:", 125, 68);
      doc.setFont("Helvetica", "normal");
      doc.text(`Level ${currentUser.level || 1}`, 155, 68);
      
      doc.setFont("Helvetica", "bold");
      doc.text("FigCoins Balance:", 125, 75);
      doc.setFont("Helvetica", "normal");
      doc.text(`${currentUser.coins || 0} fig`, 155, 75);
      
      doc.setFont("Helvetica", "bold");
      doc.text("Active Day Streak:", 125, 82);
      doc.setFont("Helvetica", "normal");
      doc.text(`${currentUser.streak || 0} Days`, 155, 82);
      
      // Analytics Readout
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("TACTILE KINETIC TELEMETRY", 20, 100);
      doc.line(20, 102, 190, 102);
      
      // 2x2 Grid for core metrics
      // Card 1
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(20, 110, 80, 22, 3, 3, 'F');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text("AVERAGE TYPING VELOCITY", 25, 116);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${displayStats.averageWpm} WPM`, 25, 126);
      
      // Card 2
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(110, 110, 80, 22, 3, 3, 'F');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text("ALL-TIME VELOCITY PEAK", 115, 116);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 160, 100); // emerald green
      doc.text(`${displayStats.bestWpm} WPM`, 115, 126);
      
      // Card 3
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(20, 137, 80, 22, 3, 3, 'F');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text("OVERALL TYPING PRECISION", 25, 143);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${displayStats.averageAccuracy}% ACC`, 25, 153);
      
      // Card 4
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(110, 137, 80, 22, 3, 3, 'F');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text("TOTAL SESSIONS EXECUTED", 115, 143);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(110, 50, 180); // purple
      doc.text(`${displayStats.attemptsCount} Session(s)`, 115, 153);
      
      // Typing Session History Table
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("HISTORICAL SESSION LOGS (RECENT 10)", 20, 175);
      doc.line(20, 177, 190, 177);
      
      // Table Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(20, 183, 170, 8, 'F');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("SESSION ID", 22, 188);
      doc.text("MODE", 50, 188);
      doc.text("DURATION", 82, 188);
      doc.text("VELOCITY", 110, 188);
      doc.text("ACCURACY", 138, 188);
      doc.text("DATE", 162, 188);
      
      // Table Rows
      let yIndex = 197;
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      
      const limitedAttempts = validAttempts.slice(0, 10);
      if (limitedAttempts.length === 0) {
        doc.setFont("Helvetica", "italic");
        doc.text("No registered typing sessions found. Complete training or practice exercises to view data.", 30, yIndex);
      } else {
        limitedAttempts.forEach((att, idx) => {
          if (idx % 2 === 1) {
            doc.setFillColor(245, 247, 250);
            doc.rect(20, yIndex - 5, 170, 7, 'F');
          }
          
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(String(att.id || `att-${idx+1}`).substring(0, 10), 22, yIndex);
          doc.text(String(att.mode || 'Standard'), 50, yIndex);
          doc.text(`${att.duration || 30}s`, 82, yIndex);
          doc.text(`${att.wpm || 0} WPM`, 110, yIndex);
          doc.text(`${att.accuracy || 100}%`, 138, yIndex);
          
          let dateStr = 'N/A';
          if (att.createdAt) {
            dateStr = new Date(att.createdAt).toLocaleDateString();
          }
          doc.text(dateStr, 162, yIndex);
          yIndex += 7;
        });
      }
      
      // Footer signature
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(`Report generated by MiraCore Logix Core System Engine at ${new Date().toLocaleString()}`, 20, 275);
      doc.text(`Official Developer Signature Verification: Md Moshiur Rahaman Riat`, 20, 280);
      
      doc.save(`FigTyp_Performance_Report_${currentUser.username || 'user'}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Error generating your PDF performance report. Please verify connection stats.");
    }
  };

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProfileStats();
    const intervalId = setInterval(() => {
      fetchProfileStats();
    }, 2500);

    return () => {
      clearInterval(intervalId);
    };
  }, [currentUser.id, userToken]);

  const fetchProfileStats = async () => {
    try {
      const res = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setStats(data.stats);
        if (data.user) {
          onUserPropsUpdated(data.user);
          if (data.user.themePreference) setThemePreference(data.user.themePreference);
          if (data.user.avatarUrl) setAvatarUrl(data.user.avatarUrl);
        }
      }

      const res2 = await fetch('/api/attempts', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      if (res2.ok) {
        const attemptsData = await res2.json();
        setAttemptsList(attemptsData);
      }
    } catch (e) {
      console.warn("Could not retrieve user stats or historical attempts list:", e);
    } finally {
      setFetchLoading(false);
    }
  };

  const getAttemptDaysSet = () => {
    const activeDays = new Set<string>();
    validAttempts.forEach(att => {
      if (att.createdAt) {
        const dateStr = att.createdAt.split('T')[0];
        activeDays.add(dateStr);
      }
    });
    return activeDays;
  };

  const getCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay.getDay(); 
    
    const days: Array<{ dateStr: string; dayNum: number; isPadding: boolean; isActive: boolean; isToday: boolean }> = [];
    
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const d = String(prevDate.getDate()).padStart(2, '0');
      const dateStr = `${prevDate.getFullYear()}-${m}-${d}`;
      days.push({
        dateStr,
        dayNum: prevDate.getDate(),
        isPadding: true,
        isActive: false,
        isToday: false
      });
    }
    
    const activeDaysSet = getAttemptDaysSet();
    const todayStr = today.toISOString().split('T')[0];
    
    for (let day = 1; day <= totalDays; day++) {
      const m = String(month + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      const dateStr = `${year}-${m}-${d}`;
      days.push({
        dateStr,
        dayNum: day,
        isPadding: false,
        isActive: activeDaysSet.has(dateStr) || (day === today.getDate() && currentUser.streak > 0),
        isToday: dateStr === todayStr
      });
    }
    
    return days;
  };

  const saveSettings = async (themePref: string, avatarUrlVal: string) => {
    setSavingSettings(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          themePreference: themePref,
          avatarUrl: avatarUrlVal
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          onUserPropsUpdated(data.user);
          setSuccessMsg('Tactile terminal preferences synchronized!');
          setTimeout(() => setSuccessMsg(''), 4000);
        }
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to update neural theme preferences.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatarUrl(base64);
      saveSettings(themePreference, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarUrl(base64);
        saveSettings(themePreference, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- OPTIMISTIC UI: UPDATE PROFILE ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setLoading(true);

    if (!username.trim()) {
      setErrorMsg('Username field cannot be left blank.');
      setLoading(false);
      return;
    }

    // OPTIMISTIC UPDATE: Update UI and main App State Instantly
    const updatedUser = {
      ...currentUser,
      username: username.trim(),
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      socialLink: socialLink.trim(),
      institute: institute.trim(),
      professionalRole: professionalRole.trim()
    };
    
    onUserPropsUpdated(updatedUser);
    setSuccessMsg('Tactile credentials updated safely.');
    setTimeout(() => setSuccessMsg(''), 4000);

    try {
      await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          userId: currentUser.id,
          username: username.trim(),
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          socialLink: socialLink.trim(),
          institute: institute.trim(),
          professionalRole: professionalRole.trim()
        })
      });
    } catch {
      console.warn("Backend missing, profile saved locally.");
    } finally {
      setLoading(false);
    }
  };

  const recentAttempts = validAttempts.slice(-10);
  const startNum = Math.max(1, validAttempts.length - recentAttempts.length + 1);
  const graphData = recentAttempts.map((att, i) => ({
    name: `S-${startNum + i}`,
    wpm: att.wpm || 0,
    rawWpm: att.rawWpm || att.wpm || 0,
    accuracy: att.accuracy || 100,
    consistency: att.consistency || Math.min(100, Math.max(10, Math.round(100 - (att.wrongKeysCount || 0) * 4))),
  }));

  const mistakeCountMap: Record<string, number> = {};
  validAttempts.forEach(att => {
    if (att.errorHeatmap) {
      Object.entries(att.errorHeatmap).forEach(([char, count]) => {
        const c = String(char).toLowerCase();
        if (c.match(/[a-z]/)) {
          mistakeCountMap[c] = (mistakeCountMap[c] || 0) + Number(count);
        }
      });
    }
  });

  const maxMistakes = Math.max(1, ...Object.values(mistakeCountMap));

  const standardRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  return (
    <div id="user-profile-hubs" className="max-w-5xl mx-auto px-4 pt-1 pb-6 space-y-6 text-slate-100">
      
      {/* Upper Branded Profile Identity card */}
      <div id="profile-identity-card" className="relative p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-[#101524] to-slate-950 border border-slate-800/80 overflow-hidden">
        <div id="identity-glow" className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#00F3FF]/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt="Tactile Avatar Identification"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#00F3FF] shadow-lg neon-shadow-blue"
                  referrerPolicy="no-referrer"
                />
              ) : currentUser.email && currentUser.email.toLowerCase().endsWith('gmail.com') ? (
                <img
                  src={`https://unavatar.io/gmail/${currentUser.email.toLowerCase()}`}
                  alt="Tactile Gmail Identification"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#00F3FF] shadow-lg neon-shadow-blue"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as any).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00F3FF] to-[#8B5CF6] flex items-center justify-center font-display font-extrabold text-[#06080F] text-2xl shadow-lg neon-shadow-blue text-glow-cyan text-white">
                  {username.slice(0, 2).toUpperCase() || 'FT'}
                </div>
              )}
              {/* Camera Hover Edit Selector Overlay */}
              <button
                onClick={() => {
                  setShowAvatarEdit(!showAvatarEdit);
                  setCustomAvatarUrl(currentUser.avatarUrl || '');
                }}
                className="absolute inset-0 bg-slate-950/80 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 border border-[#00F3FF] cursor-pointer"
                title="Change Avatar URL"
              >
                <Camera className="w-5 h-5 text-[#00F3FF]" />
                <span className="text-[8px] font-mono text-slate-300 uppercase mt-1">Change</span>
              </button>
            </div>

            <div className="space-y-1">
              {showAvatarEdit ? (
                <div className="space-y-2 bg-slate-950/95 border border-[#00F3FF]/30 rounded-xl p-3 max-w-xs relative animate-fadeIn ml-2">
                  <span className="text-[10px] font-mono font-semibold tracking-wide text-[#00F3FF] block">
                    Upload Custom Avatar URL
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      aria-label="Custom avatar image URL"
                      placeholder="https://example.com/photo.jpg"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#00F3FF] w-full"
                    />
                    <button
                      onClick={async () => {
                        setAvatarUrl(customAvatarUrl);
                        await saveSettings(themePreference, customAvatarUrl);
                        setShowAvatarEdit(false);
                      }}
                      className="bg-[#00F3FF]/20 text-[#00F3FF] hover:bg-[#00F3FF]/30 border border-[#00F3FF] px-2 py-1 rounded text-xs font-mono font-bold cursor-pointer transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowAvatarEdit(false)}
                      className="text-slate-400 hover:text-white px-1.5 py-1 text-xs font-mono"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-display font-semibold text-white">{fullName || username || 'Anonymous Typist'}</h2>
                    <span className="text-[9px] font-mono tracking-widest uppercase bg-slate-950 p-1 rounded text-[#00F3FF] border border-slate-800 flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> {currentUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" /> {currentUser.email}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono shrink-0">
            <div className="px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-center min-w-[80px]">
              <span className="text-[9px] text-slate-50 relative top-0.5 block uppercase">Level</span>
              <span className="text-md font-bold text-[#00F3FF]">{currentUser.level}</span>
            </div>
            <div className="px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-center min-w-[80px]">
              <span className="text-[9px] text-slate-50 relative top-0.5 block uppercase">Coins</span>
              <span className="text-md font-bold text-amber-400">{currentUser.coins}</span>
            </div>
            <div className="px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-center min-w-[80px]">
              <span className="text-[9px] text-slate-50 relative top-0.5 block uppercase">Streak</span>
              <span className="text-md font-bold text-red-400 flex items-center justify-center gap-0.5">
                <Flame className="w-4 h-4 text-red-500 fill-red-500 inline" /> {currentUser.streak}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div id="profile-detailed-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Metrics and Analytics readout */}
        <div className="md:col-span-2 space-y-8">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-850 pb-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#00F3FF] flex items-center gap-2">
                <Activity className="w-4 h-4 animate-pulse" /> Live Performance Analytics
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF95] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00FF95]"></span>
                </span>
                <span className="text-[9px] text-[#00FF95]/80 font-mono tracking-wider lowercase font-semibold bg-[#00FF95]/5 border border-[#00FF95]/20 px-1 py-0.2 rounded">realtime</span>
              </h3>
              <button
                onClick={downloadPdfReport}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-[#00F3FF] text-[#00F3FF] hover:text-white font-mono text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download PDF Report</span>
              </button>
            </div>

            {fetchLoading ? (
              <div className="text-center py-10 font-mono text-xs text-slate-500">
                Evaluating physical telemetry coefficients...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Average WPM card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 block">Average Velocity</span>
                    <strong className="text-2xl font-mono text-white tracking-tight">{displayStats.averageWpm} <span className="text-xs text-slate-500">WPM</span></strong>
                  </div>
                  <Activity className="w-10 h-10 text-slate-800" />
                </div>

                {/* Top Speed card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 block">All-time Peak</span>
                    <strong className="text-2xl font-mono text-[#00FF95] tracking-tight">{displayStats.bestWpm} <span className="text-xs text-slate-500">WPM</span></strong>
                  </div>
                  <Trophy className="w-10 h-10 text-slate-800" />
                </div>

                {/* Accuracy card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 block">Overall Precision</span>
                    <strong className="text-2xl font-mono text-white tracking-tight">{displayStats.averageAccuracy}%</strong>
                  </div>
                  <Award className="w-10 h-10 text-slate-800" />
                </div>

                {/* Attempts count card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 block">Total Exercises Run</span>
                    <strong className="text-2xl font-mono text-[#8B5CF6] tracking-tight">{displayStats.attemptsCount} <span className="text-xs text-slate-500">Sessions</span></strong>
                  </div>
                  <Code className="w-10 h-10 text-slate-800" />
                </div>

              </div>
            )}

            {/* Level progression bar */}
            <div className="pt-2 border-t border-slate-850 space-y-2">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-slate-500 uppercase">Level Progress</span>
                <span className="text-slate-400">{currentUser.xp} XP</span>
              </div>
              <LevelProgressBar xp={currentUser.xp} level={currentUser.level} />
            </div>

            {/* Visual calendar daily streak tracker */}
            <div className="pt-6 border-t border-slate-850 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-mono font-semibold text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <Flame className="w-4 h-4 text-red-500 fill-red-500" /> Daily Workout Calendar
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono">Completed daily exercises are stamped in neon emerald</p>
                </div>
                <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-mono font-bold text-red-400 flex items-center gap-1 shrink-0">
                  🔥 {currentUser.streak} Day Streak
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-850/80 rounded-xl space-y-3">
                <div className="text-center font-mono text-[11px] text-[#00F3FF] font-semibold">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                
                {/* Days of the week header */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-mono text-slate-500 uppercase font-bold">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {getCalendarDays().map((dayCell, idx) => (
                    <div
                      key={idx}
                      title={dayCell.isActive ? `Practice Run Tracked! Date: ${dayCell.dateStr}` : `No records on ${dayCell.dateStr}`}
                      className={`
                        aspect-square rounded-lg flex flex-col items-center justify-center font-mono text-xs transition relative group cursor-pointer h-9 w-9 mx-auto
                        ${dayCell.isActive 
                          ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-glow-green scale-[1.03] shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                          : dayCell.isPadding
                            ? 'bg-slate-950/20 border border-transparent text-slate-700 opacity-20'
                            : 'bg-slate-900 border border-slate-850 text-slate-400 hover:border-slate-700'
                        }
                        ${dayCell.isToday && !dayCell.isActive ? 'border-dashed border-[#00F3FF]/75 text-[#00F3FF] font-bold bg-[#00F3FF]/5' : ''}
                      `}
                    >
                      <span>{dayCell.dayNum}</span>
                      
                      {dayCell.isActive && (
                        <span className="absolute bottom-1 w-1 h-1 bg-[#10b981] rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-900">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-850 inline-block" /> Rest Day
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500/15 border border-emerald-500/40 inline-block" /> Workout Tracked
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Custom Biometric Visualizations & Recharts Panel */}
          {validAttempts.length > 0 && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Graphic stats dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* WPM Trend Chart */}
                <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-[#00F3FF]">Velocity Progression</span>
                    <span className="text-[9px] font-mono text-slate-500">Last 10 Runs</span>
                  </div>
                  <h4 className="text-xs font-mono text-slate-300">WPM Rate Curve (Net vs Raw)</h4>
                  <div className="h-52 w-full font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={graphData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00F3FF" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#00F3FF" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#131b2e" />
                        <XAxis dataKey="name" stroke="#515d74" />
                        <YAxis stroke="#515d74" />
                        <Tooltip
                          contentStyle={areaChartTooltipStyle}
                          labelStyle={tooltipLabelStyleCyan}
                        />
                        <Area type="monotone" dataKey="wpm" name="Net WPM" stroke="#00F3FF" strokeWidth={2} fillOpacity={1} fill="url(#colorWpm)" />
                        <Area type="monotone" dataKey="rawWpm" name="Raw WPM" stroke="#8B5CF6" strokeWidth={1} strokeDasharray="4 4" fill="none" />
                        <Legend />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Accuracy & Consistency Graph */}
                <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-[#00FF95]">Rhythmic Precision</span>
                    <span className="text-[9px] font-mono text-slate-500">Last 10 Runs</span>
                  </div>
                  <h4 className="text-xs font-mono text-slate-300">Accuracy & Consistency Curve (%)</h4>
                  <div className="h-52 w-full font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={graphData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#131b2e" />
                        <XAxis dataKey="name" stroke="#515d74" />
                        <YAxis stroke="#515d74" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={areaChartTooltipStyle}
                          labelStyle={tooltipLabelStyleGreen}
                        />
                        <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#00FF95" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="consistency" name="Consistency %" stroke="#FFA726" strokeWidth={1.5} dot={{ r: 3 }} />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Physical Biometric Mistake Key Heatmap */}
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-[#FF4D6D] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF4D6D] animate-ping" />
                    Biometric Mistake Heatmap
                  </h4>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Aggregated char fails count</span>
                </div>
                
                <p className="text-[11px] text-slate-400 leading-normal font-sans">
                  The visual layout of the mechanical board below reflects your keystroke error intensities. Reddish-pink glowing keys indicate characters that present consistent neuromuscular friction.
                </p>

                {/* Keyboard Grid representation */}
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                  {standardRows.map((row, rIdx) => (
                    <div key={rIdx} className="flex justify-center gap-1.5 sm:gap-2">
                      {row.map((char) => {
                        const errorCount = mistakeCountMap[char] || 0;
                        // Calculate opacity style based on mistake count
                        let bgStyle = 'bg-slate-900 text-slate-500 border-slate-800';
                        let glowStyle = '';
                        if (errorCount > 0) {
                          const errorRatio = errorCount / maxMistakes;
                          if (errorRatio > 0.7) {
                            bgStyle = 'bg-[#FF4D6D] text-white border-none';
                            glowStyle = 'shadow-[0_0_12px_rgba(255,77,109,0.5)]';
                          } else if (errorRatio > 0.4) {
                            bgStyle = 'bg-[#FF4D6D]/60 text-slate-100 border-[#FF4D6D]/40';
                          } else {
                            bgStyle = 'bg-[#FF4D6D]/20 text-slate-300 border-[#FF4D6D]/20';
                          }
                        }
                        
                        return (
                          <div 
                            key={char} 
                            title={`Mistakes count: ${errorCount}`}
                            className={`w-7.5 h-7.5 sm:w-9 sm:h-9 ${bgStyle} ${glowStyle} border rounded-lg flex flex-col items-center justify-center font-mono text-xs select-none transition`}
                          >
                            <span className="uppercase font-semibold">{char}</span>
                            {errorCount > 0 && (
                              <span className="text-[7.5px] opacity-75 font-bold">{errorCount}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Dynamic Badges & Achievements Display */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> Earned Badges & Milestones
              </h3>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {currentUser.badges?.length || 0} / {METRIC_BADGES.length} Unlocked
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-normal font-sans">
              Perform training lessons, raise your levels, collect gold coins, and log daily streaks to unlock premium biometric achievements.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {METRIC_BADGES.map((badge) => {
                const isUnlocked = currentUser.badges?.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-xl border transition-all duration-300 flex items-start gap-3 ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-amber-500/20 shadow-sm shadow-amber-500/5'
                        : 'bg-slate-950/40 border-slate-900/60 opacity-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg border shrink-0 ${
                      isUnlocked ? badge.color : 'text-slate-600 border-slate-800 bg-slate-900'
                    }`}>
                      {badge.id === 'FIRST_STEPS' && <CheckCircle className="w-4 h-4" />}
                      {badge.id === 'FLAMING_SPEEDSTER' && <Flame className="w-4 h-4" />}
                      {badge.id === 'TACTICAL_ELITE' && <ShieldCheck className="w-4 h-3.5" />}
                      {badge.id === 'PERFECT_CADENCE' && <Award className="w-4 h-4" />}
                      {badge.id === 'STREAK_WARRIOR' && <Flame className="w-4 h-4" />}
                      {badge.id === 'COIN_COLLECTOR' && <Coins className="w-4 h-4" />}
                      {badge.id === 'LEVEL_MASTER' && <Zap className="w-4 h-4" />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <h4 className={`text-xs font-semibold font-display ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                          {badge.title}
                        </h4>
                        {isUnlocked ? (
                          <span className="text-[8px] font-mono uppercase bg-amber-500/10 text-amber-400 px-1 border border-amber-500/20 rounded">
                            Unlocked
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono uppercase bg-slate-900 text-slate-600 px-1 border border-slate-800 rounded">
                            Locked
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight font-sans">{badge.desc}</p>
                      <p className="text-[9px] text-slate-505 font-mono italic">Req: {badge.milestone}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification Audit Log info */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400">Account Integrity Statement</h4>
            <p className="text-slate-500 text-xs leading-relaxed font-sans">
              This terminal operates with cryptographic biometric keystroke telemetry, securing record submissions. Records yielding anomalous speed signatures trigger immediate suspicious telemetry warnings within the <strong>Super Admin Auditing Consoles</strong>. Keep typing clean and practice vertically!
            </p>
          </div>
        </div>

        {/* Right Column: Settings, Credentials & Logout */}
        <div className="space-y-8">
          
          {/* User Settings: Themes & Avatar Upload */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#00F3FF] flex items-center gap-2">
              <Zap className="w-4 h-4" /> Personalization Hub
            </h3>

            {/* Theme Preference selector */}
            <div className="space-y-3">
              <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono">
                Active Terminal Color Theme
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'theme_cyan', name: 'Cyber Cyan', color: 'bg-[#00F3FF]' },
                  { id: 'theme_emerald', name: 'Tactile Jade', color: 'bg-[#00FF95]' },
                  { id: 'theme_crimson', name: 'Crimson Apex', color: 'bg-[#FF4D6D]' },
                  { id: 'theme_vaporwave', name: 'Vibe Amethyst', color: 'bg-[#D946EF]' },
                  { id: 'theme_citrine', name: 'Citrine Gold', color: 'bg-[#F2994A]' },
                  { id: 'theme_slate', name: 'Alloy Slate', color: 'bg-[#94A3B8]' }
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      setThemePreference(th.id);
                      saveSettings(th.id, avatarUrl);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-mono text-[10px] transition flex items-center gap-2 cursor-pointer ${
                      themePreference === th.id
                        ? 'border-[#00F3FF]/60 bg-[#00F3FF]/5 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-755 hover:bg-slate-950 hover:text-slate-300'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${th.color}`} />
                    <span>{th.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Selection & Custom Upload */}
            <div className="space-y-4 pt-4 border-t border-slate-850">
              <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono">
                Avatar Identification Identity
              </label>

              {/* Presets Grid */}
              <div className="space-y-2">
                <span className="text-[9px] text-slate-500 font-mono tracking-wider block uppercase">Select High-tech Preset</span>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((av, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(av.url);
                        saveSettings(themePreference, av.url);
                      }}
                      className={`p-0.5 rounded-xl border overflow-hidden cursor-pointer transition ${
                        avatarUrl === av.url
                          ? 'border-[#00F3FF] scale-105 shadow-sm shadow-[#00F3FF]/40'
                          : 'border-slate-800 hover:border-slate-700 opacity-80'
                      }`}
                      title={av.name}
                    >
                      <img src={av.url} alt={av.name} className="w-full h-10 object-cover rounded-lg" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Automatic Gmail avatar importer */}
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={importGoogleAvatar}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-[#00F3FF] font-mono text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Import Google Account Photo</span>
                </button>
              </div>

              {/* Upload Custom Drag & Drop */}
              <div className="space-y-2">
                <span className="text-[9px] text-slate-500 font-mono tracking-wider block uppercase">Or Upload Custom Avatar File</span>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-[#00F3FF] bg-[#00F3FF]/5 animate-pulse'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-750 hover:bg-slate-950/85'
                  }`}
                  onClick={() => document.getElementById('avatar-file-input')?.click()}
                >
                  <input
                    type="file"
                    id="avatar-file-input"
                    className="hidden"
                    accept="image/*"
                    aria-label="Upload custom avatar image"
                    onChange={handleAvatarFileChange}
                  />
                  <div className="space-y-1 font-mono text-[10px] text-slate-400 select-none">
                    <p className="font-semibold text-[#00F3FF]">Drag & drop avatar image here</p>
                    <p className="text-slate-500 text-[9px]">or click to select file manually</p>
                  </div>
                </div>
              </div>
            </div>

            {savingSettings && (
              <span className="text-[9px] font-mono text-[#00F3FF] animate-pulse block text-center uppercase">
                Writing terminal configuration sectors...
              </span>
            )}
          </div>

          {/* Edit account specifics */}
          <form onSubmit={handleUpdateProfile} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#00F3FF] flex items-center gap-2 mb-2">
              <User className="w-4 h-4" /> Customized Credentials
            </h3>

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] text-center">
                ✓ {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 text-[#FF4D6D] font-mono text-[11px] text-center">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Public Alias / Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-[#00F3FF] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
                placeholder="TactileGamer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-[#00F3FF] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
                placeholder="Md Moshiur"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-[#00F3FF] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
                placeholder="+880 1712 345 678"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Professional Role</label>
              <input
                type="text"
                value={professionalRole}
                onChange={(e) => setProfessionalRole(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-[#00F3FF] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
                placeholder="Typing Coach / QA Engineer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Institute / Organization</label>
              <input
                type="text"
                value={institute}
                onChange={(e) => setInstitute(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-[#00F3FF] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
                placeholder="MiraCore Academy"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Public Social Link</label>
              <input
                type="url"
                value={socialLink}
                onChange={(e) => setSocialLink(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-850 focus:border-[#00F3FF] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#00F3FF]/40"
                placeholder="https://linkedin.com/in/yourname"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#00F3FF]/15 hover:bg-[#00F3FF]/25 text-[#00F3FF] hover:text-[#00F3FF] border border-[#00F3FF]/40 font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-2 shadow-md hover:shadow-[#00F3FF]/10 select-none"
            >
              <Save className="w-4 h-4" /> {loading ? 'Saving Profile...' : 'Save Credentials'}
            </button>
          </form>

          {/* Immediate Red Logout Action button */}
          <div className="p-6 rounded-2xl bg-[#FF4D6D]/5 border border-[#FF4D6D]/10 space-y-4">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#FF4D6D] block">Danger Zone</h4>
              <p className="text-[10px] text-slate-500 font-sans mt-1">
                Conclude and clear local sandboxed cookies and active session tokens.
              </p>
            </div>
            
            <button
              onClick={onLogoutTriggered}
              className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Close Session Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}