import React from 'react';
import { Github, Linkedin, Facebook, Instagram, Shield, Heart, Award, ArrowUp } from 'lucide-react';

interface Props {
  onSelectTab?: (tab: string) => void;
}

export default function BrandedFooter({ onSelectTab }: Props) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHubClick = (tab: string) => {
    if (onSelectTab) {
      onSelectTab(tab);
      scrollToTop();
    } else {
      scrollToTop();
    }
  };

  return (
    <footer id="branded-footer" className="relative mt-24 border-t border-slate-900 bg-[#090b11] py-12 px-6 text-slate-400 text-xs font-mono">
      <div id="footer-decor-glow" className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#00F3FF] to-transparent opacity-40" />

      <div id="footer-content" className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Branding Attribution Block */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold font-display tracking-wider text-white">FIG<span className="text-[#00F3FF]">TYP</span></span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 bg-[#00F3FF]/10 text-[#00F3FF] rounded">v1.0.0</span>
          </div>
          <p className="text-slate-500 leading-relaxed text-[11px] font-sans">
            The world's premier typing arena. Developed with cryptographic motor safety, gamified progression systems, and advanced coaching analytics in Daffodil SWE Group.
          </p>
          <div className="text-[11px] font-sans text-slate-500">
            Powered by <strong className="text-slate-300">MiraCore Logix</strong><br />
            A Subsidiary of <strong className="text-slate-300">M-Square Devs Group</strong>
          </div>
        </div>

        {/* Dynamic Navigation helpers */}
        <div className="space-y-3">
          <h5 
            onClick={() => handleHubClick('PRACTICE')} 
            className="text-xs font-semibold tracking-wider text-white uppercase font-display cursor-pointer hover:text-[#00F3FF] transition flex items-center gap-1.5"
          >
            System Hubs
          </h5>
          <ul className="space-y-2 text-slate-500 text-[11px]">
            <li><span onClick={() => handleHubClick('PRACTICE')} className="hover:text-[#00F3FF] cursor-pointer transition">Practice Core Arena</span></li>
            <li><span onClick={() => handleHubClick('MULTIPLAYER')} className="hover:text-[#00F3FF] cursor-pointer transition">Multiplayer Lobby</span></li>
            <li><span onClick={() => handleHubClick('REWARDS')} className="hover:text-[#00F3FF] cursor-pointer transition">Training Certification</span></li>
            <li><span onClick={() => handleHubClick('COACH')} className="hover:text-[#00F3FF] cursor-pointer transition">Personal Coach Insights</span></li>
          </ul>
        </div>

        {/* DaffodilSWE Info Block */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold tracking-wider text-white uppercase font-display">Founder Office</h5>
          <div className="text-slate-500 space-y-2 leading-relaxed text-[11px] font-sans">
            <p><strong>Md Moshiur Rahaman Riat</strong><br />Software Engineering student at Daffodil International University.</p>
            <p className="font-mono text-slate-600 text-[10px]">DIU Campus, Dhaka, Bangladesh</p>
            <p>Support: <a href="mailto:m2devs.support@gmail.com" className="hover:text-[#00F3FF] text-slate-400">m2devs.support@gmail.com</a></p>
          </div>
        </div>

        {/* Official Channels Links */}
        <div className="space-y-4">
          <h5 className="text-xs font-semibold tracking-wider text-white uppercase font-display">Official Channels</h5>
          <div className="flex gap-3 text-slate-500">
            <a 
              href="https://github.com/Moshiur-SWE-43-242" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="GitHub"
              className="p-2 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 hover:text-[#00F3FF] hover:border-[#00F3FF]/40 transition"
              id="github-link"
            >
              <Github className="w-4 h-4" />
            </a>
            <a 
              href="https://www.linkedin.com/in/md-moshiur-rahaman-riat-ba7624319/" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="LinkedIn"
              className="p-2 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-500/40 transition"
              id="linkedin-link"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a 
              href="https://www.facebook.com/profile.php?id=61573284586971" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Facebook"
              className="p-2 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-600/40 transition"
              id="facebook-link"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a 
              href="https://www.instagram.com/miracore_logix/" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Instagram"
              className="p-2 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 hover:text-pink-500 hover:border-pink-500/40 transition"
              id="instagram-link"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
          <div className="text-[10px] text-slate-600 leading-relaxed font-sans">
            Landmarks established globally in <strong>2025</strong>.<br />
            SaaS release completed in <strong>2026</strong>.
          </div>
        </div>

      </div>

      <div id="footer-bottom" className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-950 flex flex-col md:flex-row items-center justify-between text-slate-600 text-[11px] font-sans">
        
        <div className="flex flex-wrap items-center gap-4">
          <span>&copy; 2026 FigTyp. Own copyrights of MiraCore Logix & M-Square Devs Group.</span>
          <span className="hidden md:inline text-slate-800">|</span>
          <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> All System Logs Verifiable</span>
        </div>

        <div className="flex items-center gap-6 mt-4 md:mt-0 font-mono text-[10px]">
          <span className="flex items-center gap-1 text-slate-500">
            Crafted with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by Moshiur Riat
          </span>
          <button 
            onClick={scrollToTop} 
            className="flex items-center gap-1 hover:text-[#00F3FF] hover:underline transition cursor-pointer"
          >
            Scroll to Top <ArrowUp className="w-3 h-3" />
          </button>
        </div>

      </div>
    </footer>
  );
}
