import React from 'react';
import { Building2, Code2, Globe2, BookOpen, Milestone } from 'lucide-react';

interface Props {
  websiteLogo?: string;
  founderPicture?: string;
  mSquareLogo?: string;
  founderPictureSize?: number;
}

export default function AboutCompany({ websiteLogo, founderPicture, mSquareLogo, founderPictureSize = 64 }: Props) {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12 p-4">
      {/* Header Badge */}
      <div className="flex items-center gap-2 mb-6">
        <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase font-mono shadow-sm">
          Corporate Profile & Mission
        </span>
      </div>

      {/* Hero Section */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-cyan-500/20 to-purple-500/20" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-8 md:p-12 z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white font-display tracking-tight leading-tight">
              MiraCore Logix & M-Square Dev Group
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl font-mono">
              MiraCore Logix is a deep-tech computing pioneer pushing the frontiers of human-computer interaction, cognitive training frameworks, and high-performance neural software applications. In absolute coalition with <strong>M-Square Devs Group</strong>, we engineer immersive virtual learning architectures that redefine standard digital interfaces.
            </p>
            <div className="flex flex-wrap gap-4 pt-4 font-mono text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-cyan-400" /> Est: 2025</span>
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-purple-400" /> Groups: M-Square Devs</span>
              <span className="flex items-center gap-1.5"><Globe2 className="w-4 h-4 text-emerald-400" /> Stations: Global Arena</span>
            </div>
          </div>

          {/* Logos Side Block */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-4 shrink-0 z-20">
            {mSquareLogo && (
              <img src={mSquareLogo} alt="M-Square Logo" className="w-24 h-24 object-contain rounded-2xl border border-slate-700 bg-slate-950/80 p-2 shadow-lg hover:scale-105 transition-transform" />
            )}
            {websiteLogo && (
              <img src={websiteLogo} alt="FigTyp Logo" className="w-24 h-24 object-contain rounded-2xl border border-slate-700 bg-slate-950/80 p-2 shadow-lg hover:scale-105 transition-transform" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Founder Profile Card */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Milestone className="w-6 h-6 text-purple-400" />
                The Vision & Academic Founder
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-1.5 uppercase tracking-wider">
                Daffodil International University (DIU)
              </p>
            </div>
            
            {/* The Founder Picture is now safely contained here! */}
            {founderPicture && (
              <img
                src={founderPicture}
                alt="Founder"
                width={Math.max(64, founderPictureSize)}
                height={Math.max(64, founderPictureSize)}
                className="object-cover rounded-full border-4 border-slate-800 shadow-xl shrink-0 bg-slate-950"
              />
            )}
          </div>
          
          <div className="space-y-4 text-sm text-slate-300 font-sans leading-relaxed">
            <p>
              <strong className="text-white block mb-1 text-base">Md Moshiur Rahaman Riat — Chief Architect</strong>
              As a dedicated Software Engineering student at <strong>Daffodil International University</strong>, Md Moshiur Rahaman Riat recognized a severe technological disparity. Typing platforms routinely treated kinetic mechanics as simple casual games, completely neglecting the complex neural pipelines, cognitive muscle memory, and professional certification needs of developers and clerical officers.
            </p>
            <p>
              Under the financial patronage of <strong>MiraCore Logix</strong>, Riat designed the core FigTyp multi-layered engine. The concept blends low-latency gaming infrastructure, real-time analytics, and standard examination procedures into a single cohesive SaaS platform.
            </p>
          </div>
        </div>

        {/* Timeline Landmarks */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
           <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono mb-8 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyan-400" />
              Timeline Landmarks
            </h3>
            
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:to-purple-500">
              
              <div className="relative flex items-start gap-4">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-4 border-slate-900 bg-cyan-400 shrink-0 shadow-lg mt-1" />
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">2025</div>
                  <div className="font-bold text-white text-sm mt-0.5">MiraCore Logix Established</div>
                  <div className="text-xs text-slate-400 mt-1 leading-snug">Initiated structural R&D into biometric interfaces and typing engines.</div>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-4 border-slate-900 bg-purple-400 shrink-0 shadow-lg mt-1" />
                <div>
                  <div className="text-[10px] font-mono text-purple-400 uppercase font-bold tracking-wider">2026, Q4</div>
                  <div className="font-bold text-white text-sm mt-0.5">Daffodil SWE Alliance</div>
                  <div className="text-xs text-slate-400 mt-1 leading-snug">Moshiur Riat commences prototyping the FigTyp modular design specs.</div>
                </div>
              </div>

              <div className="relative flex items-start gap-4">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-4 border-slate-900 bg-emerald-400 shrink-0 shadow-lg mt-1" />
                <div>
                  <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">2026</div>
                  <div className="font-bold text-white text-sm mt-0.5">FigTyp Arena Launched</div>
                  <div className="text-xs text-slate-400 mt-1 leading-snug">Officially entered commercial status offering global neural typist arenas.</div>
                </div>
              </div>

            </div>
        </div>
      </div>
    </div>
  );
}