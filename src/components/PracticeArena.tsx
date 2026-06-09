import React, { useState, useEffect, useRef } from 'react';
import { 
  Keyboard, 
  Timer, 
  Volume2, 
  HelpCircle, 
  RefreshCw, 
  Sparkles, 
  Sliders, 
  AlertCircle, 
  Award,
  Globe,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  AlignLeft,
  History,
  Image as ImageIcon,
  Share2,
  Linkedin
} from 'lucide-react';
import { TypingAttempt } from '../types';

interface Props {
  userToken: string;
  recentAttempts: TypingAttempt[];
  onAttemptSaved: (attempt: TypingAttempt) => void;
  onCoinsAwarded: (coins: number, xp: number) => void;
}

const TECH_WORD_BANK = [
  "absolute", "coalition", "deep-tech", "computing", "groups", "engineer", "virtual", "architectures", 
  "redefine", "standard", "digital", "interfaces", "computer", "programs", "structured", "logic", 
  "matrices", "resolve", "biometric", "keystroke", "coordinates", "mathematical", "precision", 
  "MiraCore", "Logix", "empowers", "software", "engineering", "scientists", "Daffodil", "International", 
  "University", "build", "premier", "neural", "typing", "arenas", "muscle", "memory", "elegant", 
  "neuro-motor", "pipeline", "requiring", "warmups", "deliberate", "practice", "persistent", "analysis", 
  "assessment", "keystrokes", "evaluate", "plateaus", "characters", "algorithms", "synergy", "cognitive", 
  "cybernetic", "bandwidth", "latency", "throughput", "compiler", "runtime", "optimization", "synthesizer", 
  "holographic", "interface", "protocol", "quantum", "encryption", "firewall", "mainframe", "database", 
  "distributed", "consensus", "cryptographic", "immutable", "ledger", "artificial", "intelligence", 
  "network", "synapse", "dendrite", "axon", "sensory", "feedback", "kinesthetic", "tactile", "dexterity", 
  "ergonomic", "velocity", "acceleration", "millisecond", "calibration", "diagnostic", "telemetry", 
  "stochastic", "gradient", "descent", "backpropagation", "tensor", "matrix", "vector", "dimension", 
  "recursion", "iteration", "polymorphism", "inheritance", "encapsulation", "abstraction", "asynchronous", 
  "concurrence", "multithreading", "parallelism", "scalability", "robustness", "modular", "syntactic", 
  "sugar", "bytecode", "interpreter", "executable", "firmware", "hardware", "biocompatible", "prosthetic", 
  "augmentation", "synthetic", "evolution", "singularity", "transcendence", "paradigm", "shift", 
  "disruption", "innovation", "enterprise", "ecosystem", "infrastructure", "deployment", "integration", 
  "verification", "diagnostics", "compiler", "execution", "concurrency", "performance", "responsive", 
  "automation", "machine", "learning", "neural-network", "cybersecurity", "analytics", "architecture", 
  "compiler", "optimization", "dynamic", "static", "functional", "object-oriented", "declarative", 
  "imperative", "compile-time", "garbage-collection", "memory-management", "thread-safe", "deadlock", 
  "race-condition", "synchronization", "cryptography", "zero-knowledge", "decentralized", "cloud-native", 
  "kubernetes", "microservices", "serverless", "stateless", "stateful", "latency-critical"
];

const getWordCountForDuration = (seconds: number): number => {
  switch (seconds) {
    case 15: return 20;
    case 30: return 40;
    case 60: return 100;
    case 120: return 200;
    case 180: return 300;
    case 300: return 500;
    case 600: return 1000;
    case 900: return 1500;
    case 1200: return 2000;
    case 1500: return 2500;
    default:
      return Math.max(10, Math.round(seconds * 1.66));
  }
};

const generateDynamicPassage = (wordCount: number): string => {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const randomWord = TECH_WORD_BANK[Math.floor(Math.random() * TECH_WORD_BANK.length)];
    words.push(randomWord);
  }

  const formattedWords = words.map((w, index) => {
    let word = w;
    if (index === 0 || (index > 0 && index % 10 === 0)) {
      word = word.toLowerCase(); // Lowercase look fits Monkeytype nicely
    }
    
    if (index > 0 && index < wordCount - 1) {
      if (index % 15 === 14) {
        word += ".";
      } else if (index % 12 === 11) {
        word += ",";
      }
    }
    return word;
  });

  return formattedWords.join(" ");
};

interface KeyboardProps {
  stats: Record<string, { hits: number; errors: number }>;
  highlightedKey?: string;
  title?: string;
}

function KeyboardLayout({ stats, highlightedKey, title }: KeyboardProps) {
  const rows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  return (
    <div id="keyboard-container" className="w-full flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-950/40 border border-zinc-900 font-mono text-xs select-none">
      {title && (
        <div id="keyboard-header" className="flex items-center justify-between w-full mb-2 px-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{title}</span>
          <span className="text-[9px] text-[#e2b714] bg-[#e2b714]/15 px-1.5 py-0.5 rounded">Accuracy Heatmap</span>
        </div>
      )}
      <div id="keyboard-rows-block" className="flex flex-col gap-1 w-full max-w-[480px]">
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 w-full">
            {rIdx === 1 && <div className="w-3 shrink-0" />}
            {rIdx === 2 && <div className="w-6 shrink-0" />}
            
            {row.map((char) => {
              const keyStat = stats[char.toLowerCase()];
              const hits = keyStat ? keyStat.hits : 0;
              const errors = keyStat ? keyStat.errors : 0;
              const errorRate = hits > 0 ? (errors / hits) * 100 : 0;
              
              let bgClass = "bg-zinc-900 border-zinc-800 hover:border-zinc-700/80 text-zinc-400";
              let shadowClass = "";
              
              if (hits > 0) {
                if (errors === 0) {
                  bgClass = "bg-[#e2b714]/15 border-[#e2b714]/40 text-[#e2b714] font-medium";
                  shadowClass = "shadow-[0_1px_4px_rgba(226,183,20,0.15)]";
                } else if (errorRate < 30) {
                  bgClass = "bg-amber-500/10 border-amber-500/40 text-amber-200 font-medium";
                  shadowClass = "shadow-[0_1px_4px_rgba(245,158,11,0.15)]";
                } else if (errorRate < 60) {
                  bgClass = "bg-orange-500/25 border-orange-500/60 text-orange-200 font-semibold";
                  shadowClass = "shadow-[0_1px_6px_rgba(249,115,22,0.25)]";
                } else {
                  bgClass = "bg-rose-500/30 border-rose-500/70 text-rose-100 font-bold";
                  shadowClass = "shadow-[0_1px_10px_rgba(244,63,94,0.45)]";
                }
              }

              const isTargeting = highlightedKey?.toLowerCase() === char.toLowerCase();
              if (isTargeting) {
                bgClass = "bg-[#e2b714] border-[#e2b714] text-zinc-950 font-extrabold scale-105 transition-transform duration-75 z-10";
                shadowClass = "shadow-[0_0_12px_rgba(226,183,20,1)]";
              }

              return (
                <div
                  id={`key-${char}`}
                  key={char}
                  className={`w-9 h-9 flex flex-col items-center justify-between p-1 rounded-md border-b-2 font-mono uppercase text-[10px] transition-all cursor-help relative group shrink-0 ${bgClass} ${shadowClass}`}
                >
                  <span className="leading-none mt-0.5">{char}</span>
                  {hits > 0 && (
                    <span className="text-[7px] opacity-75 leading-none mb-0.5">
                      {Math.round(100 - errorRate)}%
                    </span>
                  )}

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-950 border border-zinc-805 text-slate-205 px-2 py-1.5 rounded text-[9px] font-mono leading-normal whitespace-nowrap z-50 shadow-2xl">
                    <div className="font-bold text-[#e2b714] uppercase border-b border-zinc-900 pb-0.5 mb-1">Key {char.toUpperCase()}</div>
                    <div>Keystrokes: <span className="text-white font-semibold">{hits}</span></div>
                    <div>Mistakes: <span className="text-red-400 font-semibold">{errors}</span></div>
                    <div>Total Accuracy: <span className="text-emerald-400 font-semibold">{Math.round(100 - errorRate)}%</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Space bar Row */}
        <div className="flex justify-center w-full mt-1">
          {(() => {
            const keyStat = stats[' '];
            const hits = keyStat ? keyStat.hits : 0;
            const errors = keyStat ? keyStat.errors : 0;
            const errorRate = hits > 0 ? (errors / hits) * 100 : 0;
            
            let bgClass = "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700/85";
            let shadowClass = "";
            if (hits > 0) {
              if (errors === 0) {
                bgClass = "bg-emerald-500/10 border-emerald-500/40 text-emerald-300";
                shadowClass = "shadow-[0_1px_4px_rgba(16,185,129,0.15)]";
              } else {
                bgClass = "bg-rose-500/25 border-rose-500/60 text-rose-300";
                shadowClass = "shadow-[0_1px_6px_rgba(244,63,94,0.2)]";
              }
            }
            
            const isTargeting = highlightedKey === ' ';
            if (isTargeting) {
              bgClass = "bg-[#e2b714] border-[#e2b714] text-zinc-950 font-bold scale-105 z-10";
              shadowClass = "shadow-[0_0_12px_#e2b714]";
            }

            return (
              <div
                id="key-spacebar"
                className={`w-36 h-7 flex items-center justify-between px-3 rounded-md border-b-2 font-mono text-[9px] uppercase tracking-wider transition-all cursor-help relative group shrink-0 ${bgClass} ${shadowClass}`}
              >
                <span>Spacebar</span>
                {hits > 0 && <span className="text-[7.5px] opacity-80">{Math.round(100 - errorRate)}% acc</span>}
                
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-950 border border-zinc-800 text-[9px] px-2 py-1.5 rounded font-mono text-left z-50 shadow-2xl whitespace-nowrap">
                  <div className="font-bold text-[#e2b714] uppercase border-b border-zinc-900 pb-0.5 mb-1">SPACEBAR</div>
                  <div>Keystrokes: <span className="text-white font-semibold">{hits}</span></div>
                  <div>Mistakes: <span className="text-red-400 font-semibold">{errors}</span></div>
                  <div>Accuracy: <span className="text-emerald-400 font-semibold">{Math.round(100 - errorRate)}%</span></div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default function PracticeArena({ userToken, onAttemptSaved, onCoinsAwarded }: Props) {
  // Custom Settings
  const [duration, setDuration] = useState<number>(30);
  const [selectedQuote, setSelectedQuote] = useState(() => generateDynamicPassage(40));
  
  // Practice Leaderboard State
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch('/api/leaderboard/practice');
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(data);
      }
    } catch (e) {
      console.warn("Could not retrieve practice leaderboard standings:", e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    loadDailyPracticeSummary();
  }, []);

  // Word Typing Experience States
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWordInput, setCurrentWordInput] = useState('');
  const [wordStatuses, setWordStatuses] = useState<Record<number, boolean>>({});
  const [typedWordsMap, setTypedWordsMap] = useState<Record<number, string>>({});
  const [isFocused, setIsFocused] = useState(true);

  const [mechanicalSounds, setMechanicalSounds] = useState<boolean>(true);
  const [keystrokeIntervals, setKeystrokeIntervals] = useState<number[]>([]);
  const lastKeyTimestampRef = useRef<number | null>(null);
  const [blindMode, setBlindMode] = useState<boolean>(false);

  // Live Stats states
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [wpmHistory, setWpmHistory] = useState<number[]>([]);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [errorSeconds, setErrorSeconds] = useState<number[]>([]);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [done, setDone] = useState(false);
  const [errorMap, setErrorMap] = useState<Record<string, number>>({});
  const [dailyPracticeSummary, setDailyPracticeSummary] = useState({ attempts: 0, averageWpm: 0, todayScore: 0 });
  const [dailyAverageScores, setDailyAverageScores] = useState<{ date: string; averageWpm: number; attempts: number }[]>([]);

  const getProgressBarClass = (percent: number) => {
    const normalized = Math.min(100, Math.max(0, Math.round(percent / 10) * 10));
    return `prog-width-${normalized}`;
  };

  const dailyWpmProgressClass = getProgressBarClass(Math.min(100, dailyPracticeSummary.averageWpm));
  const contestUnlockProgressClass = getProgressBarClass(Math.min(100, (dailyPracticeSummary.attempts / 15) * 100));

  // Keyboard stats tracking states
  const [keyStats, setKeyStats] = useState<Record<string, { hits: number; errors: number }>>({});
  const [lineKeyStats, setLineKeyStats] = useState<Record<number, Record<string, { hits: number; errors: number }>>>({});
  const [completedLineStatsList, setCompletedLineStatsList] = useState<Array<{ lineIdx: number; stats: Record<string, { hits: number; errors: number }>; textSnippet: string }>>([]);

  // Helper selectors for the word deck
  const words = selectedQuote.trim().split(/\s+/);
  const lineSize = 10; // beautiful line size fitting screens gracefully
  const lines: string[][] = [];
  for (let i = 0; i < words.length; i += lineSize) {
    lines.push(words.slice(i, i + lineSize));
  }
  const currentLineIndex = Math.floor(currentWordIndex / lineSize);

  // Timers and Refs for stale closure prevention
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWordIndexRef = useRef(0);
  const wordStatusesRef = useRef<Record<number, boolean>>({});

  const recordKeyStroke = (charTarget: string, isCorrect: boolean) => {
    if (!charTarget) return;
    const lowerTarget = charTarget.toLowerCase();
    
    // Update general stats
    setKeyStats(prev => {
      const current = prev[lowerTarget] || { hits: 0, errors: 0 };
      return {
        ...prev,
        [lowerTarget]: {
          hits: current.hits + 1,
          errors: current.errors + (isCorrect ? 0 : 1)
        }
      };
    });

    // Update current line stats
    const lineIdx = Math.floor(currentWordIndex / lineSize);
    setLineKeyStats(prev => {
      const lineStats = prev[lineIdx] || {};
      const current = lineStats[lowerTarget] || { hits: 0, errors: 0 };
      return {
        ...prev,
        [lineIdx]: {
          ...lineStats,
          [lowerTarget]: {
            hits: current.hits + 1,
            errors: current.errors + (isCorrect ? 0 : 1)
          }
        }
      };
    });
  };

  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);

  useEffect(() => {
    wordStatusesRef.current = wordStatuses;
  }, [wordStatuses]);

  useEffect(() => {
    // If we transition past a line of words, we freeze that completed line's statistics and add it to the completedLineStatsList!
    const previousLineIdx = Math.floor((currentWordIndex - 1) / lineSize);
    const newLineIdx = Math.floor(currentWordIndex / lineSize);
    
    if (currentWordIndex > 0 && newLineIdx > previousLineIdx && previousLineIdx >= 0) {
      // Line previousLineIdx is complete!
      const lineStats = lineKeyStats[previousLineIdx] || {};
      
      // Prevent duplicate additions
      setCompletedLineStatsList(prev => {
        if (prev.some(item => item.lineIdx === previousLineIdx)) return prev;
        
        // Grab the actual snippet of text for this completed part
        const startWord = previousLineIdx * lineSize;
        const endWord = startWord + lineSize;
        const snippet = words.slice(startWord, endWord).join(' ');
        
        return [
          ...prev,
          {
            lineIdx: previousLineIdx,
            stats: { ...lineStats },
            textSnippet: snippet
          }
        ];
      });
    }
  }, [currentWordIndex, lineKeyStats, words]);

  useEffect(() => {
    const wordCount = getWordCountForDuration(duration);
    const newPassage = generateDynamicPassage(wordCount);
    setSelectedQuote(newPassage);
    setTimeLeft(duration);
    setCurrentWordInput('');
    setCurrentWordIndex(0);
    setWordStatuses({});
    setTypedWordsMap({});
    setIsFocused(true);
    setStarted(false);
    setWpmHistory([]);
    setMistakesCount(0);
    setErrorSeconds([]);
    setWpm(0);
    setAccuracy(100);
    setDone(false);
    setErrorMap({});
    setKeyStats({});
    setLineKeyStats({});
    setCompletedLineStatsList([]);

    // Attempt to auto-focus hidden input on initialization and mode changes
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => {
      clearAllPracticeTimers();
    };
  }, [duration]);

  const clearAllPracticeTimers = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (trackingInterval.current) clearInterval(trackingInterval.current);
  };

  const getDateKey = (date: Date = new Date()) => date.toISOString().split('T')[0];
  const practiceStorageKey = 'figtyp-practice-daily-summary';

  const loadDailyPracticeSummary = () => {
    try {
      const stored = window.localStorage.getItem(practiceStorageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored) as { [date: string]: { attempts: number; totalWpm: number } };
      const todayKey = getDateKey();
      const todayRecord = parsed[todayKey] || { attempts: 0, totalWpm: 0 };
      const averageWpm = todayRecord.attempts > 0 ? Math.round(todayRecord.totalWpm / todayRecord.attempts) : 0;
      setDailyPracticeSummary({ attempts: todayRecord.attempts, averageWpm, todayScore: averageWpm });
      const recentDates = Object.keys(parsed)
        .sort((a, b) => (a < b ? 1 : -1))
        .slice(0, 7)
        .map((dateKey) => ({
          date: dateKey,
          averageWpm: parsed[dateKey].attempts > 0 ? Math.round(parsed[dateKey].totalWpm / parsed[dateKey].attempts) : 0,
          attempts: parsed[dateKey].attempts
        }));
      setDailyAverageScores(recentDates);
    } catch (err) {
      console.warn('Unable to load practice daily summary:', err);
    }
  };

  const persistPracticeDailySummary = (record: { wpm: number }) => {
    try {
      const stored = window.localStorage.getItem(practiceStorageKey);
      const parsed = stored ? JSON.parse(stored) as { [date: string]: { attempts: number; totalWpm: number } } : {};
      const todayKey = getDateKey();
      const existing = parsed[todayKey] || { attempts: 0, totalWpm: 0 };
      const updated = {
        ...existing,
        attempts: existing.attempts + 1,
        totalWpm: existing.totalWpm + record.wpm
      };
      parsed[todayKey] = updated;
      window.localStorage.setItem(practiceStorageKey, JSON.stringify(parsed));
      loadDailyPracticeSummary();
    } catch (err) {
      console.warn('Unable to persist practice daily summary:', err);
    }
  };

  const playSynthesizerClick = () => {
    if (!mechanicalSounds) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // retro typewriter mechanical thud sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150 + Math.random() * 80, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Audio context block safeguard
    }
  };

  const startPracticeRace = () => {
    setStarted(true);
    startTimeRef.current = Date.now();
    setWpmHistory([]);
    setMistakesCount(0);
    setErrorSeconds([]);
    setErrorMap({});

    // 1-second countdown clock
    timerInterval.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          terminateWordTypingRun(currentWordIndexRef.current, wordStatusesRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 1-second tracking metrics graph points builder using current states safely
    trackingInterval.current = setInterval(() => {
      const elapsed = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 1;
      setWpmHistory((prev) => {
        let totalTypedChars = 0;
        const finalWordIndex = currentWordIndexRef.current;
        for (let i = 0; i < finalWordIndex; i++) {
          totalTypedChars += (words[i] || '').length + 1;
        }
        const speed = elapsed > 0 ? Math.round((totalTypedChars / 5) / (elapsed / 60)) : 0;
        return [...prev, speed];
      });
    }, 1000);
  };

  const handleWordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Play retroactive mechanical keystroke feedback sound
    playSynthesizerClick();

    // Track interval timing between successive key taps
    const now = Date.now();
    if (lastKeyTimestampRef.current !== null) {
      const msDiff = now - lastKeyTimestampRef.current;
      if (msDiff > 10 && msDiff < 3000) {
        setKeystrokeIntervals(prev => [...prev, msDiff]);
      }
    }
    lastKeyTimestampRef.current = now;

    if (!started) {
      startPracticeRace();
    }

    // Space key delimiter will run on KeyDown to move next, ignore trailing space update in text field here
    if (value.endsWith(' ')) {
      return;
    }

    setCurrentWordInput(value);

    // Record keystroke progress
    const targetWord = words[currentWordIndex] || '';
    if (value.length > currentWordInput.length) {
      const charTyped = value[value.length - 1];
      const charTarget = targetWord[value.length - 1];
      if (charTarget) {
        const isCorrect = charTyped === charTarget;
        recordKeyStroke(charTarget, isCorrect);
      }
    }

    // Live characters check for mistakes detection in active typing sequence
    if (value.length > 0) {
      const lastCharIndex = value.length - 1;
      if (value[lastCharIndex] !== targetWord[lastCharIndex]) {
        // mistyped character detected on key-down sequence
        const currentElapsed = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
        setErrorSeconds(prev => prev.includes(currentElapsed) ? prev : [...prev, currentElapsed]);
        setMistakesCount(prev => prev + 1);
        
        const missedChar = targetWord[lastCharIndex] || 'extra';
        setErrorMap(prev => ({
          ...prev,
          [missedChar]: (prev[missedChar] || 0) + 1
        }));
      }
    }

    if (currentWordIndex === words.length - 1 && value === targetWord) {
      const finalStatuses = { ...wordStatuses, [currentWordIndex]: true };
      const finalTypedWords = { ...typedWordsMap, [currentWordIndex]: value };
      setWordStatuses(finalStatuses);
      setTypedWordsMap(finalTypedWords);
      terminateWordTypingRun(currentWordIndex + 1, finalStatuses, finalTypedWords);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      
      const trimmedVal = currentWordInput.trim();
      if (!trimmedVal) return; // avoid multi space typing jumps
      
      const targetWord = words[currentWordIndex] || '';
      const isCorrect = trimmedVal === targetWord;
      
      const nextWordStatuses = {
        ...wordStatuses,
        [currentWordIndex]: isCorrect
      };
      
      const nextTypedWords = {
        ...typedWordsMap,
        [currentWordIndex]: trimmedVal
      };

      setWordStatuses(nextWordStatuses);
      setTypedWordsMap(nextTypedWords);
      
      // Record spacebar hit/error!
      recordKeyStroke(' ', isCorrect);
      
      if (!isCorrect) {
        let wordMistakes = 0;
        const errTrack = { ...errorMap };
        for (let i = 0; i < Math.max(trimmedVal.length, targetWord.length); i++) {
          if (trimmedVal[i] !== targetWord[i]) {
            wordMistakes++;
            const charTarget = targetWord[i] || ' ';
            errTrack[charTarget] = (errTrack[charTarget] || 0) + 1;
            
            // Record missed character
            recordKeyStroke(charTarget, false);
          }
        }
        setMistakesCount(prev => prev + wordMistakes);
        setErrorMap(errTrack);

        const currentElapsed = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
        setErrorSeconds(prev => prev.includes(currentElapsed) ? prev : [...prev, currentElapsed]);
      }

      const nextIdx = currentWordIndex + 1;
      setCurrentWordIndex(nextIdx);
      setCurrentWordInput('');

      if (nextIdx >= words.length) {
        terminateWordTypingRun(nextIdx, nextWordStatuses, nextTypedWords);
      }
    }
  };

  // Live indicators for accuracy
  const getLiveAccuracy = () => {
    let correctChars = 0;
    let totalCheckedChars = 0;
    for (let i = 0; i < currentWordIndex; i++) {
      const target = words[i] || '';
      const typed = typedWordsMap[i] || '';
      if (typed === target) {
        correctChars += target.length + 1;
      } else {
        for (let j = 0; j < Math.max(target.length, typed.length); j++) {
          if (j < target.length && j < typed.length && target[j] === typed[j]) {
            correctChars++;
          }
        }
      }
      totalCheckedChars += Math.max(target.length, typed.length) + 1;
    }
    const currentTarget = words[currentWordIndex] || '';
    for (let i = 0; i < currentWordInput.length; i++) {
      if (currentWordInput[i] === currentTarget[i]) {
        correctChars++;
      }
      totalCheckedChars++;
    }
    return totalCheckedChars > 0 ? Math.round((correctChars / totalCheckedChars) * 100) : 100;
  };

  const calculateFinalAccuracyOfRun = (finalWordStatuses: Record<number, boolean>, finalIndex: number, finalTypedWords?: Record<number, string>) => {
    const activeTyped = finalTypedWords || typedWordsMap;
    let correctChars = 0;
    let totalChars = 0;
    for (let i = 0; i < finalIndex; i++) {
      const target = words[i] || '';
      const typed = activeTyped[i] || '';
      if (trimmedOrExactMatch(target, typed)) {
        correctChars += target.length + 1;
      } else {
        for (let j = 0; j < Math.max(target.length, typed.length); j++) {
          if (j < target.length && j < typed.length && target[j] === typed[j]) {
            correctChars++;
          }
        }
      }
      totalChars += Math.max(target.length, typed.length) + 1;
    }
    return totalChars > 0 ? Math.min(100, Math.round((correctChars / totalChars) * 100)) : 100;
  };

  const trimmedOrExactMatch = (a: string, b: string) => {
    return (a || '').trim() === (b || '').trim();
  };

  const terminateWordTypingRun = async (finalIndex: number, overrideStatuses?: Record<number, boolean>, overrideTyped?: Record<number, string>) => {
    clearAllPracticeTimers();
    setStarted(false);
    setDone(true);

    // Capture the final line index (whether completed or midway) to completedLineStatsList so it's fully visual on completion
    const finalLineIdx = Math.floor((finalIndex - 1) / lineSize);
    if (finalLineIdx >= 0) {
      setCompletedLineStatsList(prev => {
        if (prev.some(item => item.lineIdx === finalLineIdx)) return prev;
        const lineStats = lineKeyStats[finalLineIdx] || {};
        const startWord = finalLineIdx * lineSize;
        const endWord = startWord + lineSize;
        const snippet = words.slice(startWord, endWord).join(' ');
        return [
          ...prev,
          {
            lineIdx: finalLineIdx,
            stats: { ...lineStats },
            textSnippet: snippet
          }
        ];
      });
    }

    const mergedStatuses = overrideStatuses || wordStatuses;
    const finalAcc = calculateFinalAccuracyOfRun(mergedStatuses, finalIndex, overrideTyped);
    
    const elapsedSeconds = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : duration;
    
    let totalChars = 0;
    const activeTyped = overrideTyped || typedWordsMap;
    for (let i = 0; i < finalIndex; i++) {
      const target = words[i] || '';
      const typed = activeTyped[i] || '';
      totalChars += Math.max(target.length, typed.length) + 1;
    }
    
    const finalWpmVal = elapsedSeconds > 0 ? Math.round((totalChars / 5) / (elapsedSeconds / 60)) : 0;
    const finalCpm = elapsedSeconds > 0 ? Math.round(totalChars / (elapsedSeconds / 60)) : 0;
    
    setWpm(finalWpmVal);
    setAccuracy(finalAcc);

    const correctChars = Math.max(0, totalChars - mistakesCount);
    const finalConsistency = getLiveConsistency();

    // save speed metrics to backend DB
    try {
      const response = await fetch('/api/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          mode: 'quote',
          duration: Math.round(elapsedSeconds) || duration,
          wordCount: finalIndex,
          wpm: finalWpmVal,
          rawWpm: Math.round(finalWpmVal * 1.05) || finalWpmVal,
          accuracy: finalAcc,
          consistency: finalConsistency,
          correctChars,
          incorrectChars: mistakesCount,
          totalChars,
          quoteText: selectedQuote,
          errorHeatmap: errorMap
        })
      });
      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        const data = await response.json();
        onAttemptSaved(data.attempt);
        persistPracticeDailySummary({ wpm: finalWpmVal });
        fetchLeaderboard(); // refresh practice leaderboard standings!
        // award XP & coins payouts for decent attempts
        if (finalWpmVal >= 30 && finalAcc >= 80) {
          onCoinsAwarded(Math.round(finalWpmVal / 2), Math.round(finalWpmVal));
        }
      } else {
        const text = await response.text();
        console.warn("Could not save attempt status failure:", text);
      }
    } catch (e) {
      console.warn("Could not save typing attempt details down to DB:", e);
    }
  };

  // Helper metrics for live rendering
  const getLiveWpm = () => {
    if (!started) return wpm;
    const elapsed = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 1;
    let totalTypedChars = 0;
    for (let i = 0; i < currentWordIndex; i++) {
      const target = words[i] || '';
      const typed = typedWordsMap[i] || '';
      totalTypedChars += Math.max(target.length, typed.length) + 1;
    }
    totalTypedChars += currentWordInput.length;
    return elapsed > 0 ? Math.round((totalTypedChars / 5) / (elapsed / 60)) : 0;
  };

  const getLiveConsistency = () => {
    if (wpmHistory.length < 3) return 85;
    const mean = wpmHistory.reduce((a, b) => a + b, 0) / wpmHistory.length;
    if (mean === 0) return 90;
    const variance = wpmHistory.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpmHistory.length;
    const stdDev = Math.sqrt(variance);
    // standard dev evaluation
    const consistencyVal = Math.round((1 - (stdDev / mean)) * 100);
    return Math.max(45, Math.min(100, consistencyVal));
  };

  const calculateRhythmStability = () => {
    if (keystrokeIntervals.length < 5) return 80;
    const mean = keystrokeIntervals.reduce((a, b) => a + b, 0) / keystrokeIntervals.length;
    if (mean === 0) return 80;
    const variance = keystrokeIntervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / keystrokeIntervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;
    // Standardize to percentage scale (lower coefficient of variation cv = higher stability)
    const stability = Math.max(30, Math.min(100, Math.round((1 - cv * 0.8) * 100)));
    return stability;
  };

  const renderPracticeLeaderboard = () => {
    return (
      <div id="practice-leader-block" className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 space-y-4 shadow-xl max-w-4xl mx-auto mt-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#e2b714]" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">🏆 Global Solo Practice Leaderboard</span>
          </div>
          <button 
            type="button"
            onClick={fetchLeaderboard}
            disabled={loadingLeaderboard}
            className="text-[9px] uppercase tracking-wider bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700/80 p-1 px-2.5 rounded text-zinc-400 font-mono transition cursor-pointer"
          >
            {loadingLeaderboard ? 'syncing...' : 'refresh'}
          </button>
        </div>
        <p className="text-[10px] text-zinc-500 font-sans text-left leading-normal">
          This board monitors and displays the highest typestrike velocities (top WPM scores) achieved during independent solo calibration practice sessions.
        </p>
        
        {loadingLeaderboard ? (
          <div className="text-center py-6 font-mono text-[10px] text-zinc-500 animate-pulse">
            Retrieving high-speed neuron configurations...
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="text-center py-6 text-zinc-600 font-mono text-[10px] border border-dashed border-zinc-900/60 rounded-2xl">
            No registered practice records found. Complete a typing run with 30+ WPM to secure a spot in history!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {leaderboardData.slice(0, 10).map((row: any, idx: number) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;
              let medalClass = "text-zinc-500";
              if (isFirst) medalClass = "text-[#e2b714] font-bold";
              else if (isSecond) medalClass = "text-slate-300 font-bold";
              else if (isThird) medalClass = "text-amber-700 font-bold";

              return (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-mono transition-all duration-300 ${
                    isFirst 
                      ? 'border-[#e2b714]/30 bg-[#e2b714]/5 text-white shadow-sm shadow-[#e2b714]/5' 
                      : 'border-zinc-900 bg-zinc-950/20 text-zinc-400 hover:border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 text-center text-[11px] ${medalClass}`}>
                      {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `#${idx + 1}`}
                    </span>
                    <div className="text-left">
                      <span className="font-semibold block text-zinc-100 text-[11px] truncate max-w-[120px]">{row.username}</span>
                      <span className="text-[8px] text-zinc-500 font-mono block">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#e2b714] block">
                      {row.wpm} <span className="text-[9px] text-zinc-500 font-normal">WPM</span>
                    </span>
                    <span className="text-[9px] text-zinc-500 block">{row.accuracy}% acc</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const liveWpm = started ? getLiveWpm() : wpm;
  const liveAccuracy = (started || done) ? getLiveAccuracy() : accuracy;

  const resetPracticeArena = () => {
    clearAllPracticeTimers();
    setCurrentWordInput('');
    setCurrentWordIndex(0);
    setWordStatuses({});
    setTypedWordsMap({});
    setErrorSeconds([]);
    setStarted(false);
    setTimeLeft(duration);
    setWpmHistory([]);
    setMistakesCount(0);
    setWpm(0);
    setAccuracy(100);
    setDone(false);
    setErrorMap({});
    setKeyStats({});
    setLineKeyStats({});
    setCompletedLineStatsList([]);
    setKeystrokeIntervals([]);
    lastKeyTimestampRef.current = null;
    setIsFocused(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const pickAlternativeQuote = () => {
    const wordCount = getWordCountForDuration(duration);
    const newPassage = generateDynamicPassage(wordCount);
    setSelectedQuote(newPassage);
    setCurrentWordInput('');
    setCurrentWordIndex(0);
    setWordStatuses({});
    setTypedWordsMap({});
    setErrorSeconds([]);
    setStarted(false);
    setTimeLeft(duration);
    setWpmHistory([]);
    setMistakesCount(0);
    setWpm(0);
    setAccuracy(100);
    setDone(false);
    setErrorMap({});
    setKeyStats({});
    setLineKeyStats({});
    setCompletedLineStatsList([]);
    setKeystrokeIntervals([]);
    lastKeyTimestampRef.current = null;
    setIsFocused(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Build SVG path lines based on historical tracking points
  const drawLargeSvgChartPath = () => {
    if (wpmHistory.length === 0) return '';
    const chartHeight = 90;
    const maxVal = Math.max(...wpmHistory, 40);
    const xSpacing = 450 / (wpmHistory.length - 1 || 1);

    return wpmHistory.map((pt, idx) => {
      const x = idx * xSpacing;
      // invert y (since SVG 0,0 is top-left)
      const y = 110 - (pt / maxVal) * 90;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Character stats analyzer block
  const getCharacterMetrics = () => {
    let correct = 0;
    let incorrect = 0;
    let extra = 0;
    let missed = 0;

    for (let i = 0; i < words.length; i++) {
      if (i > currentWordIndex) continue;
      const target = words[i] || '';
      const typed = i === currentWordIndex ? currentWordInput : (typedWordsMap[i] || '');

      if (i === currentWordIndex && typed === '') continue;

      const targetLen = target.length;
      const typedLen = typed.length;

      for (let j = 0; j < Math.max(targetLen, typedLen); j++) {
        if (j < targetLen && j < typedLen) {
          if (target[j] === typed[j]) {
            correct++;
          } else {
            incorrect++;
          }
        } else if (j >= targetLen) {
          extra++;
        } else if (j >= typedLen) {
          missed++;
        }
      }
      if (i < currentWordIndex) {
        correct++; // Completed word space break character
      }
    }
    return { correct, incorrect, extra, missed };
  };

  return (
    <div id="practice-module" className="space-y-5 max-w-5xl mx-auto px-4 pt-1 pb-6">
      
      {/* Settings Options bar styled in modern dark carbon */}
      {!done && (
        <div id="practice-toolbar" className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
          
          {/* Custom triggers deck */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs w-full lg:w-auto flex-grow lg:max-w-4xl">
            
            {/* Duration choice select dropdown */}
            <div className="space-y-2">
              <label htmlFor="practice-duration-select" className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold font-mono block">
                Interval Limit
              </label>
              <div className="relative">
                <select
                  id="practice-duration-select"
                  title="Select practice duration"
                  aria-label="Select practice duration"
                  disabled={started}
                  value={duration}
                  onChange={(e) => {
                    const newSecs = Number(e.target.value);
                    setDuration(newSecs);
                  }}
                  className="w-full appearance-none bg-zinc-950 border border-zinc-800 hover:border-[#e2b714]/40 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#e2b714] focus:ring-1 focus:ring-[#e2b714]/40 cursor-pointer transition font-mono pr-10"
                >
                  {[
                    { v: 15, l: '15 Seconds (20 words)' },
                    { v: 30, l: '30 Seconds (40 words)' },
                    { v: 60, l: '1 Minute (100 words)' },
                    { v: 120, l: '2 Minutes (200 words)' },
                    { v: 180, l: '3 Minutes (300 words)' },
                    { v: 300, l: '5 Minutes (500 words)' },
                  ].map((opt) => (
                    <option key={opt.v} value={opt.v} className="bg-zinc-950 text-slate-200 py-2">
                      {opt.l}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#e2b714]">
                  <Timer className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Sound choice buttons */}
            <div className="space-y-2">
              <span className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold font-mono block">Mechanical Keyboard Audio</span>
              <button
                onClick={() => setMechanicalSounds(!mechanicalSounds)}
                className="w-full px-4 py-2.5 bg-zinc-950 hover:bg-zinc-950/80 hover:border-[#e2b714]/40 border border-zinc-800 rounded-xl text-xs text-zinc-200 flex items-center justify-between cursor-pointer transition font-mono focus:ring-1 focus:ring-[#e2b714]/30"
              >
                <span className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#e2b714]" />
                  Tactile Clicks
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${!mechanicalSounds ? 'bg-zinc-800 text-zinc-500' : 'bg-[#e2b714]/10 text-[#e2b714] font-bold'}`}>
                  {!mechanicalSounds ? 'DISABLED' : 'ENABLED'}
                </span>
              </button>
            </div>

            {/* Blind Typing choice */}
            <div className="space-y-2">
              <span className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold font-mono block">Blind Typing Mode</span>
              <button
                onClick={() => setBlindMode(!blindMode)}
                className={`w-full px-4 py-2.5 border rounded-xl text-xs cursor-pointer transition font-mono flex items-center justify-between focus:ring-1 focus:ring-[#e2b714]/30 ${blindMode ? 'border-[#e2b714] text-white bg-[#e2b714]/10 font-bold' : 'border-zinc-800 text-zinc-200 bg-zinc-950 hover:border-[#e2b714]/40'}`}
              >
                <span className="flex items-center gap-2">
                  ⚡ Mode Status
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${blindMode ? 'bg-[#e2b714]/20 text-white animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}>
                  {blindMode ? 'ACTIVE' : 'OFF'}
                </span>
              </button>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs font-mono">
              <div className="flex items-center justify-between mb-3">
                <span className="uppercase tracking-widest text-slate-400">Today</span>
                <span className="text-[#00F3FF] font-semibold">Practice</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-slate-500">Attempts</span>
                  <strong className="text-white text-lg">{dailyPracticeSummary.attempts}</strong>
                </div>
                <div>
                  <span className="block text-slate-500">Avg WPM</span>
                  <strong className="text-white text-lg">{dailyPracticeSummary.averageWpm}</strong>
                </div>
              </div>
              <div className="mt-3 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className={`h-full bg-[#00F3FF] transition-all duration-300 ${dailyWpmProgressClass}`} />
              </div>
              <p className="mt-3 text-[10px] text-slate-500">Daily average typing score stored locally for quick analytics and persistence.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs font-mono">
              <div className="flex items-center justify-between mb-3">
                <span className="uppercase tracking-widest text-slate-400">Last 7 days</span>
                <span className="text-emerald-400">Trend</span>
              </div>
              <div className="space-y-2">
                {dailyAverageScores.length === 0 ? (
                  <p className="text-slate-500 text-[10px]">No recent daily practice summary is available yet.</p>
                ) : dailyAverageScores.map((item) => (
                  <div key={item.date} className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{item.date}</span>
                    <span>{item.averageWpm} WPM • {item.attempts} run{item.attempts === 1 ? '' : 's'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs font-mono">
              <div className="flex items-center justify-between mb-3">
                <span className="uppercase tracking-widest text-slate-400">Contest Unlock</span>
                <span className="text-[#00FF95]">Progress</span>
              </div>
              <div className="space-y-2">
                <span className="text-white font-semibold text-lg">{Math.min(100, Math.round((dailyPracticeSummary.attempts / 15) * 100))}%</span>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className={`h-full bg-[#00FF95] transition-all duration-300 ${contestUnlockProgressClass}`} />
                </div>
                <p className="text-[10px] text-slate-500">Complete 15 practice sessions to unlock multiplayer contest access.</p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto shrink-0 flex items-end">
            <button
              onClick={pickAlternativeQuote}
              disabled={started}
              className="w-full lg:w-auto px-5 py-3 bg-zinc-950 hover:bg-zinc-900 hover:border-[#e2b714]/40 text-zinc-300 border border-zinc-800 text-xs font-mono rounded-xl cursor-pointer transition shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#e2b714]" />
              <span>Generate New Passage</span>
            </button>
          </div>

        </div>
      )}

      {/* Main Container Stage */}
      <div id="practice-split-grid" className="w-full">
        
        {done ? (
          /* Elegant Monkeytype Results Dashboard */
          <div className="p-8 md:p-10 rounded-3xl bg-[#1e2022] border border-zinc-800 text-left font-mono space-y-10 animate-[fadeIn_0.3s_ease-out] relative overflow-hidden shadow-2xl max-w-4xl mx-auto">
            
            {/* Background radial ambient light */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e2b714]/5 rounded-full blur-3xl pointer-events-none" />

            {/* Main performance stats splits */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              {/* Left tall stats vertical block */}
              <div className="md:col-span-1 flex flex-col justify-between py-2 space-y-8 border-r border-zinc-800/65 pr-4 md:pr-6">
                
                {/* WPM score */}
                <div>
                  <span className="text-zinc-500 text-sm block lowercase tracking-wider font-semibold font-mono">wpm</span>
                  <span className="text-[5.5rem] leading-none font-bold text-[#e2b714] font-display select-none tracking-tighter">
                    {wpm}
                  </span>
                </div>

                {/* ACC score */}
                <div>
                  <span className="text-zinc-500 text-sm block lowercase tracking-wider font-semibold font-mono">acc</span>
                  <span className="text-[5.5rem] leading-none font-bold text-[#e2b714] font-display select-none tracking-tighter">
                    {accuracy}%
                  </span>
                </div>

                {/* Test details type */}
                <div className="pt-4 space-y-1">
                  <span className="text-zinc-500 text-xs block lowercase tracking-wider font-mono">test type</span>
                  <div className="text-[#e2b714] text-sm font-semibold tracking-wider space-y-0.5">
                    <div>time {duration}s</div>
                    <div>english</div>
                  </div>
                </div>

              </div>

              {/* Right chart block & bottom details row */}
              <div className="md:col-span-3 flex flex-col justify-between space-y-8 pl-0 md:pl-2">
                
                {/* Chart performance progress curve */}
                <div className="p-6 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 relative">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block mb-4">Words per minute progress curve</span>
                  
                  {wpmHistory.length > 0 ? (
                    <div className="relative">
                      <svg className="w-full h-44" viewBox="0 0 450 120" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="yellow-curve-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#e2b714" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#e2b714" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Guideline helper lines */}
                        <line x1="0" y1="30" x2="450" y2="30" stroke="#2c2e31" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="60" x2="450" y2="60" stroke="#2c2e31" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="90" x2="450" y2="90" stroke="#2c2e31" strokeWidth="1" strokeDasharray="3 3" />

                        {/* Shaded Area under path */}
                        {wpmHistory.length > 1 && (
                          <path
                            d={`${drawLargeSvgChartPath()} L 450 120 L 0 120 Z`}
                            fill="url(#yellow-curve-gradient)"
                          />
                        )}

                        {/* Stroke live curve */}
                        <path
                          d={drawLargeSvgChartPath()}
                          fill="none"
                          stroke="#e2b714"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Dot points */}
                        {wpmHistory.map((val, idx) => {
                          const maxVal = Math.max(...wpmHistory, 40);
                          const xSpacing = 450 / (wpmHistory.length - 1 || 1);
                          const x = idx * xSpacing;
                          const y = 110 - (val / maxVal) * 90;
                          return (
                            <circle
                              key={idx}
                              cx={x}
                              cy={y}
                              r="3.5"
                              className="fill-[#e2b714] stroke-[#1e2022] stroke-2 cursor-pointer hover:r-5 transition-all duration-100"
                            />
                          );
                        })}

                        {/* Red error x markers mapping */}
                        {errorSeconds.map((sec, sIdx) => {
                          if (sec >= wpmHistory.length) return null;
                          const maxVal = Math.max(...wpmHistory, 40);
                          const xSpacing = 450 / (wpmHistory.length - 1 || 1);
                          const val = wpmHistory[sec] || 25;
                          const x = sec * xSpacing;
                          const y = 110 - (val / maxVal) * 90;
                          return (
                            <g key={sIdx}>
                              {/* Red visual error x */}
                              <text x={x} y={y - 8} className="fill-[#f43f5e] font-sans font-extrabold text-[12px]" textAnchor="middle">
                                x
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* X axis labels */}
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-2">
                        <span>1s</span>
                        <span>{wpmHistory.length}s</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center text-zinc-500 text-xs">
                      Not complete
                    </div>
                  )}
                </div>

                {/* Bottom details row: raw / characters / consistency / rhythm stability / time */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 pt-4 border-t border-zinc-800">
                  
                  {/* RAW stats */}
                  <div>
                    <span className="text-zinc-500 text-xs block lowercase tracking-wider font-mono">raw</span>
                    <span className="text-3xl md:text-4xl font-semibold text-[#e2b714] font-display">
                      {Math.round(liveWpm * 1.05) || Math.round(wpm * 1.05) || 36}
                    </span>
                  </div>

                  {/* CHARACTERS stats */}
                  <div>
                    <span className="text-zinc-500 text-xs block lowercase tracking-wider font-mono">characters</span>
                    <span className="text-2xl md:text-3xl font-semibold text-[#e2b714] font-display py-0.5 block">
                      {(() => {
                        const stats = getCharacterMetrics();
                        return `${stats.correct}/${stats.incorrect}/${stats.extra}/${stats.missed}`;
                      })()}
                    </span>
                  </div>

                  {/* CONSISTENCY stats */}
                  <div>
                    <span className="text-zinc-500 text-xs block lowercase tracking-wider font-mono">consistency</span>
                    <span className="text-3xl md:text-4xl font-semibold text-[#e2b714] font-display">
                      {getLiveConsistency()}%
                    </span>
                  </div>

                  {/* RHYTHM STABILITY stats */}
                  <div>
                    <span className="text-zinc-500 text-xs block lowercase tracking-wider font-mono">rhythm stability</span>
                    <span className="text-3xl md:text-4xl font-semibold text-[#e2b714] font-display">
                      {keystrokeIntervals.length >= 5 ? calculateRhythmStability() : 82}%
                    </span>
                  </div>

                  {/* TIME stats */}
                  <div>
                    <span className="text-zinc-500 text-xs block lowercase tracking-wider font-mono">time</span>
                    <span className="text-3xl md:text-4xl font-semibold text-[#e2b714] font-display pb-0.5 block">
                      {duration}s
                    </span>
                    <span className="text-[10px] text-zinc-500 block leading-tight font-mono">
                      00:00:{duration} session
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* Keyboard Layout Weak-Spot Inspector */}
            <div className="space-y-3 pt-6 border-t border-zinc-800">
              <span className="text-zinc-500 text-xs block lowercase tracking-wider font-semibold font-mono">Heatmap Weak Spot Inspector</span>
              <KeyboardLayout stats={keyStats} title="Overall Practice Session Key Accuracy Map" />
            </div>

            {/* Action utilities bar at the absolute bottom of results block centered */}
            <div className="flex items-center justify-center gap-6 pt-6 border-t border-zinc-800 text-zinc-400">
              <button
                onClick={pickAlternativeQuote}
                title="Pick Alternative Quote"
                className="p-2 hover:text-[#e2b714] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={resetPracticeArena}
                title="Retry Test"
                className="p-2 hover:text-[#e2b714] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                title="Mistakes Heatmap"
                className="p-2 hover:text-red-500 transition-colors cursor-pointer opacity-70 hover:opacity-100"
                onClick={() => {
                   const errKeys = Object.keys(errorMap);
                   if (errKeys.length > 0) {
                     alert(`Typing Mistake Keys heatmap breakdown:\n${errKeys.map(k => ` - '${k}': ${errorMap[k]} mistakes`).join('\n')}`);
                   } else {
                     alert("Incredible practice run! 100% key strike confidence. No keys were mismapped.");
                   }
                }}
              >
                <AlertTriangle className="w-5 h-5" />
              </button>

              <button
                title="Sentence Layout Toggle"
                className="p-2 hover:text-zinc-200 transition-colors cursor-pointer opacity-70 hover:opacity-100"
                onClick={() => alert("Alternative paragraph structures configured successfully.")}
              >
                <AlignLeft className="w-5 h-5" />
              </button>

              <button
                title="Practice Run History"
                className="p-2 hover:text-zinc-200 transition-colors cursor-pointer opacity-70 hover:opacity-100"
                onClick={() => alert("Historics loaded down successfully. Keep practicing to stack more logs!")}
              >
                <History className="w-5 h-5" />
              </button>

              <button
                title="Export Screen Share Link"
                className="p-2 hover:text-zinc-200 transition-colors cursor-pointer opacity-70 hover:opacity-100"
                onClick={() => alert("Overlay screen visual coordinates saved. Ready to paste!")}
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <div className="h-5 w-[1px] bg-zinc-800" />
              
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://typist.miracore.net')}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share achievement on LinkedIn"
                className="p-1.5 px-3 bg-zinc-950 border border-zinc-800 hover:border-blue-500 text-zinc-300 hover:text-white rounded-xl text-[10px] font-sans transition flex items-center gap-1.5 select-none"
              >
                <Linkedin className="w-3 h-3 text-[#0a66c2] fill-[#0a66c2]" />
                Share
              </a>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://typist.miracore.net')}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share achievement on Facebook"
                className="p-1.5 px-3 bg-zinc-950 border border-zinc-800 hover:border-blue-600 text-zinc-300 hover:text-white rounded-xl text-[10px] font-sans transition flex items-center gap-1.5 select-none"
              >
                <Share2 className="w-3 h-3 text-[#1877f2]" />
                Post
              </a>
            </div>

            {renderPracticeLeaderboard()}

          </div>
        ) : (
          /* Active Interactive Typing Block */
          <div className="space-y-6">
            
            {/* Minimal language line at the top */}
            <div className="flex items-center justify-center gap-1.5 text-zinc-500 font-mono text-xs select-none h-6">
              {!started && (
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <Globe className="w-3.5 h-3.5 text-zinc-500" />
                  <span>english</span>
                </div>
              )}
            </div>

            {/* Large layout container box with exact 3-line shift up capability */}
            <div 
              onClick={() => inputRef.current?.focus()}
              className="relative p-8 md:p-12 rounded-3xl bg-zinc-950/40 border border-zinc-900/60 leading-relaxed text-left transition select-none outline-none font-mono tracking-wider cursor-text max-w-4xl mx-auto"
            >
              
              {/* Blur Focus Sentinel overlay tip */}
              {!isFocused && (
                <div className="absolute inset-x-0 inset-y-0.5 bg-zinc-950/65 backdrop-blur-[1.5px] flex items-center justify-center rounded-3xl z-10 font-mono text-sm text-[#e2b714] cursor-pointer">
                  <span className="animate-pulse">🞂 Click here or press any key to focus typing arena</span>
                </div>
              )}

              {blindMode && (
                <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-4 text-center z-13 rounded-3xl">
                  <AlertCircle className="w-8 h-8 text-[#e2b714] animate-bounce" />
                  <span className="text-xs font-bold text-white uppercase block mt-2">BLIND MOTOR CONFIDENCE ACTIVE</span>
                  <span className="text-[10px] text-zinc-500 font-sans block max-w-xs mt-1">Text strikes are hidden to enforce kinetic touch locations memory without visual aid.</span>
                </div>
              )}

              {/* Display divided paragraphs with no scroll */}
              <div id="divided-paragraphs" className="space-y-4 select-none">
                
                {/* Active Paragraph Block */}
                {lines[currentLineIndex] && (
                  <div id="active-paragraph-block" className="p-5 rounded-2xl bg-zinc-950/20 border border-zinc-900/40 relative">
                    <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
                      <span className="text-[10px] text-[#e2b714] uppercase tracking-widest font-semibold font-mono">
                        ✍️ Active Paragraph {currentLineIndex + 1} of {lines.length}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {words.length - currentWordIndex} words left
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2.5 py-1 text-lg md:text-xl leading-relaxed font-mono transition-all duration-300 min-h-[2.5rem] items-center text-left">
                      {lines[currentLineIndex].map((word, wInLineIdx) => {
                        const lineStartWordIdx = currentLineIndex * lineSize;
                        const absWordIdx = lineStartWordIdx + wInLineIdx;
                        
                        // Preceding words completed
                        if (absWordIdx < currentWordIndex) {
                          const isCorrect = wordStatuses[absWordIdx];
                          if (isCorrect) {
                            return (
                              <span key={wInLineIdx} className="text-[#f1f5f9] transition-colors duration-150">
                                {word}
                              </span>
                            );
                          } else {
                            return (
                              <span key={wInLineIdx} className="text-[#f43f5e] border-b-2 border-dotted border-[#f43f5e]/80 transition-colors duration-150">
                                {word}
                              </span>
                            );
                          }
                        }
                        
                        // Current active word
                        if (absWordIdx === currentWordIndex) {
                          return (
                            <span key={wInLineIdx} className="relative inline-block px-1.5 py-0.5 rounded bg-zinc-900/60 border border-[#e2b714]/20">
                              {word.split('').map((char, cIdx) => {
                                let charColor = "text-zinc-500"; // Untyped
                                const isCursorHere = cIdx === currentWordInput.length;
                                
                                if (cIdx < currentWordInput.length) {
                                  const matches = currentWordInput[cIdx] === char;
                                  charColor = matches ? "text-[#f1f5f9]" : "text-[#f43f5e] bg-[#f43f5e]/15 font-bold rounded-sm";
                                }
                                
                                return (
                                  <span key={cIdx} className="relative">
                                    {isCursorHere && isFocused && (
                                      <span className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-[#e2b714] animate-pulse shadow-[0_0_8px_#e2b714]" />
                                    )}
                                    <span className={charColor}>{char}</span>
                                  </span>
                                );
                              })}
                              
                              {/* End-of-word cursor */}
                              {currentWordInput.length === word.length && isFocused && (
                                <span className="relative inline-block w-[1px]">
                                  <span className="absolute -left-[1px] top-0.5 bottom-0.5 w-[2px] bg-[#e2b714] animate-pulse shadow-[0_0_8px_#e2b714]" />
                                </span>
                              )}
                              
                              {/* Redundant spelling error chars typed past length */}
                              {currentWordInput.length > word.length && (
                                currentWordInput.slice(word.length).split("").map((char, cIdx) => (
                                  <span key={`extra-${cIdx}`} className="text-[#f43f5e] bg-[#f43f5e]/30 line-through text-base md:text-lg font-bold">
                                    {char}
                                  </span>
                                ))
                              )}
                            </span>
                          );
                        }
                        
                        // Future untyped words
                        return (
                          <span key={wInLineIdx} className="text-zinc-600 font-mono transition-all duration-150">
                            {word}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upcoming Paragraph / Next Line Block */}
                {currentLineIndex + 1 < lines.length && (
                  <div id="upcoming-paragraph-block" className="p-4 rounded-xl bg-zinc-950/10 border border-zinc-900/20 opacity-40 hover:opacity-60 transition-opacity duration-200">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold font-mono block mb-2">
                      ⏭️ Next Paragraph {currentLineIndex + 2}
                    </span>
                    <div className="flex flex-wrap gap-x-3.5 gap-y-2 text-sm md:text-base leading-relaxed font-mono text-zinc-650 text-left">
                      {lines[currentLineIndex + 1].map((word, wInLineIdx) => (
                        <span key={wInLineIdx} className="text-zinc-600">{word}</span>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>

            </div>

            {/* Fully disguised hidden inputs engine */}
            <input
              ref={inputRef}
              disabled={done}
              type="text"
              value={currentWordInput}
              onChange={handleWordInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              aria-label="Practice typing input"
              className="absolute opacity-0 pointer-events-none w-0 h-0"
              autoFocus
            />

            {/* Live indicators displayed cleanly beneath the text arena */}
            {started && (
              <div className="flex items-center justify-between font-mono text-xs text-zinc-500 max-w-4xl mx-auto px-6 py-2 bg-zinc-950/20 rounded-xl border border-zinc-900/30 animate-fade-in flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#e2b714] font-bold text-sm">{timeLeft}</span>s remaining
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#e2b714] font-bold text-sm">{getLiveWpm()}</span> WPM
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#e2b714] font-bold text-sm">{getLiveAccuracy()}%</span> Acc
                </div>
                <div className="flex items-center gap-2" title="Rhythm Stability (keystroke interval consistency)">
                  <span className="text-zinc-500">Rhythm Stability:</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
                      <div
                        className={`h-full bg-gradient-to-r from-amber-500 to-[#e2b714] transition-all duration-300 ${(() => {
                          const stabilityValue = keystrokeIntervals.length >= 5 ? calculateRhythmStability() : 0;
                          const normalized = Math.max(0, Math.min(100, Math.round(stabilityValue / 5) * 5));
                          return {
                            0: 'w-0',
                            5: 'w-[5%]',
                            10: 'w-[10%]',
                            15: 'w-[15%]',
                            20: 'w-[20%]',
                            25: 'w-[25%]',
                            30: 'w-[30%]',
                            35: 'w-[35%]',
                            40: 'w-[40%]',
                            45: 'w-[45%]',
                            50: 'w-[50%]',
                            55: 'w-[55%]',
                            60: 'w-[60%]',
                            65: 'w-[65%]',
                            70: 'w-[70%]',
                            75: 'w-[75%]',
                            80: 'w-[80%]',
                            85: 'w-[85%]',
                            90: 'w-[90%]',
                            95: 'w-[95%]',
                            100: 'w-full'
                          }[normalized] || 'w-full';
                        })}`}
                      />
                    </div>
                    <span className="text-[#e2b714] font-bold text-xs">
                      {keystrokeIntervals.length >= 5 ? `${calculateRhythmStability()}%` : 'calculating...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Live Keyboard layout during session + completed lines cards */}
            <div className="max-w-4xl mx-auto mt-8 space-y-6">
               
               {/* Real-time Keyboard Highlights and Live Heatmap */}
               <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 space-y-4 shadow-lg">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Keyboard className="w-4 h-4 text-[#e2b714]" />
                     <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">Live Typing Keyboard HUD</h3>
                   </div>
                   <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
                     <span className="w-2 h-2 rounded-full bg-[#e2b714] animate-pulse" />
                     <span>Active Target</span>
                   </div>
                 </div>
                 
                 <KeyboardLayout 
                   stats={keyStats} 
                   highlightedKey={(() => {
                     if (done) return undefined;
                     const activeWord = words[currentWordIndex];
                     if (!activeWord) return undefined;
                     if (currentWordInput.length < activeWord.length) {
                       return activeWord[currentWordInput.length];
                     } else {
                       return ' ';
                     }
                   })()} 
                   title="Real-Time Input Accuracy Feed" 
                 />
                 
                 <div className="text-[10px] text-zinc-500 font-sans text-center leading-normal">
                   Key colors indicate live typing accuracy. Press keys highlighted in <span className="text-[#e2b714] font-bold bg-[#e2b714]/10 px-1 rounded">Gold</span> to advance.
                 </div>
               </div>

               {/* Segmented Completed Parts Stream */}
               <div className="space-y-4">
                 <h3 className="text-xs font-bold text-zinc-400 subtitle uppercase tracking-widest font-mono">
                   Completed Milestone Parts ({completedLineStatsList.length})
                 </h3>
                 
                 {completedLineStatsList.length === 0 ? (
                   <div className="border border-dashed border-zinc-800/60 rounded-2xl p-6 text-center text-zinc-500 font-mono text-xs bg-zinc-950/20">
                     Finish typing the current line (part 1) to generate its accuracy analytics cards.
                   </div>
                 ) : (
                   <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                     {completedLineStatsList.map((part) => {
                       const partKeysWithErrors = Object.entries(part.stats)
                         .filter(([_, stats]) => stats.errors > 0)
                         .map(([k, _]) => k === ' ' ? 'SPACE' : k.toUpperCase())
                         .join(', ');
                       
                       return (
                         <div 
                           key={part.lineIdx} 
                           className="bg-[#1e2022]/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700/60 transition-all flex flex-col md:flex-row items-stretch gap-6"
                         >
                           <div className="flex-grow space-y-3 md:max-w-[45%] flex flex-col justify-between">
                             <div className="space-y-2">
                               <div className="flex items-center gap-2">
                                 <span className="text-emerald-400 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 font-bold border border-emerald-500/20 font-mono">
                                   PART {part.lineIdx + 1} COMPLETE
                                 </span>
                               </div>
                               <p className="text-zinc-300 font-mono text-xs leading-relaxed italic bg-zinc-950/30 p-2.5 rounded-lg border border-zinc-900/40 text-left">
                                 &ldquo;{part.textSnippet}&rdquo;
                               </p>
                             </div>
                             
                             <div className="text-[10px] font-mono space-y-1 text-left">
                               <div className="text-zinc-500">
                                 Weak spots determined: {' '}
                                 {partKeysWithErrors ? (
                                   <span className="text-rose-400 font-bold break-all">{partKeysWithErrors}</span>
                                 ) : (
                                   <span className="text-emerald-400 font-bold font-mono">None! Perfect typing run on this segment.</span>
                                 )}
                               </div>
                             </div>
                           </div>
                           
                           <div className="flex-grow max-w-full md:max-w-[55%] flex items-center justify-center">
                             <KeyboardLayout 
                               stats={part.stats} 
                               title={`Part ${part.lineIdx + 1} Error Heatmap`} 
                             />
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}
               </div>

            </div>

            {/* Manual reset action triggers */}
            <div className="flex items-center justify-center pt-2 select-none">
              <button
                onClick={resetPracticeArena}
                className="px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700/80 text-zinc-400 hover:text-white font-mono text-xs cursor-pointer transition shadow-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Session</span>
              </button>
            </div>

            {!started && renderPracticeLeaderboard()}

          </div>
        )}

      </div>

    </div>
  );
}
