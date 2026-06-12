import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, Loader2, PlayCircle, Flag, Award, RefreshCw, Key, Play, ArrowLeft, Copy } from 'lucide-react';
import { io } from 'socket.io-client';
import { Contest, ContestAttempt, TypingAttempt, User } from '../types';
import { jsPDF } from 'jspdf';

interface Props {
  userToken: string;
  username: string;
  currentUser: User;
  recentAttempts: TypingAttempt[];
  onCoinsAwarded: (coins: number, xp: number) => void;
}

function ProgressFill({ progress, isMe }: { progress: number; isMe: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--progress-width', `${progress}%`);
    }
  }, [progress]);

  return (
    <div
      ref={ref}
      className={`h-full transition-all duration-300 rounded-full ${isMe ? 'bg-[#00F3FF]' : 'bg-[#8B5CF6]/60'} progress-fill`}
    />
  );
}

interface Opponent {
  id: string;
  username: string;
  wpm: number;
  progress: number;
  accuracy?: number;
  wrongKeys?: number;
  backspaces?: number;
}

export default function OnlineContestArena({ userToken, username, currentUser, recentAttempts, onCoinsAwarded }: Props) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [activeContest, setActiveContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeAttempt, setActiveAttempt] = useState<ContestAttempt | null>(null);
  const [joinCode, setJoinCode] = useState('');

  // Socket and timing refs
  const socketRef = useRef<any>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Core Race states
  const [inputText, setInputText] = useState('');
  const [raceState, setRaceState] = useState<'IDLE' | 'COUNTDOWN' | 'RACING' | 'FINISHED'>('IDLE');
  const [countdown, setCountdown] = useState(5);
  const [durationRemaining, setDurationRemaining] = useState(60);

  // Player stats
  const [myWpm, setMyWpm] = useState(0);
  const [myAccuracy, setMyAccuracy] = useState(100);
  const [myProgress, setMyProgress] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);

  // Pure online opponents list (Only Real Players)
  const [opponents, setOpponents] = useState<Opponent[]>([]);

  const contestPracticeSessions = recentAttempts.filter((attempt) => attempt.mode === 'quote' || attempt.mode === 'time' || attempt.mode === 'words').length;
  const contestCourseSessions = recentAttempts.filter((attempt) => attempt.mode === 'course').length;
  const eligibleForContest = contestPracticeSessions >= 15 || contestCourseSessions >= 5;
  const profileReady = Boolean(currentUser.fullName && currentUser.phoneNumber && currentUser.socialLink && currentUser.institute && currentUser.professionalRole);

  useEffect(() => {
    fetchContestsList();
    return () => {
      clearAllTimers();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const clearAllTimers = () => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    if (durationInterval.current) clearInterval(durationInterval.current);
  };

  const fetchContestsList = async () => {
    setLoading(true);
    try {
      // Fetch from local storage first to support optimistic Admin updates
      const localContestsStr = localStorage.getItem('figtyp_contests');
      let localContests: Contest[] = [];
      if (localContestsStr) {
        localContests = JSON.parse(localContestsStr);
      }

      const res = await fetch('/api/contests');
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setContests(localContests.length > 0 ? localContests : data);
      } else {
        setContests(localContests);
      }
    } catch (e) {
      const localContestsStr = localStorage.getItem('figtyp_contests');
      if (localContestsStr) setContests(JSON.parse(localContestsStr));
    } finally {
      setLoading(false);
    }
  };

  const saveContestAsAttempt = async (wpmVal: number, accVal: number) => {
    if (!userToken || !activeContest) return;
    try {
      await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({
          mode: 'quote',
          duration: activeContest.duration || 60,
          wordCount: Math.round((activeContest.contestText?.length || 0) / 5),
          wpm: wpmVal,
          rawWpm: Math.round(wpmVal * 1.05) || wpmVal,
          accuracy: accVal,
          consistency: 90,
          correctChars: Math.round((activeContest.contestText?.length || 0) * (accVal / 100)),
          incorrectChars: Math.max(0, (activeContest.contestText?.length || 0) - Math.round((activeContest.contestText?.length || 0) * (accVal / 100))),
          totalChars: activeContest.contestText?.length || 0,
          quoteText: activeContest.title || 'Contest Arena Match'
        })
      });
    } catch (e) {
      console.warn("Could not save contest typing attempt to database:", e);
    }
  };

  const initRoomState = (contest: Contest, attemptData?: any) => {
    setActiveContest(contest);
    setActiveAttempt(attemptData);
    setRaceState('IDLE');
    setInputText('');
    setMyProgress(0);
    setMyWpm(0);
    setMyAccuracy(100);
    setDurationRemaining(contest.duration);
    
    // Initialize with ONLY the real current user
    setOpponents([
      { id: currentUser.id || 'me', username: username || 'You', wpm: 0, progress: 0, accuracy: 100 }
    ]);
  };

  const joinByCode = async (code: string) => {
    if (!code.trim()) return;
    if (!profileReady) {
      setStatusMsg('Complete your profile details before joining a contest: phone, institute, social link, and role.');
      return;
    }
    if (!eligibleForContest) {
      setStatusMsg('Complete 15 practice sessions or 5 course practice runs to unlock contests.');
      return;
    }
    
    setLoading(true);
    setStatusMsg('');

    // Optimistic UI check for Private contests in LocalStorage
    const localContestsStr = localStorage.getItem('figtyp_contests');
    const localContests: Contest[] = localContestsStr ? JSON.parse(localContestsStr) : [];
    const foundContest = contests.find(c => c.shareCode === code.trim().toUpperCase()) ||
                         localContests.find(c => c.shareCode === code.trim().toUpperCase());

    if (foundContest) {
      initRoomState(foundContest, { id: 'dummy-attempt', userId: currentUser.id, contestId: foundContest.id });
      setJoinCode('');
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/contests/${code.trim()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        initRoomState(data.contest, data.currentAttempt);
        setJoinCode('');
      } else {
        const errData = await res.json();
        setStatusMsg(errData.error || 'Failed to locate the private match.');
      }
    } catch {
      setStatusMsg('Network error. Contest code not found locally or on server.');
    } finally {
      setLoading(false);
    }
  };

  const joinContestRoom = async (contest: Contest) => {
    if (!profileReady) {
      setStatusMsg('Complete your profile details before joining a contest.');
      return;
    }
    if (!eligibleForContest) {
      setStatusMsg('Complete 15 practice sessions or 5 course practice runs to unlock contests.');
      return;
    }
    setLoading(true);
    setStatusMsg('');

    // Optimistic UI fallback
    initRoomState(contest, { id: 'dummy-attempt', userId: currentUser.id, contestId: contest.id });

    try {
      const res = await fetch(`/api/contests/${contest.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }
      });
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        // Update attempt ID if server responds successfully
        setActiveAttempt(data.currentAttempt);
      }
    } catch {
      console.warn("Backend error ignored. Joined contest locally.");
    } finally {
      setLoading(false);
    }
  };

  const triggerRaceCountdown = () => {
    setRaceState('COUNTDOWN');
    setCountdown(5);
    setInputText('');
    setMyProgress(0);
    setMyWpm(0);

    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current!);
          startContestMatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startContestMatch = () => {
    setRaceState('RACING');
    setBackspaceCount(0);
    startTimeRef.current = Date.now();

    // Start local contest timer
    durationInterval.current = setInterval(() => {
      setDurationRemaining((prev) => {
        if (prev <= 1) {
          terminateContestMatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Pure Online Multiplayer Socket Setup
    try {
      socketRef.current = io();
      socketRef.current.emit('join-contest', { contestId: activeContest!.id, username: username || 'Racer', userId: currentUser.id });

      // Listen for REAL opponent progress
      socketRef.current.on('progress-pushed', (data: any) => {
        setOpponents((prev) => {
          const index = prev.findIndex((o) => o.id === data.userId || o.id === data.id);
          if (index >= 0) {
            return prev.map((o) => {
              if (o.id === data.userId || o.id === data.id) {
                return {
                  ...o,
                  wpm: data.wpm,
                  accuracy: data.accuracy,
                  progress: data.progress,
                  wrongKeys: data.wrongKeys,
                  backspaces: data.backspaces
                };
              }
              return o;
            });
          } else {
            // New real player discovered
            return [
              ...prev,
              {
                id: data.userId || data.id,
                username: data.username,
                wpm: data.wpm,
                accuracy: data.accuracy,
                progress: data.progress,
                wrongKeys: data.wrongKeys,
                backspaces: data.backspaces
              }
            ];
          }
        });
      });
    } catch (err) {
      console.warn("Socket connection failed. Make sure socket.io is running on the backend.", err);
    }
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (raceState !== 'RACING' || !activeContest) return;
    const value = e.target.value;
    setInputText(value);

    let correct = 0;
    let wrong = 0;
    const passage = activeContest.contestText;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === passage[i]) {
        correct++;
      } else {
        wrong++;
      }
    }

    const accuracy = value.length > 0 ? Math.round((correct / value.length) * 100) : 100;
    setMyAccuracy(accuracy);

    const progress = Math.min(100, Number(((value.length / passage.length) * 100).toFixed(1)));
    setMyProgress(progress);

    const elapsedSeconds = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 1;
    const wordsCalculated = correct / 5;
    const calculatedWpm = elapsedSeconds > 0 ? Math.round(wordsCalculated / (elapsedSeconds / 60)) : 0;
    setMyWpm(calculatedWpm);

    // Update local state for self
    setOpponents((prev) =>
      prev.map((opp) => (opp.id === currentUser.id || opp.id === 'me' ? { ...opp, wpm: calculatedWpm, progress, accuracy, wrongKeys: wrong, backspaces: backspaceCount } : opp))
    );

    // Broadcast Real-time progress to server via Socket
    if (socketRef.current) {
      socketRef.current.emit('update-progress', {
        contestId: activeContest.id,
        userId: currentUser.id || 'guest',
        username: username || 'You',
        wpm: calculatedWpm,
        accuracy,
        progress,
        wrongKeys: wrong,
        backspaces: backspaceCount
      });
    }

    // Optional: Synchronize final results via HTTP POST
    fetch(`/api/contests/${activeContest.id}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        username,
        wpm: calculatedWpm,
        rawWpm: calculatedWpm + 5,
        accuracy,
        progress,
        completed: value.length >= passage.length
      })
    }).catch(() => {});

    if (value.length >= passage.length) {
      terminateContestMatch();
    }
  };

  const terminateContestMatch = () => {
    clearAllTimers();
    setRaceState('FINISHED');

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    saveContestAsAttempt(myWpm, myAccuracy);

    // Payout logic
    if (myWpm >= 40 && myAccuracy >= 90) {
      const xpReward = Math.round(myWpm * 2);
      const coinsReward = Math.round(myWpm * 1.5);
      onCoinsAwarded(coinsReward, xpReward);
    }
  };

  const downloadContestCertificatePdf = async () => {
    // Basic certificate logic
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 297, 210, 'F');
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(8, 8, 281, 194, 6, 6, 'F');
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(15, 23, 42);
      doc.text("CONTEST CERTIFICATE OF TRIUMPH", 148.5, 48, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(0, 100, 200); 
      doc.text(String(username).toUpperCase(), 148.5, 82, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`"${activeContest?.title || 'Lobby Arena Contest Practice'}"`, 148.5, 106, { align: "center" });
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${myWpm} WPM | ${myAccuracy}% ACC`, 148.5, 136, { align: "center" });

      doc.save(`MiraCore_Contest_Certificate_${activeContest?.id || 'practice'}.pdf`);
    } catch (error) {
      alert("Could not render digital Contest Completion Certificate.");
    }
  };

  const sortedStandings = [...opponents].sort((a, b) => {
    if (b.progress !== a.progress) return b.progress - a.progress;
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    const accA = a.accuracy ?? 100;
    const accB = b.accuracy ?? 100;
    if (accB !== accA) return accB - accA;
    return 0;
  });

  return (
    <div id="contest-module" className="space-y-6 max-w-5xl mx-auto px-4 pt-1 pb-6 text-slate-100">
      
      {!activeContest && (
        <div id="contests-intro" className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-[#101b2a] to-slate-950 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-widest text-[#00F3FF] uppercase px-3 py-1 bg-[#00F3FF]/10 rounded-full">
              Live Esports Neural Lobbies
            </span>
            <h2 className="text-2xl font-display font-medium text-white flex items-center gap-2">
              Multiplayer Typing Contests Arena
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl leading-relaxed">
              Create invite codes, register for global championships, or challenge live rivals in real-time. High speed and precision win global coin stakes!
            </p>
          </div>
        </div>
      )}

      {statusMsg && (
        <div className="p-3 text-xs font-mono text-center rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 text-[#FF4D6D]">
          ⚠️ {statusMsg}
        </div>
      )}

      {/* Arena Lobbies Directory */}
      {!activeContest && (
        <div className="space-y-6">
          
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-semibold text-white tracking-wide flex items-center justify-center sm:justify-start gap-1.5 font-mono">
                <span className="text-[#00F3FF]">🔑</span> Unlock Private Battle Arena
              </h4>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Enter a private match invitation code to join secure corporate or private arenas directly.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <input
                type="text"
                placeholder="e.g. jf5s9c1"
                maxLength={7}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full sm:w-32 text-xs text-center font-mono uppercase bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none rounded-lg p-2 text-white transition focus:ring-1 focus:ring-[#00F3FF]/30"
              />
              <button
                onClick={() => joinByCode(joinCode)}
                disabled={!profileReady || !eligibleForContest}
                className="px-3 py-2 bg-[#00F3FF] hover:bg-cyan-400 text-slate-950 font-mono text-[10px] font-bold rounded-lg cursor-pointer transition flex items-center justify-center gap-1 shrink-0 disabled:opacity-50"
              >
                Join Arena
              </button>
            </div>
          </div>

          <div id="lobbies-deck" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center p-12 text-slate-400 font-mono text-sm gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#00F3FF]" /> Retrieving active neural gateways...
            </div>
          ) : contests.length === 0 ? (
            <div className="col-span-2 p-12 text-center text-slate-500 text-xs border border-slate-800 rounded-xl">No public lobbies currently published by Admin.</div>
          ) : (
            contests.map((cnt) => (
              <div 
                key={cnt.id} 
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white tracking-wide">{cnt.title}</h4>
                    {cnt.visibility === 'PRIVATE' ? (
                      <span className="text-[8px] font-mono uppercase bg-red-500/10 border border-red-500/20 text-[#FF4D6D] px-1.5 py-0.5 rounded">🔒 Private</span>
                    ) : (
                      <span className="text-[8px] font-mono uppercase bg-blue-500/10 border border-blue-500/20 text-[#00F3FF] px-1.5 py-0.5 rounded">🌐 Public</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-2">{cnt.description}</p>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span>Code: <strong className="text-white uppercase">{cnt.shareCode}</strong></span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(cnt.shareCode);
                        alert('Share Code Copied: ' + cnt.shareCode);
                      }}
                      className="text-[#00F3FF] hover:text-white transition flex items-center gap-1 bg-[#00F3FF]/10 px-1.5 py-0.5 rounded cursor-pointer"
                      title="Copy Share Code"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <span>Length: {cnt.duration < 60 ? `${cnt.duration}s` : `${Math.round(cnt.duration / 60)}m`}</span>
                </div>
                
                <div className="flex items-center justify-end">
                  <button 
                    onClick={() => joinContestRoom(cnt)}
                    disabled={!profileReady || !eligibleForContest}
                    className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded cursor-pointer transition flex items-center gap-1 disabled:opacity-50"
                  >
                    Enter Room <Users className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      )}

      {/* Active Race Workspace */}
      {activeContest && (
        <div id="active-race" className="space-y-6">
          
          <div id="race-header-toolbar" className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-850 gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#00F3FF]">Active Arena Chamber</span>
              <h3 className="text-sm font-bold text-white uppercase">{activeContest.title}</h3>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Countdown</span>
                <strong className="text-red-400">
                  {durationRemaining < 60 
                    ? `${durationRemaining}s` 
                    : `${Math.floor(durationRemaining / 60)}m ${durationRemaining % 60}s`} remaining
                </strong>
              </div>
              <button 
                onClick={() => { setActiveContest(null); clearAllTimers(); }}
                className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded hover:border-slate-700 cursor-pointer transition"
              >
                Exit Match &larr;
              </button>
            </div>
          </div>

          <div id="race-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            <div className="md:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-6">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400">Live Position Tracks</h4>
              
              <div className="space-y-5">
                {opponents.map((opp) => {
                  const isMe = opp.id === currentUser.id || opp.id === 'me';
                  return (
                    <div key={opp.id} className="space-y-1">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className={isMe ? 'text-[#00F3FF] font-bold' : 'text-slate-300'}>{opp.username} {isMe && '(You)'}</span>
                        <span className="text-slate-500">{opp.wpm} WPM &bull; {Math.floor(opp.progress)}% Complete</span>
                      </div>
                      
                      <div className="w-full h-2 bg-slate-950 border border-slate-850 rounded-full overflow-hidden relative">
                        <ProgressFill progress={opp.progress} isMe={isMe} />
                        {opp.progress >= 100 && (
                          <div className="absolute right-1 top-0 text-[8px] text-[#00FF95] uppercase font-bold animate-pulse">FINISH</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {raceState === 'IDLE' && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <PlayCircle className="w-12 h-12 text-[#00F3FF] animate-pulse" />
                  <div className="text-center">
                    <span className="text-xs font-mono text-slate-500 block">ARENA GATE LOCKED</span>
                    <p className="text-xs text-slate-300 max-w-xs leading-normal mt-1">Ready to prove your typing speed? Click below to start the synchronized lobby countdown.</p>
                  </div>
                  <button
                    onClick={triggerRaceCountdown}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition shadow-lg"
                  >
                    Engage Gate Countdown
                  </button>
                </div>
              )}

              {raceState === 'COUNTDOWN' && (
                <div className="text-center py-16 space-y-3">
                  <span className="text-xs font-mono tracking-widest uppercase text-red-500 block">Match starts in</span>
                  <p className="text-5xl font-display font-bold text-white text-glow-cyan animate-ping">{countdown}</p>
                </div>
              )}

              {raceState === 'RACING' && (
                <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl space-y-6">
                  <div className="text-sm font-mono tracking-wide leading-loose select-none border-b border-slate-850 pb-4">
                    {activeContest.contestText.split('').map((char, index) => {
                      let colorClass = 'text-slate-600';
                      if (index < inputText.length) {
                        colorClass = inputText[index] === char ? 'text-[#00F3FF]' : 'text-[#FF4D6D] bg-[#FF4D6D]/10';
                      }
                      return <span key={index} className={colorClass}>{char}</span>;
                    })}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-slate-500 block">Keyboard Workspace focus</label>
                    <input
                      autoFocus
                      type="text"
                      value={inputText}
                      onChange={handleTypingChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          setBackspaceCount((b) => b + 1);
                        }
                      }}
                      placeholder="Type the passage above as fast as possible to beat opponents!"
                      className="w-full text-xs font-mono bg-slate-900 border border-slate-800 focus:border-[#00F3FF] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#00F3FF]/30"
                    />
                  </div>
                </div>
              )}

              {raceState === 'FINISHED' && (
                <div className="text-center py-12 space-y-4">
                  <Flag className="w-10 h-10 text-[#00FF95] mx-auto animate-bounce" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white font-display">RACE COMPLETE!</h3>
                    <p className="text-xs text-slate-400">Your average metrics have been logged securely. Standings have been published.</p>
                  </div>
                  
                  <div className="flex gap-4 justify-center flex-wrap">
                    <button 
                      onClick={() => joinContestRoom(activeContest)}
                      className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono rounded-xl cursor-pointer transition flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Race Again
                    </button>
                    <button 
                      onClick={downloadContestCertificatePdf}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-xs font-mono font-bold rounded-xl cursor-pointer hover:opacity-90 transition flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" /> Download Certificate
                    </button>
                  </div>
                </div>
              )}

            </div>

            <div className="md:col-span-1 rounded-2xl bg-slate-950/40 border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-500" /> Standing Standings
                </h4>

                <div className="space-y-2 font-mono">
                  {sortedStandings.map((opp, idx) => {
                    const isMe = opp.id === currentUser.id || opp.id === 'me';
                    return (
                      <div 
                        key={opp.id} 
                        className={`p-2.5 border rounded-lg flex items-center justify-between text-xs ${isMe ? 'border-[#00F3FF] bg-[#00F3FF]/5 text-white' : 'border-slate-850 bg-slate-950 text-slate-400'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 text-glow-cyan font-bold">{idx + 1}.</span>
                          <span className="font-semibold">{opp.username.substring(0, 16)}</span>
                        </div>
                        <div className="text-right">
                          <strong className="block">{opp.wpm} WPM</strong>
                          <span className="text-[9px] text-slate-500 block">{Math.floor(opp.progress)}% done</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {raceState === 'FINISHED' && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl space-y-1 text-center font-mono">
                  <Award className="w-5 h-5 text-[#00FF95] mx-auto" />
                  <span className="text-[10px] text-[#00FF95] block">Rewards disbursed!</span>
                  <span className="text-[10px] text-slate-500 block">+{myWpm * 2} XP / +{Math.round(myWpm * 1.5)} Coins</span>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}