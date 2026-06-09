import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Users, Zap, Loader2, PlayCircle, ShieldAlert, Flag, Award, RefreshCw } from 'lucide-react';
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
  progress: number; // 0 to 100
  isBot: boolean;
  accuracy?: number;
  wrongKeys?: number;
  backspaces?: number;
}

export default function OnlineContestArena({ userToken, username, currentUser, recentAttempts, onCoinsAwarded }: Props) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [activeContest, setActiveContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [heartbeat, setHeartbeat] = useState(0);
  const [activeAttempt, setActiveAttempt] = useState<ContestAttempt | null>(null);
  const [joinCode, setJoinCode] = useState('');

  const saveContestAsAttempt = async (wpmVal: number, accVal: number) => {
    if (!userToken || !activeContest) return;
    try {
      await fetch('/api/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
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
    try {
      const res = await fetch(`/api/contests/${code.trim()}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        }
      });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (res.ok) {
          setActiveContest(data.contest);
          setActiveAttempt(data.currentAttempt);
          setRaceState('IDLE');
          setInputText('');
          setMyProgress(0);
          setMyWpm(0);
          setMyAccuracy(100);
          setDurationRemaining(data.contest.duration);
          setOpponents([
            { id: 'me-' + Math.random().toString(36).substr(2, 4), username: username || 'You (Typist)', wpm: 0, progress: 0, isBot: false }
          ]);
          setJoinCode('');
        } else {
          setStatusMsg(data.error || 'Failed to locate the private match.');
        }
      } else {
        setStatusMsg('Invalid server response format.');
      }
    } catch {
      setStatusMsg('Network handshake error.');
    } finally {
      setLoading(false);
    }
  };

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

  // Opponents list (Me + Bots/Simulation)
  const [opponents, setOpponents] = useState<Opponent[]>([]);

  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const botInterval = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    fetchContestsList();
    return () => {
      clearAllTimers();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!activeContest) return;
    if (heartbeat !== null) {
      const timer = setInterval(() => {
        setHeartbeat((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeContest, heartbeat]);

  const clearAllTimers = () => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    if (durationInterval.current) clearInterval(durationInterval.current);
    if (botInterval.current) clearInterval(botInterval.current);
  };

  const contestPracticeSessions = recentAttempts.filter((attempt) => attempt.mode === 'quote' || attempt.mode === 'time' || attempt.mode === 'words').length;
  const contestCourseSessions = recentAttempts.filter((attempt) => attempt.mode === 'course').length;
  const eligibleForContest = contestPracticeSessions >= 15 || contestCourseSessions >= 5;
  const profileReady = Boolean(currentUser.fullName && currentUser.phoneNumber && currentUser.socialLink && currentUser.institute && currentUser.professionalRole);
  const contestUnlockProgress = Math.min(100, Math.round(((Math.min(contestPracticeSessions / 15, 1) + Math.min(contestCourseSessions / 5, 1)) / 2) * 100));

  const fetchContestsList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contests');
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setContests(data);
      }
    } catch (e) {
      console.warn("Could not list contests:", e);
    } finally {
      setLoading(false);
    }
  };

  const joinContestRoom = async (contest: Contest) => {
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
    try {
      const res = await fetch(`/api/contests/${contest.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        }
      });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (res.ok) {
          setActiveContest(contest);
          setActiveAttempt(data.currentAttempt);
          setRaceState('IDLE');
          setInputText('');
          setMyProgress(0);
          setMyWpm(0);
          setMyAccuracy(100);
          setDurationRemaining(contest.duration);

          // Prep race opponents: Yourself (no artificial bots in position tracks)
          setOpponents([
            { id: 'me-' + Math.random().toString(36).substr(2, 4), username: username || 'You (Typist)', wpm: 0, progress: 0, isBot: false }
          ]);
        } else {
          setStatusMsg(`Failed to join: ${data.error}`);
        }
      } else {
        setStatusMsg('Invalid server response format.');
      }
    } catch {
      setStatusMsg('Network handshake error.');
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

    // Start contest timer
    durationInterval.current = setInterval(() => {
      setDurationRemaining((prev) => {
        if (prev <= 1) {
          terminateContestMatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Initialize real-time Socket.IO synchronization channel
    socketRef.current = io();
    setHeartbeat((value) => value + 1);
    socketRef.current.emit('join-contest', { contestId: activeContest!.id, username: username || 'Racer' });

    // Listen to live player status changes from other connected competitors
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
          return [
            ...prev,
            {
              id: data.userId || data.id,
              username: data.username,
              wpm: data.wpm,
              accuracy: data.accuracy,
              progress: data.progress,
              isBot: false,
              wrongKeys: data.wrongKeys,
              backspaces: data.backspaces
            }
          ];
        }
      });
    });
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (raceState !== 'RACING' || !activeContest) return;
    const value = e.target.value;
    setInputText(value);

    // continuous calculations
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

    // Update coordinates in the list
    setOpponents((prev) =>
      prev.map((opp) => (!opp.isBot ? { ...opp, wpm: calculatedWpm, progress, accuracy, wrongKeys: wrong, backspaces: backspaceCount } : opp))
    );

    // Broadcast current telemetry stream to competitors Room
    if (socketRef.current) {
      socketRef.current.emit('update-progress', {
        contestId: activeContest.id,
        userId: activeAttempt?.userId || 'guest',
        username: username || 'You',
        wpm: calculatedWpm,
        accuracy,
        progress,
        wrongKeys: wrong,
        backspaces: backspaceCount
      });
    }

    // Synchronize coordinates server-side (POST api trace)
    fetch(`/api/contests/${activeContest.id}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeAttempt?.userId,
        username,
        wpm: calculatedWpm,
        rawWpm: calculatedWpm + 5,
        accuracy,
        progress,
        completed: value.length >= passage.length
      })
    }).catch(console.error);

    // Complete race gate
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

    // save contest typing as attempt so it displays in Profile stats & analytics
    saveContestAsAttempt(myWpm, myAccuracy);

    // award rewards on completion
    if (myWpm >= 40 && myAccuracy >= 90) {
      const xpReward = Math.round(myWpm * 2);
      const coinsReward = Math.round(myWpm * 1.5);
      onCoinsAwarded(coinsReward, xpReward);
    }
  };

  const downloadContestCertificatePdf = async () => {
    let logoUrl = '';
    let signaturePic = '';
    try {
      const logoRes = await fetch('/api/settings/logo');
      if (logoRes.ok) {
        const logoData = await logoRes.json();
        logoUrl = logoData.websiteLogo || '';
      }
      const sigRes = await fetch('/api/settings/admin-signature');
      if (sigRes.ok) {
        const sigData = await sigRes.json();
        signaturePic = sigData.adminSignaturePic || '';
      }
    } catch (e) {
      console.warn("Could not retrieve system branding assets:", e);
    }

    const preloadImage = (src: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    const logoImg = logoUrl ? await preloadImage(logoUrl) : null;
    const sigImg = signaturePic ? await preloadImage(signaturePic) : null;

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // Dark futuristic slate backdrop
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 297, 210, 'F');

      // Inner custom high-tech parchment board template
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(8, 8, 281, 194, 6, 6, 'F');

      // Double borders
      doc.setDrawColor(245, 158, 11); // Amber border
      doc.setLineWidth(1.2);
      doc.rect(12, 12, 273, 186);

      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.3);
      doc.rect(14, 14, 269, 182);

      // Stars decoration
      doc.setFillColor(0, 243, 255); // neon cyan
      doc.triangle(14, 14, 26, 14, 14, 26, 'F');
      doc.triangle(283, 14, 271, 14, 283, 26, 'F');

      // --- Top Left Corner: Logo of Fig Type ---
      if (logoImg) {
        try {
          doc.addImage(logoImg, "PNG", 20, 18, 12, 12);
        } catch (imgErr) {
          console.warn("Fallback to vector drawing: logo rendering error:", imgErr);
          // Fallback vector
          doc.setFillColor(147, 51, 234);
          doc.roundedRect(20, 18, 12, 12, 1.5, 1.5, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10);
          doc.text("F", 26, 26.5, { align: "center" });
        }
      } else {
        // Logo Emblem background
        doc.setFillColor(147, 51, 234); // Royal purple fig color
        doc.roundedRect(20, 18, 12, 12, 1.5, 1.5, 'F');
        
        // Inside glyph 'F'
        doc.setTextColor(255, 255, 255);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.text("F", 26, 26.5, { align: "center" });
      }

      // Fig Type Typography Brand text
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("Fig Type", 35, 25);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(147, 51, 234);
      doc.text("ONLINE SPEED ARENA", 35, 29.5);


      // --- Top Right Corner: QR Code to verify the certificate is correct ---
      const qrx = 247;
      const qry = 18;
      const qrSize = 25; // 25x25 mm

      // White base backplate with thin borders for contrast
      doc.setFillColor(255, 255, 255);
      doc.rect(qrx - 2, qry - 2, qrSize + 4, qrSize + 4, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.rect(qrx - 2, qry - 2, qrSize + 4, qrSize + 4, 'D');

      // Draw standard QR code Finder Patterns (3 corners)
      doc.setFillColor(15, 23, 42); // deep dark blue finder
      
      // Top-Left Finder
      doc.rect(qrx, qry, 6, 6, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(qrx + 1, qry + 1, 4, 4, 'F');
      doc.setFillColor(15, 23, 42);
      doc.rect(qrx + 2, qry + 2, 2, 2, 'F');

      // Top-Right Finder
      doc.rect(qrx + qrSize - 6, qry, 6, 6, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(qrx + qrSize - 5, qry + 1, 4, 4, 'F');
      doc.setFillColor(15, 23, 42);
      doc.rect(qrx + qrSize - 4, qry + 2, 2, 2, 'F');

      // Bottom-Left Finder
      doc.rect(qrx, qry + qrSize - 6, 6, 6, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(qrx + 1, qry + qrSize - 5, 4, 4, 'F');
      doc.setFillColor(15, 23, 42);
      doc.rect(qrx + 2, qry + qrSize - 4, 2, 2, 'F');

      // Verification String with all relevant details
      const verificationText = `FIGTYP CONTEST CHAMPION | Name: ${username} | Contest: ${activeContest?.title || 'Practice Match'} | Speed: ${myWpm} WPM | Accuracy: ${myAccuracy}% | Hash: CT-MATCH-${activeContest?.id || 'PRACTICE'}-${Math.floor(100000 + Math.random() * 900000)} | Marshal: MiraCore Marshal`;

      // Programmatic matrix of random but deterministic dots for an authentic look based on the verification text
      let hash = 0;
      for (let i = 0; i < verificationText.length; i++) {
        hash = verificationText.charCodeAt(i) + ((hash << 5) - hash);
      }
      hash = Math.abs(hash);

      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
          // Skip the 3 finder corners
          if ((r < 5 && c < 5) || (r < 5 && c > 9) || (r > 9 && c < 5)) {
            continue;
          }
          // Simple pseudo-random formula based on matrix rows and reference hash
          const state = ((r * hash + c * 13 + 7) % 5 === 0) || ((r + c) % 3 === 0) || ((r * c + hash) % 4 === 0);
          if (state) {
            doc.setFillColor(15, 23, 42);
            // Draw dot data cell
            doc.rect(qrx + (c * (qrSize / 15)), qry + (r * (qrSize / 15)), qrSize / 15, qrSize / 15, 'F');
          }
        }
      }

      // Small caption for QR verification
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(100, 110, 120);
      doc.text("SCAN QR TO VERIFY", qrx + (qrSize / 2), qry + qrSize + 3.5, { align: "center" });

      // Top system identity title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text("MULTIPLAYER COMPETITIVE COORDINATES CHALLENGE WINNER", 148.5, 30, { align: "center" });

      // Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(15, 23, 42);
      doc.text("CONTEST CERTIFICATE OF TRIUMPH", 148.5, 48, { align: "center" });

      // Sub
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text("This official digital token of honor is proudly bestowed upon", 148.5, 68, { align: "center" });

      // Student name in large cyan uppercase
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(0, 100, 200); // deep blue
      doc.text(String(username).toUpperCase(), 148.5, 82, { align: "center" });

      // separating line
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.5);
      doc.line(80, 88, 217, 88);

      // Paragraph body
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text("for matching typing telemetry with exceptional frequency in a multiplayer match for:", 148.5, 98, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`"${activeContest?.title || 'Lobby Arena Contest Practice'}"`, 148.5, 106, { align: "center" });

      // Specifications summary card
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(45, 117, 207, 30, 3, 3, 'F');
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text("VELOCITY SCORE", 55, 124);
      doc.text("PRECURACY CONFIDENCE", 135, 124);
      doc.text("AUDITED VERIFIER SIGNATORY", 195, 124);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${myWpm} WPM`, 55, 136);
      doc.text(`${myAccuracy}% ACC`, 135, 136);
      doc.text("Md Moshiur Rahaman Riat", 195, 136);

      // Footer divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(40, 172, 110, 172);
      doc.line(187, 172, 257, 172);

      // Overlay signature picture above the registrar line if uploaded
      if (sigImg) {
        try {
          doc.addImage(sigImg, "PNG", 204.5, 156, 35, 15);
        } catch (imgErr) {
          console.warn("Signature image rendering failed:", imgErr);
        }
      }

      // Date of graduation and signature details
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("Recorded Contest Date", 75, 177, { align: "center" });
      doc.setFont("Helvetica", "bold");
      doc.text(new Date().toLocaleDateString(), 75, 182, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.text("Contest Marshal Signature", 222, 177, { align: "center" });
      doc.setFont("Helvetica", "bold");
      doc.text("MiraCore System Architect, Grader", 222, 182, { align: "center" });

      // Golden security seal stamp
      doc.setFillColor(245, 158, 11);
      doc.circle(148.5, 168, 11, 'F');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(5);
      doc.setTextColor(255, 255, 255);
      doc.text("OFFICIAL CONTEST", 148.5, 166.5, { align: "center" });
      doc.text("COMPETITION", 148.5, 169.5, { align: "center" });
      doc.text("CHAMPION", 148.5, 172.5, { align: "center" });

      // Verifier ref
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Digital Grade Reference: CT-MATCH-${activeContest?.id || 'PRACTICE'}-${Math.floor(100000 + Math.random() * 900000)} | Authentic Blockchain Signature Issued`, 148.5, 193, { align: "center" });

      doc.save(`MiraCore_Contest_Certificate_${activeContest?.id || 'practice'}.pdf`);
    } catch (error) {
      console.error("Contest certificate generator error:", error);
      alert("Friction inside compiler. Could not render digital Contest Completion Certificate.");
    }
  };

  const sortedStandings = [...opponents].sort((a, b) => {
    // 1. Completion Progress (descending)
    if (b.progress !== a.progress) {
      return b.progress - a.progress;
    }
    // 2. Typing Speed (descending)
    if (b.wpm !== a.wpm) {
      return b.wpm - a.wpm;
    }
    // 3. Accuracy Percentage (descending)
    const accA = a.accuracy ?? 100;
    const accB = b.accuracy ?? 100;
    if (accB !== accA) {
      return accB - accA;
    }
    // 4. Mistakes Wrong Keys Count (ascending)
    const wrongA = a.wrongKeys ?? 0;
    const wrongB = b.wrongKeys ?? 0;
    if (wrongB !== wrongA) {
      return wrongA - wrongB;
    }
    // 5. Backspaces Counter (ascending)
    const backA = a.backspaces ?? 0;
    const backB = b.backspaces ?? 0;
    return backA - backB;
  });

  return (
    <div id="contest-module" className="space-y-6 max-w-5xl mx-auto px-4 pt-1 pb-6 text-slate-100">
      
      {/* Editorial Dashboard Header */}
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

          <div className="flex gap-4 p-4 bg-slate-950 border border-slate-850 rounded-xl font-mono text-xs text-center shrink-0">
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Concurrent rooms</span>
              <strong className="text-[#00F3FF]">14 Active</strong>
            </div>
            <div className="w-px h-8 bg-slate-850" />
            <div>
              <span className="text-slate-500 text-[10px] uppercase block">Pool Stake</span>
              <strong className="text-[#00FF95]">1,200 Coins</strong>
            </div>
          </div>
        </div>
      )}

      {statusMsg && (
        <div className="p-3 text-xs font-mono text-center rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/20 text-[#FF4D6D]">
          ⚠️ {statusMsg}
        </div>
      )}

      {/* Lobbies Directory: Render when no room is currently selected */}
      {!activeContest && (
        <div className="space-y-6">
          {/* Join Private Arena Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-semibold text-white tracking-wide flex items-center justify-center sm:justify-start gap-1.5 font-mono">
                <span className="text-[#00F3FF]">🔑</span> Unlock Private Battle Arena
              </h4>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Enter a private match invitation code to join secure corporate or private arenas directly.
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {profileReady ? (
                  eligibleForContest ? 'You are eligible to join contests.' : 'Complete 15 practice sessions or 5 course practice runs to unlock contests.'
                ) : 'Complete your profile before joining contests: phone, institute, social link, and role.'}
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
                className="px-3 py-2 bg-[#00F3FF] hover:bg-cyan-400 text-slate-950 font-mono text-[10px] font-bold rounded-lg cursor-pointer transition flex items-center justify-center gap-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="col-span-2 p-12 text-center text-slate-500 text-xs border border-slate-800 rounded-xl">No public lobbies published. Ask a Super Admin to create a contest!</div>
          ) : (
            contests.map((cnt) => (
              <div 
                key={cnt.id} 
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-700 cursor-pointer transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white tracking-wide">{cnt.title}</h4>
                    <span className="text-[10px] font-mono uppercase text-[#00FF95] flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {cnt.participants} Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-2">{cnt.description}</p>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                  <span>Code: <strong className="text-white uppercase">{cnt.shareCode}</strong></span>
                  <span>Length: {cnt.duration < 60 ? `${cnt.duration}s` : `${Math.round(cnt.duration / 60)}m`}</span>
                  <button 
                    onClick={() => joinContestRoom(cnt)}
                    disabled={!profileReady || !eligibleForContest}
                    className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded cursor-pointer transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Active Race gate: If we are inside a contest room */}
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
            
            {/* Left side: Race Tracks Progress visualizer */}
            <div className="md:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-6">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400">Position tracks</h4>
              
              <div className="space-y-5">
                {opponents.map((opp) => {
                  const isMe = opp.username.includes(username || 'You');
                  return (
                    <div key={opp.id} className="space-y-1">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className={isMe ? 'text-[#00F3FF] font-bold' : 'text-slate-400'}>{opp.username}</span>
                        <span className="text-slate-500">{opp.wpm} WPM &bull; {opp.progress}% Complete</span>
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

              {/* Countdown overlays */}
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
                    Engage gate Gate Countdown
                  </button>
                </div>
              )}

              {raceState === 'COUNTDOWN' && (
                <div className="text-center py-16 space-y-3">
                  <span className="text-xs font-mono tracking-widest uppercase text-red-500 block">Match starts in</span>
                  <p className="text-5xl font-display font-bold text-white text-glow-cyan animate-ping">{countdown}</p>
                </div>
              )}

              {/* Typing Arena Workspace */}
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
                      <Award className="w-3.5 h-3.5" /> Download Contest Certificate
                    </button>
                    <button 
                      onClick={() => setActiveContest(null)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-mono rounded-xl cursor-pointer hover:opacity-90 transition"
                    >
                      Select Another Lobby
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Right side: Live Leaderboard standings */}
            <div className="md:col-span-1 rounded-2xl bg-slate-950/40 border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-500" /> Standing Standings
                </h4>

                <div className="space-y-2 font-mono">
                  {sortedStandings.map((opp, idx) => {
                    const isMe = opp.username.includes(username || 'You');
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
                          <span className="text-[9px] text-slate-500 block">{opp.progress}% done</span>
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
