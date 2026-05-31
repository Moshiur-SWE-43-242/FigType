import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Target, Users, Mail, Bookmark, Globe, Calendar, UserCheck } from 'lucide-react';

interface Props {
  websiteLogo?: string;
  founderPicture?: string;
  mSquareLogo?: string;
  founderPictureSize?: number;
}

export default function AboutCompany({ websiteLogo, founderPicture, mSquareLogo, founderPictureSize }: Props) {
  const avatarRef = useRef<HTMLImageElement | null>(null);
  const [feedback, setFeedback] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (avatarRef.current) {
      avatarRef.current.style.setProperty('--founder-avatar-size', `${founderPictureSize || 48}px`);
    }
  }, [founderPictureSize]);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.email || !feedback.message) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFeedback({ name: '', email: '', message: '' });
    }, 4000);
  };

  return (
    <div id="about-container" className="space-y-8 max-w-5xl mx-auto px-4 pt-1 pb-6 text-slate-100">
      {/* Editorial Corporate Introduction */}
      <div id="about-hero" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#111827] to-[#0B0F19] p-8 md:p-12 border border-slate-800 neon-shadow-blue flex flex-col md:flex-row items-center justify-between gap-8">
        <div id="about-decor" className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full md:w-3/4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-widest text-[#00F3FF] uppercase px-3 py-1 bg-[#00F3FF]/10 rounded-full">
              Corporate Profile & Mission
            </span>
            {founderPicture && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-full text-xs text-white font-mono transition-all duration-300">
                <div className="relative shrink-0 flex items-center justify-center">
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 z-10" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 animate-ping z-10" />
                  <img 
                    src={founderPicture} 
                    alt="Founder portrait" 
                    className="rounded-full object-cover border border-[#8B5CF6]/40 bg-slate-950 shadow-md transition-all duration-300 founder-avatar" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <span className="text-[#A78BFA] font-medium font-sans">MD MOSHIUR RAHAMAN RIAT — Founder Verified Profile</span>
              </div>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-white">
            MiraCore Logix & M-Square Dev Group
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            MiraCore Logix is a deep-tech computing pioneer pushing the frontiers of human-computer interaction, cognitive training frameworks, and high-performance neural software applications. In absolute coalition with **M-Square Devs Group**, we engineer immersive virtual learning architectures that redefine standard digital interfaces.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-[#00F3FF] text-xs font-mono">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Est: 2025</span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Group: M-Square Devs</span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Status: Global Arena</span>
          </div>
        </div>

        {/* Dynamic Logo layout block pointing to by mockup screenshot */}
        <div className="w-full md:w-1/4 flex flex-col gap-4 shrink-0">
          
          {/* M-Square Devs Logo Block */}
          <div className="flex items-center justify-center p-2 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 h-24 relative overflow-hidden backdrop-blur-sm z-10 hover:border-[#FF007F]/45 transition duration-300">
            {mSquareLogo ? (
              <img 
                src={mSquareLogo} 
                alt="M-Square Devs Logo" 
                className="max-h-20 max-w-full rounded-lg object-contain w-full h-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#FF007F]/15 to-[#7F00FF]/15 border border-[#FF007F]/30 flex flex-col items-center justify-center font-display font-black text-white text-base shadow-lg transition-all duration-300">
                <span className="text-[#FF007F] font-bold text-lg tracking-wider">M2 DEVS</span>
                <span className="text-[8px] text-slate-500 font-mono tracking-widest mt-0.5 uppercase">Consortium</span>
              </div>
            )}
          </div>

          {/* MiraCore Logix Logo Block */}
          <div className="flex items-center justify-center p-2 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 h-24 relative overflow-hidden backdrop-blur-sm z-10 hover:border-[#00F3FF]/45 transition duration-300">
            {websiteLogo ? (
              <img 
                src={websiteLogo} 
                alt="MiraCore Logix Logo" 
                className="max-h-20 max-w-full rounded-lg object-contain w-full h-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#00F3FF]/15 to-[#3B82F6]/15 border border-[#00F3FF]/30 flex flex-col items-center justify-center font-display font-black text-white text-base shadow-lg transition-all duration-300">
                <span className="text-[#00F3FF] font-bold text-lg tracking-wider">FIGTYPE</span>
                <span className="text-[8px] text-slate-500 font-mono tracking-widest mt-0.5 uppercase">MiraCore</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* The Founder Journey Block */}
      <div id="founder-journey" className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        <div className="md:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800 p-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6]">
                <Bookmark className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white font-display">The Vision & Academic Founder</h3>
                <p className="text-xs text-slate-500 font-mono">Daffodil International University (SWE)</p>
              </div>
            </div>

            {/* Dynamic Founder Picture Portrait */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative shadow-md">
              {founderPicture ? (
                <img src={founderPicture} alt="Founder Portrait" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold font-display text-[#8B5CF6]">MR</span>
                  <span className="text-[7px] font-mono text-slate-500 uppercase block mt-0.5">Academic</span>
                </div>
              )}
            </div>
          </div>
          <h4 className="text-base font-semibold text-slate-200">Md Moshiur Rahaman Riat — Chief Architect</h4>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            As a dedicated Software Engineering student at **Daffodil International University**, Md Moshiur Rahaman Riat recognized a severe technological disparity. Typing platforms routinely treated kinetic mechanics as simple casual games, completely neglecting the complex neural pipelines, cognitive muscle memory, and professional certification needs of developers and clerical officers.
          </p>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            Under the financial patronage of **MiraCore Logix**, Riat designed the core <strong>FigType</strong> multi-layered engine. The concept blends low-latency gaming infrastructure, real-time multiplayer lobbies, structured steno chord lessons, and intelligent training feedback. We are transforming simple typing exercises into high-performance training regimens.
          </p>
        </div>

        {/* Corporate Timeline Card */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 space-y-6">
          <h3 className="text-md font-semibold tracking-wider font-mono text-white flex items-center gap-2 uppercase">
            <Calendar className="w-4 h-4 text-[#00F3FF]" /> Timeline Landmarks
          </h3>
          <div className="relative border-l border-slate-800 pl-4 space-y-4 text-xs">
            <div className="relative">
              <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[#00F3FF] ring-4 ring-[#00F3FF]/10" />
              <div className="font-mono text-[#00F3FF] font-semibold">2025</div>
              <div className="font-semibold text-white">MiraCore Logix Established</div>
              <div className="text-slate-500">Initiated structural R&D into biometric interfaces and typing engines.</div>
            </div>
            <div className="relative">
              <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[#8B5CF6] ring-4 ring-[#8B5CF6]/10" />
              <div className="font-mono text-[#8B5CF6] font-semibold">2025 Q4</div>
              <div className="font-semibold text-white">Daffodil SWE Alliance</div>
              <div className="text-slate-500">Moshiur Riat commences prototyping the FigType modular design spec.</div>
            </div>
            <div className="relative">
              <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[#00FF95] ring-4 ring-[#00FF95]/10" />
              <div className="font-mono text-[#00FF95] font-semibold">2026</div>
              <div className="font-semibold text-white">FigType Arena Launched</div>
              <div className="text-slate-500">Officially entered commercial status offering global neural typist arenas.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Philosophy */}
      <div id="company-values" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-slate-950/40 p-6 border border-slate-800/80 hover:border-[#00F3FF]/30 transition">
          <div className="text-[#00F3FF] mb-2"><Target className="w-5 h-5" /></div>
          <h4 className="text-sm font-semibold text-white mb-2">Primary Mission</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Unify kinetic motor training with professional grading standards, enabling standard typists to safely transition into high-speed shorthand and programming workflows.
          </p>
        </div>
        <div className="rounded-xl bg-slate-950/40 p-6 border border-slate-800/80 hover:border-[#00FF95]/30 transition">
          <div className="text-[#00FF95] mb-2"><ShieldCheck className="w-5 h-5" /></div>
          <h4 className="text-sm font-semibold text-white mb-2">Cryptographic Safety</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Ensure typing records, certificates, and multi-session tokens are mathematically secure, preventing cheating or falsified credentials.
          </p>
        </div>
        <div className="rounded-xl bg-slate-950/40 p-6 border border-slate-800/80 hover:border-[#8B5CF6]/30 transition">
          <div className="text-[#8B5CF6] mb-2"><UserCheck className="w-5 h-5" /></div>
          <h4 className="text-sm font-semibold text-white mb-2">Academic Integrity</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Developed by computer scientists and software engineers at Daffodil Group. Rooted tightly in kinetic muscle memory studies.
          </p>
        </div>
      </div>

      {/* Support Portal & Feedback System */}
      <div id="support-portal" className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8">
        <div className="space-y-4">
          <h3 className="text-xl font-display font-semibold text-white">MiraCore Support & Inquiry Portal</h3>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            Need custom campus licensing, tournament custom rooms, or steno keyboard hardware integrations? Our support engineers are online 24/7.
          </p>
          <div className="space-y-2 text-xs md:text-sm font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#00F3FF]" />
              <span>General Inquiries: <a href="mailto:m2devs.support@gmail.com" className="text-[#00F3FF] hover:underline">m2devs.support@gmail.com</a></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#8B5CF6]" />
              <span>Md Moshiur: <a href="mailto:riat.moshiur22@gmail.com" className="text-[#8B5CF6] hover:underline">riat.moshiur22@gmail.com</a></span>
            </div>
          </div>
        </div>

        {/* Interactive Feedback Form */}
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <h4 className="text-sm font-mono font-semibold tracking-wider text-[#00F3FF] uppercase">Send Client Feedback</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Your Name</label>
              <input
                type="text"
                placeholder="Riat Moshiur"
                value={feedback.name}
                onChange={(e) => setFeedback({ ...feedback, name: e.target.value })}
                className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none rounded p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Your Email</label>
              <input
                type="email"
                required
                placeholder="coder@diu.edu.bd"
                value={feedback.email}
                onChange={(e) => setFeedback({ ...feedback, email: e.target.value })}
                className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none rounded p-2.5 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Inquiry / Message Body</label>
            <textarea
              required
              rows={3}
              placeholder="Write your feedback details here. Our engineers will verify and reach out via email."
              value={feedback.message}
              onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
              className="w-full text-xs bg-slate-950 border border-slate-800 focus:border-[#00F3FF] outline-none rounded p-2.5 text-white resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs font-semibold rounded cursor-pointer transition shadow-md"
          >
            Submit Feedback Report
          </button>

          {submitted && (
            <p className="text-[#00FF95] text-xs font-mono text-center animate-pulse">
              ✓ Telemetry successfully filed! Thank you for backing FigType development.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
