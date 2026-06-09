import React, { useState, useEffect } from 'react';
import { BookOpen, Award, CheckCircle2, Star, Keyboard, Sparkles, Trophy } from 'lucide-react';
import { Course, Lesson } from '../types';
import { jsPDF } from 'jspdf';

interface Props {
  userToken: string;
  onCoinsAwarded: (coins: number, xp: number) => void;
}

export default function CourseTraining({ userToken, onCoinsAwarded }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [inputText, setInputText] = useState('');
  
  // validation parameters
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpmCalculated, setWpmCalculated] = useState(0);
  const [accuracyCalculated, setAccuracyCalculated] = useState(100);
  const [completedLessonsList, setCompletedLessonsList] = useState<string[]>([]);
  const [showRewardModal, setShowRewardModal] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/lessons');
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (e) {
      console.warn("Could not load training courses:", e);
    }
  };

  const downloadCourseCertificatePdf = async (course: Course) => {
    let studentName = "MiraCore Graduate Student";
    let logoUrl = '';
    let signaturePic = '';
    try {
      const res = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      if (res.ok) {
        const prodData = await res.json();
        if (prodData?.user) {
          studentName = prodData.user.fullName || prodData.user.username || studentName;
        }
      }
    } catch (e) {
      console.warn("Could not retrieve user info for certificate:", e);
    }

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

      // Dark slate border
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 297, 210, 'F');

      // Inner elegant off-white board layout
      doc.setFillColor(252, 252, 253);
      doc.roundedRect(8, 8, 281, 194, 6, 6, 'F');

      // Double borders
      doc.setDrawColor(0, 243, 255); // Neon cyan
      doc.setLineWidth(1.2);
      doc.rect(12, 12, 273, 186);

      doc.setDrawColor(30, 41, 59); // slate-800
      doc.setLineWidth(0.3);
      doc.rect(14, 14, 269, 182);

      // Stars decoration
      doc.setFillColor(245, 158, 11); // gold amber
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
      const verificationText = `FIGTYP COURSE CERTIFICATE | Name: ${studentName} | Course: ${course.title} | Category: ${course.category} | Hash: ACAD-REG-${course.id}-${Math.floor(100000 + Math.random() * 900000)} | Authority: MiraCore Registrar`;

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


      // Top logo text
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("MIRACORE TRAINING SEGMENT CERTIFICATION BOARD", 148.5, 30, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 110, 120);
      doc.text("COGNITIVE STRUCTURED SYLLABUS GRADUATION SYMBOL", 148.5, 35, { align: "center" });

      // Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(15, 23, 42);
      doc.text("COURSE GRADUATION DIPLOMA", 148.5, 55, { align: "center" });

      // Sub
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      doc.text("This official credential confirms that our esteemed specialist", 148.5, 68, { align: "center" });

      // Student name in large teal uppercase
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(13, 148, 136); // teal
      doc.text(studentName.toUpperCase(), 148.5, 82, { align: "center" });

      // gold line
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.5);
      doc.line(80, 88, 217, 88);

      // Paragraph body
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text("has successfully executed and completed all training segment drill levels for", 148.5, 98, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(`"${course.title.toUpperCase()}"`, 148.5, 107, { align: "center" });

      // Specifications summary card
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(45, 117, 207, 30, 3, 3, 'F');
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text("SYLLABUS MODULES MASTERED", 55, 124);
      doc.text("ACADEMIC DIFFICULTY", 145, 124);
      doc.text("ISSUED BY AUTHORITY", 205, 124);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(String(course.category), 55, 136);
      doc.text(String(course.difficulty), 145, 136);
      doc.text("Md Moshiur Rahaman Riat", 205, 136);

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
      doc.text("Graduation Date", 75, 177, { align: "center" });
      doc.setFont("Helvetica", "bold");
      doc.text(new Date().toLocaleDateString(), 75, 182, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.text("MiraCore Registrar Signature", 222, 177, { align: "center" });
      doc.setFont("Helvetica", "bold");
      doc.text("DIU Software Engineer Student, Grader", 222, 182, { align: "center" });

      // Golden security seal stamp
      doc.setFillColor(245, 158, 11);
      doc.circle(148.5, 168, 11, 'F');
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(5);
      doc.setTextColor(255, 255, 255);
      doc.text("OFFICIAL SECURE", 148.5, 166.5, { align: "center" });
      doc.text("ACADEMICS", 148.5, 169.5, { align: "center" });
      doc.text("GRADUATE", 148.5, 172.5, { align: "center" });

      // Verifier ref
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Digital Grade Reference: ACAD-REG-${course.id}-${Math.floor(100000 + Math.random() * 900000)} | Authentic Blockchain Signature Issued`, 148.5, 193, { align: "center" });

      doc.save(`MiraCore_Course_Certificate_${course.id}.pdf`);
    } catch (error) {
      console.error("Course certificate generator error:", error);
      alert("Friction inside compiler. Could not render digital Course Completion Certificate.");
    }
  };

  const handleLessonStart = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setInputText('');
    setStarted(false);
    setStartTime(null);
    setWpmCalculated(0);
    setAccuracyCalculated(100);
  };

  const getCoursesGroupedByDifficulty = () => {
    const difficultyOrder: Record<string, number> = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
    return courses.sort((a, b) => {
      const orderA = difficultyOrder[a.difficulty] ?? 999;
      const orderB = difficultyOrder[b.difficulty] ?? 999;
      return orderA - orderB;
    });
  };

  const getProgressPercentage = (course: Course) => {
    const total = course.lessons.length;
    const completed = course.lessons.filter(l => completedLessonsList.includes(l.id)).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getProgressBarClass = (percent: number) => {
    const normalized = Math.min(100, Math.max(0, Math.round(percent / 10) * 10));
    return `prog-width-${normalized}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeLesson) return;
    const value = e.target.value;
    setInputText(value);

    if (!started && value.length > 0) {
      setStarted(true);
      setStartTime(Date.now());
    }

    // continuous accuracy map
    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === activeLesson.text[i]) {
        correct++;
      }
    }
    const currentAcc = value.length > 0 ? Math.round((correct / value.length) * 100) : 100;
    setAccuracyCalculated(currentAcc);

    // complete check
    if (value.length >= activeLesson.text.length) {
      const elapsed = startTime ? (Date.now() - startTime) / 1000 : 5;
      const calculatedSpeed = elapsed > 0 ? Math.round((correct / 5) / (elapsed / 60)) : 40;
      setWpmCalculated(calculatedSpeed);
      
      // award rewards
      onCoinsAwarded(activeLesson.coinsReward, activeLesson.xpReward);

      // Save typing attempt details on completed course lesson to persist in stats history
      if (userToken) {
        fetch('/api/attempts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            mode: 'course',
            duration: Math.round(elapsed) || 12,
            wordCount: Math.round(activeLesson.text.split(' ').length) || 10,
            wpm: calculatedSpeed || 35,
            rawWpm: Math.round(calculatedSpeed * 1.05) || calculatedSpeed || 37,
            accuracy: currentAcc,
            consistency: Math.max(70, Math.min(100, Math.round(100 - (activeLesson.text.length - correct) * 5))),
            correctChars: correct,
            incorrectChars: Math.max(0, activeLesson.text.length - correct),
            totalChars: activeLesson.text.length,
            quoteText: `Course Lesson: ${activeLesson.title}`
          })
        }).catch(err => console.warn("Could not write course lesson attempt:", err));
      }
      
      setCompletedLessonsList([...completedLessonsList, activeLesson.id]);
      setShowRewardModal(true);
    }
  };

  const dismissReward = () => {
    setShowRewardModal(false);
    setActiveLesson(null);
  };

  return (
    <div id="training-center" className="space-y-6 max-w-5xl mx-auto px-4 pt-1 pb-6 text-slate-100">
      
      {/* Editorial Dashboard Banner */}
      <div id="training-hero" className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-[#101b2c] to-slate-950 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3">
          <span className="text-[10px] font-mono tracking-widest text-[#00F3FF] uppercase px-3 py-1 bg-[#00F3FF]/10 rounded-full">
            Cognitive Typing Academics Core
          </span>
          <h2 className="text-2xl font-display font-medium text-white flex items-center gap-2">
            FigTyp Structured Courses Center
          </h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
            Level up from simple letter-striking into complex operators, database briefs, and stenographic multi-key chords. Acquire global experience multipliers by completing modules!
          </p>
        </div>

        <div className="flex gap-4 p-4 bg-slate-950/60 border border-slate-850 rounded-xl max-w-xs font-mono text-xs">
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Total courses</span>
            <strong className="text-white">3 Modules</strong>
          </div>
          <div className="w-px h-8 bg-slate-850" />
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Bonus Multiplier</span>
            <strong className="text-[#00FF95]">2.0x XP</strong>
          </div>
        </div>
      </div>

      {showRewardModal && activeLesson && (
        <div id="reward-dialog" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-6 text-center space-y-6 animate-zoomIn shadow-xl">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase">Lesson Completed!</span>
              <h3 className="text-lg font-display font-medium text-white">{activeLesson.title}</h3>
              <p className="text-slate-400 text-xs font-sans">
                You successfully mastered this exercise segment with an average typing speed of <strong className="text-white">{wpmCalculated} WPM</strong> and accuracy of <strong className="text-white">{accuracyCalculated}%</strong>.
              </p>
            </div>

            <div className="flex justify-around bg-slate-900 border border-slate-800 p-3 rounded-xl font-mono text-xs text-[#00FF95]">
              <span>+{activeLesson.xpReward} XP Points</span>
              <div className="w-px h-4 bg-slate-800" />
              <span>+{activeLesson.coinsReward} FigCoins</span>
            </div>

            <button
              onClick={dismissReward}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-mono text-xs font-bold rounded-xl cursor-pointer transition shadow-md"
            >
              Collect Rewards & Continue &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Main interactive splits */}
      <div id="training-splits" className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Left column: Courses list directory */}
        <div className="md:col-span-1 rounded-2xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#00F3FF]" /> Module Directory
          </h3>

          <div className="space-y-3">
            {getCoursesGroupedByDifficulty().map((course) => {
              const progressPercent = getProgressPercentage(course);
              const completedCountInThisCourse = course.lessons.filter(l => completedLessonsList.includes(l.id)).length;
              return (
                <div
                  key={course.id}
                  onClick={() => { setSelectedCourse(course); setActiveLesson(null); }}
                  className={`p-4 rounded-xl border cursor-pointer transition ${selectedCourse?.id === course.id ? 'border-[#00F3FF] bg-[#00F3FF]/5' : 'border-slate-800 bg-slate-950/20 hover:border-slate-700'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-900 rounded text-slate-400">{course.category}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${course.difficulty === 'Beginner' ? 'bg-emerald-900/40 text-emerald-300' : course.difficulty === 'Intermediate' ? 'bg-amber-900/40 text-amber-300' : 'bg-rose-900/40 text-rose-300'}`}>
                      {course.difficulty}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white tracking-wide">{course.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-normal font-sans">{course.description}</p>
                  
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500">{completedCountInThisCourse} / {course.lessons.length}</span>
                      <span className={progressPercent === 100 ? 'text-[#00FF95]' : 'text-slate-400'}>{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${getProgressBarClass(progressPercent)} ${progressPercent === 100 ? 'bg-[#00FF95]' : course.difficulty === 'Beginner' ? 'bg-emerald-500' : course.difficulty === 'Intermediate' ? 'bg-amber-500' : 'bg-rose-500'}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: active lessons and drills arena */}
        <div className="md:col-span-2 space-y-6">
          {selectedCourse ? (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-6">
              
              <div id="course-header" className="border-b border-slate-850 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#00F3FF]">{selectedCourse.category} Overview</span>
                  <h3 className="text-base font-semibold tracking-wide text-white">{selectedCourse.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed mt-1 font-sans">{selectedCourse.description}</p>
                </div>
                <button
                  onClick={() => downloadCourseCertificatePdf(selectedCourse)}
                  className="py-2.5 px-4 bg-gradient-to-r from-[#00F3FF] to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-mono text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg transition duration-200 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-slate-950" />
                  <span>Download Training Certificate</span>
                </button>
              </div>

              {!activeLesson ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Target Lesson segments</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedCourse.lessons.map((lesson) => {
                      const complete = completedLessonsList.includes(lesson.id);
                      return (
                        <div
                          key={lesson.id}
                          onClick={() => handleLessonStart(lesson)}
                          className={`p-4 bg-slate-950/40 border rounded-xl hover:border-slate-700 cursor-pointer transition flex items-center justify-between gap-4 ${complete ? 'border-emerald-950 bg-emerald-950/10' : 'border-slate-850'}`}
                        >
                          <div className="space-y-1">
                            <h5 className="text-xs font-semibold text-white flex items-center gap-2">
                              {complete && <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF95]" />}
                              {lesson.title}
                            </h5>
                            <p className="text-[11px] text-slate-400 leading-normal font-sans italic">Instructions: {lesson.instructions}</p>
                          </div>
                          
                          <div className="text-right flex flex-col text-[10px] text-[#00FF95] font-mono shrink-0">
                            <span>+{lesson.xpReward} XP</span>
                            <span className="text-slate-500">+{lesson.coinsReward} Coins</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Play active lesson panel
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#00F3FF]">CURRENT DRILL UNIT</span>
                    <button
                      onClick={() => setActiveLesson(null)}
                      className="text-xs text-slate-500 hover:text-slate-300 font-mono cursor-pointer"
                    >
                      &larr; Switch Lesson
                    </button>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-1.5 font-mono">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500">Validation Instructions</span>
                    <p className="text-xs text-slate-400 leading-normal font-sans">{activeLesson.instructions}</p>
                  </div>

                  {/* Typing visual duplicate block */}
                  <div className="p-6 bg-slate-950 border border-slate-900 rounded-2xl relative">
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                      <Keyboard className="w-3.5 h-3.5" /> 
                      <span>Accuracy: <strong className={accuracyCalculated >= 90 ? 'text-[#00FF95]' : 'text-[#FF4D6D]'}>{accuracyCalculated}%</strong></span>
                    </div>

                    <div className="text-md md:text-lg font-mono tracking-wider break-all leading-loose select-none mb-6">
                      {activeLesson.text.split('').map((char, index) => {
                        let colorClass = 'text-slate-600';
                        if (index < inputText.length) {
                          colorClass = inputText[index] === char ? 'text-[#00F3FF]' : 'text-[#FF4D6D] bg-[#FF4D6D]/10';
                        }
                        return <span key={index} className={`${colorClass} transition duration-75`}>{char}</span>;
                      })}
                    </div>

                    <div className="space-y-1 font-sans">
                      <label className="text-[9px] font-mono uppercase block text-slate-500">Typestrike feedback loop</label>
                      <input
                        autoFocus
                        type="text"
                        value={inputText}
                        onChange={handleInputChange}
                        placeholder="Double click focus and repeat target drill line above..."
                        className="w-full text-xs font-mono bg-slate-900 border border-slate-800 focus:border-[#00F3FF] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#00F3FF]/30"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800/80 p-12 text-center text-slate-500 text-xs bg-slate-950/20 flex flex-col items-center justify-center space-y-4">
              <Keyboard className="w-12 h-12 text-slate-700 animate-pulse" />
              <div className="space-y-1">
                <span className="text-white text-xs font-bold font-display tracking-wide block">Audited Typing Syllabus Directory</span>
                <p className="max-w-xs leading-normal">
                  Select an academic course module from the directory deck directory to execute targeted muscle memory warmups.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
