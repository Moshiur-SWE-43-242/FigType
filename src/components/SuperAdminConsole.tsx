import React, { useState, useEffect } from 'react';
import { Shield, PlusCircle, Trash2, Calendar, FileText, Bell, Loader2, Eye, Upload, RefreshCw, Link, Edit } from 'lucide-react';
import { AuditLog, CMSNotice, Contest } from '../types';

interface Props {
  userToken: string;
  onLogoUpdated?: (newLogo: string) => void;
  onFounderPictureUpdated?: (newPic: string) => void;
  onMSquareLogoUpdated?: (newLogo: string) => void;
  onFounderPictureSizeUpdated?: (newSize: number) => void;
  founderPictureSize?: number;
}

export default function SuperAdminConsole({ userToken, onLogoUpdated, onFounderPictureUpdated, onMSquareLogoUpdated, onFounderPictureSizeUpdated, founderPictureSize }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [notices, setNotices] = useState<CMSNotice[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  
  // Notice form
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  
  // Contest form
  const [contestTitle, setContestTitle] = useState('');
  const [contestDescription, setContestDescription] = useState('');
  const [contestText, setContestText] = useState('');
  const [contestDuration, setContestDuration] = useState(60);
  const [contestStartTime, setContestStartTime] = useState('');
  const [contestEndTime, setContestEndTime] = useState('');
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [contestVisibility, setContestVisibility] = useState<'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'>('PUBLIC');
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<any[]>([]);
  const [selectedInvitedUsers, setSelectedInvitedUsers] = useState<string[]>([]);

  // Helper to convert ISO dates back to datetimelocal format for form inputs
  const toLocalDatetimeString = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      const tzoffset = date.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
      return localISOTime;
    } catch {
      return '';
    }
  };

  // Logo & Branding Customization
  const [currentLogo, setCurrentLogo] = useState('');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // M-Square Devs Logo Customization
  const [currentMSquareLogo, setCurrentMSquareLogo] = useState('');
  const [mSquareLogoUrlInput, setMSquareLogoUrlInput] = useState('');
  const [msDragActive, setMsDragActive] = useState(false);

  // Founder Picture Customization
  const [currentFounderPicture, setCurrentFounderPicture] = useState('');
  const [founderPictureUrlInput, setFounderPictureUrlInput] = useState('');
  const [fDragActive, setFDragActive] = useState(false);

  // Super Admin Signature Customization
  const [currentAdminSignature, setCurrentAdminSignature] = useState('');
  const [adminSignatureUrlInput, setAdminSignatureUrlInput] = useState('');
  const [sigDragActive, setSigDragActive] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'AUDITS' | 'NOTICES' | 'CONTESTS' | 'LOGO'>('AUDITS');

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'AUDITS') {
        const res = await fetch('/api/admin/logs', {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setLogs(data);
        }
      } else if (activeTab === 'NOTICES') {
        const localNotices = localStorage.getItem('figtyp_notices');
        if (localNotices) {
          setNotices(JSON.parse(localNotices));
        } else {
          try {
            const res = await fetch('/api/notices');
            const contentType = res.headers.get("content-type");
            if (res.ok && contentType && contentType.includes("application/json")) {
              const data = await res.json();
              if (data && data.length > 0) {
                setNotices(data);
                localStorage.setItem('figtyp_notices', JSON.stringify(data));
              }
            }
          } catch (e) {
            console.warn(e);
          }
        }
      } else if (activeTab === 'CONTESTS') {
        const res = await fetch('/api/contests');
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setContests(data);
        }

        try {
          const uRes = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${userToken}` }
          });
          if (uRes.ok) {
            const uData = await uRes.json();
            setAllRegisteredUsers(uData);
          }
        } catch (ue) {
          console.warn("Could not retrieve users directory for contest setup:", ue);
        }
      } else if (activeTab === 'LOGO') {
        const res = await fetch('/api/settings/logo');
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setCurrentLogo(data.websiteLogo || '');
          setLogoUrlInput(data.websiteLogo || '');
        }

        const msRes = await fetch('/api/settings/m-square-logo');
        const msContentType = msRes.headers.get("content-type");
        if (msRes.ok && msContentType && msContentType.includes("application/json")) {
          const msData = await msRes.json();
          setCurrentMSquareLogo(msData.mSquareLogo || '');
          setMSquareLogoUrlInput(msData.mSquareLogo || '');
        }

        const fRes = await fetch('/api/settings/founder-picture');
        const fContentType = fRes.headers.get("content-type");
        if (fRes.ok && fContentType && fContentType.includes("application/json")) {
          const fData = await fRes.json();
          setCurrentFounderPicture(fData.founderPicture || '');
          setFounderPictureUrlInput(fData.founderPicture || '');
        }

        const sigRes = await fetch('/api/settings/admin-signature');
        const sigContentType = sigRes.headers.get("content-type");
        if (sigRes.ok && sigContentType && sigContentType.includes("application/json")) {
          const sigData = await sigRes.json();
          setCurrentAdminSignature(sigData.adminSignaturePic || '');
          setAdminSignatureUrlInput(sigData.adminSignaturePic || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateWebsiteLogo = async (logoVal: string) => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/settings/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ websiteLogo: logoVal })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg('System-wide branding logo updated successfully!');
        setCurrentLogo(logoVal);
        setLogoUrlInput(logoVal);
        if (onLogoUpdated) onLogoUpdated(logoVal);
      } else {
        setStatusMsg(`Error: ${data.error || 'Failed to update logo'}`);
      }
    } catch {
      setStatusMsg('Network error trying to update logo.');
    } finally {
      setLoading(false);
    }
  };

  const updateMSquareLogo = async (logoVal: string) => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/settings/m-square-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ mSquareLogo: logoVal })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg('System-wide M-Square Devs logo updated successfully!');
        setCurrentMSquareLogo(logoVal);
        setMSquareLogoUrlInput(logoVal);
        if (onMSquareLogoUpdated) onMSquareLogoUpdated(logoVal);
      } else {
        setStatusMsg(`Error: ${data.error || 'Failed to update M-Square Devs logo'}`);
      }
    } catch {
      setStatusMsg('Network error trying to update M-Square Devs logo.');
    } finally {
      setLoading(false);
    }
  };

  const updateFounderPicture = async (picVal: string) => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/settings/founder-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ founderPicture: picVal })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg('System-wide Founder Picture updated successfully!');
        setCurrentFounderPicture(picVal);
        setFounderPictureUrlInput(picVal);
        if (onFounderPictureUpdated) onFounderPictureUpdated(picVal);
      } else {
        setStatusMsg(`Error: ${data.error || 'Failed to update founder picture'}`);
      }
    } catch {
      setStatusMsg('Network error trying to update founder picture.');
    } finally {
      setLoading(false);
    }
  };

  const updateFounderPictureSize = async (sizeVal: number) => {
    try {
      const res = await fetch('/api/settings/founder-picture-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ founderPictureSize: sizeVal })
      });
      if (res.ok) {
        if (onFounderPictureSizeUpdated) onFounderPictureSizeUpdated(sizeVal);
      }
    } catch {
      setStatusMsg('Network error trying to update founder picture size.');
    }
  };

  const updateAdminSignature = async (sigVal: string) => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/settings/admin-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ adminSignaturePic: sigVal })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg('Super Admin signature image saved successfully!');
        setCurrentAdminSignature(sigVal);
        setAdminSignatureUrlInput(sigVal);
      } else {
        setStatusMsg(`Error: ${data.error || 'Failed to update signature'}`);
      }
    } catch {
      setStatusMsg('Network error trying to update signature.');
    } finally {
      setLoading(false);
    }
  };

  // Generic File Handlers for Drag & Drop
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, updater: (val: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => updater(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDragEvents = (e: React.DragEvent, setDrag: (val: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDrag(true);
    else if (e.type === "dragleave") setDrag(false);
  };

  const handleDropEvent = (e: React.DragEvent, setDrag: (val: boolean) => void, updater: (val: string) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => updater(reader.result as string);
      reader.readAsDataURL(e.dataTransfer.files[0]);
    }
  };

  // --- OPTIMISTIC UI: CREATE NOTICE ---
  const createNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;

    setLoading(true);
    setStatusMsg('');

    // OPTIMISTIC UPDATE: Include 'active' field
    const newNotice: CMSNotice = {
      id: Date.now().toString(),
      title: noticeTitle,
      content: noticeContent,
      createdAt: new Date().toISOString(),
      active: true 
    };
    
    const updatedNotices = [newNotice, ...notices];
    setNotices(updatedNotices);
    localStorage.setItem('figtyp_notices', JSON.stringify(updatedNotices));

    setStatusMsg('Notice successfully published to user CMS dashboards!');
    setNoticeTitle('');
    setNoticeContent('');

    try {
      await fetch('/api/admin/cms/notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ title: noticeTitle, content: noticeContent })
      });
    } catch {
      console.warn('Network error while publishing notice, but UI is updated.');
    } finally {
      setLoading(false);
    }
  };

  // --- OPTIMISTIC UI: DELETE NOTICE ---
  const deleteNotice = async (id: string) => {
    const updatedNotices = notices.filter(n => n.id !== id);
    setNotices(updatedNotices);
    localStorage.setItem('figtyp_notices', JSON.stringify(updatedNotices));

    try {
      await fetch(`/api/admin/cms/notice/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
    } catch (e) {
      console.error("Failed to delete from server:", e);
    }
  };

  // --- OPTIMISTIC UI: CREATE/UPDATE CONTEST ---
  const handleContestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestTitle || !contestText) return;

    setLoading(true);
    setStatusMsg('');

    const startISO = contestStartTime ? new Date(contestStartTime).toISOString() : new Date().toISOString();
    const endISO = contestEndTime ? new Date(contestEndTime).toISOString() : new Date(Date.now() + 86400000).toISOString();

    // OPTIMISTIC UPDATE: Include required status, createdById, createdAt fields
    const pendingContest: Contest = {
      id: editingContestId || Date.now().toString(),
      title: contestTitle,
      description: contestDescription,
      contestText,
      duration: contestDuration,
      visibility: contestVisibility,
      shareCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      participants: 0,
      invitedUsers: selectedInvitedUsers,
      startTime: startISO,
      endTime: endISO,
      status: 'LIVE',
      createdById: 'admin-optimistic',
      createdAt: new Date().toISOString()
    };

    if (editingContestId) {
      setContests(contests.map(c => c.id === editingContestId ? pendingContest : c));
      setStatusMsg('Contest successfully updated!');
    } else {
      setContests([pendingContest, ...contests]);
      setStatusMsg(`Contest successfully published code: ${pendingContest.shareCode}`);
    }

    setContestTitle('');
    setContestDescription('');
    setContestText('');
    setContestStartTime('');
    setContestEndTime('');
    setContestVisibility('PUBLIC');
    setSelectedInvitedUsers([]);
    setEditingContestId(null);

    try {
      const url = editingContestId ? `/api/contests/${editingContestId}` : '/api/contests';
      const method = editingContestId ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify(pendingContest)
      });
    } catch {
      console.warn("Contest saved locally, backend offline.");
    } finally {
      setLoading(false);
    }
  };

  const startEditingContest = (cnt: Contest) => {
    setEditingContestId(cnt.id);
    setContestTitle(cnt.title);
    setContestDescription(cnt.description || '');
    setContestText(cnt.contestText);
    setContestDuration(cnt.duration);
    setContestStartTime(toLocalDatetimeString(cnt.startTime));
    setContestEndTime(toLocalDatetimeString(cnt.endTime));
    setContestVisibility(cnt.visibility || 'PUBLIC');
    setSelectedInvitedUsers(cnt.invitedUsers || []);
    
    const elem = document.getElementById('contest-creator-title');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const deleteContest = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contest race? There is no undo.')) {
      return;
    }
    
    setContests(contests.filter(c => c.id !== id));
    setStatusMsg('Contest race deleted successfully.');
    
    try {
      await fetch(`/api/contests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
    } catch {
      console.warn("Backend failed to delete contest, removed locally.");
    }
  };

  return (
    <div id="admin-module" className="space-y-6 max-w-5xl mx-auto px-4 pt-1 pb-6">
      
      {/* Header banner */}
      <div id="admin-header" className="p-6 rounded-2xl bg-gradient-to-r from-red-950/20 via-slate-900 to-slate-950 border border-slate-800/80 hover:border-red-500/30 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-[#FF4D6D]/10 text-[#FF4D6D]">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold tracking-tight text-white flex items-center gap-2">
              Super Admin Control Console <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-[#FF4D6D]/20 text-[#FF4D6D] rounded">Privileged</span>
            </h2>
            <p className="text-slate-400 text-xs font-sans">
              Global Platform Governance &bull; Authenticated via Employee Directory
            </p>
          </div>
        </div>
        
        {/* Tab triggers */}
        <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => { setActiveTab('AUDITS'); setStatusMsg(''); }}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg cursor-pointer transition ${activeTab === 'AUDITS' ? 'bg-[#FF4D6D] text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => { setActiveTab('NOTICES'); setStatusMsg(''); }}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg cursor-pointer transition ${activeTab === 'NOTICES' ? 'bg-[#FF4D6D] text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            CMS notices
          </button>
          <button
            onClick={() => { setActiveTab('CONTESTS'); setStatusMsg(''); }}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg cursor-pointer transition ${activeTab === 'CONTESTS' ? 'bg-[#FF4D6D] text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Create Race
          </button>
          <button
            onClick={() => { setActiveTab('LOGO'); setStatusMsg(''); }}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg cursor-pointer transition ${activeTab === 'LOGO' ? 'bg-[#FF4D6D] text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Branding & Logos
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 text-xs font-mono text-center rounded-xl bg-[#00FF95]/10 border border-[#00FF95]/20 text-[#00FF95]">
          ✓ {statusMsg}
        </div>
      )}

      {/* Primary Tab displays */}
      <div id="admin-main-window" className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-6 min-h-[400px]">
        
        {loading && activeTab === 'AUDITS' && (
          <div className="flex items-center justify-center p-12 text-slate-400 text-sm font-mono gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#FF4D6D]" /> Synchronizing system table state...
          </div>
        )}

        {!loading && activeTab === 'AUDITS' && (
          <div className="space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#FF4D6D]" /> Crypographic Security Auditing Trail
            </h3>
            
            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-850 bg-slate-950 text-slate-400 font-mono text-[11px]">
                    <th className="p-3">Audit ID</th>
                    <th className="p-3">User Reference</th>
                    <th className="p-3">System Action Trigger</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Payload / Meta Information</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-slate-300">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500">No telemetry log lines filed yet.</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-900/60 hover:bg-slate-900/30">
                        <td className="p-3 text-[10px] text-slate-500">#{log.id}</td>
                        <td className="p-3 text-[#00F3FF]">{log.userId || 'GUEST_VISITOR'}</td>
                        <td className="p-3"><span className="px-1.5 py-0.5 bg-[#FF4D6D]/10 text-[#FF4D6D] rounded text-[10px]">{log.action}</span></td>
                        <td className="p-3 text-slate-500">{log.ipAddress || 'localhost'}</td>
                        <td className="p-3 max-w-xs truncate text-[11px] text-slate-400">
                          {log.metadata ? JSON.stringify(log.metadata) : 'None'}
                        </td>
                        <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'NOTICES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Publisher Form */}
            <form onSubmit={createNotice} className="bg-slate-950/60 p-6 rounded-xl border border-slate-850 space-y-4">
              <h4 className="text-sm font-mono text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-400" /> Publish CMS Announcements
              </h4>
              <div className="space-y-1">
                <label htmlFor="notice-title" className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Notice Headline</label>
                <input
                  id="notice-title"
                  type="text"
                  required
                  placeholder="System Maintenance or Competition updates"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-[#FF4D6D] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#FF4D6D]/30"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="notice-content" className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Content Body Brief</label>
                <textarea
                  id="notice-content"
                  required
                  rows={4}
                  placeholder="Type official details. HTML styling allowed natively."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-[#FF4D6D] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#FF4D6D]/30 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition"
              >
                Broadcast Notice Live
              </button>
            </form>

            {/* Existing Active lists */}
            <div className="space-y-4">
              <h4 className="text-sm font-mono text-slate-400">Currently Streaming Announcements</h4>
              {notices.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">No active notices published yet.</div>
              ) : (
                <div className="space-y-3">
                  {notices.map((notice) => (
                    <div key={notice.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-white">{notice.title}</h5>
                        <p className="text-[11px] text-slate-400 font-sans leading-normal">{notice.content}</p>
                        <span className="text-[9px] text-slate-500 font-mono block">Published: {new Date(notice.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => deleteNotice(notice.id)}
                        className="p-1.5 text-slate-500 hover:text-[#FF4D6D] cursor-pointer transition rounded hover:bg-[#FF4D6D]/10"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {!loading && activeTab === 'CONTESTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Contest Creator */}
            <form onSubmit={handleContestSubmit} className={`bg-slate-950/60 p-6 rounded-xl border space-y-4 ${editingContestId ? 'border-[#FF4D6D] ring-1 ring-[#FF4D6D]/20 animate-pulse-subtle' : 'border-slate-850'}`}>
              <h4 id="contest-creator-title" className="text-sm font-mono text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#FF4D6D]" /> {editingContestId ? 'Modify Interactive Speed Match' : 'Launch Interactive Speed Match'}
              </h4>

              <div className="space-y-3 font-sans">
                <div className="space-y-1">
                  <label htmlFor="contest-title" className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Arena Battle Title</label>
                  <input
                    id="contest-title"
                    type="text"
                    required
                    placeholder="MiraCore Speed Invitational"
                    value={contestTitle}
                    onChange={(e) => setContestTitle(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-[#FF4D6D] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#FF4D6D]/30"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="contest-description" className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Optional description</label>
                  <input
                    id="contest-description"
                    type="text"
                    placeholder="Daffodil University SWE typists face off."
                    value={contestDescription}
                    onChange={(e) => setContestDescription(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-[#FF4D6D] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#FF4D6D]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="contest-duration" className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Duration Limit</label>
                    <select
                      id="contest-duration"
                      value={contestDuration}
                      onChange={(e) => setContestDuration(Number(e.target.value))}
                      className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-[#FF4D6D] outline-none rounded-xl p-3 text-white transition cursor-pointer"
                    >
                      <option value={15}>15 Seconds</option>
                      <option value={30}>30 Seconds</option>
                      <option value={60}>60 Seconds (1 Min)</option>
                      <option value={120}>2 Minutes</option>
                      <option value={180}>3 Minutes</option>
                      <option value={300}>5 Minutes</option>
                      <option value={600}>10 Minutes</option>
                      <option value={900}>15 Minutes</option>
                      <option value={1200}>20 Minutes</option>
                      <option value={1500}>25 Minutes</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="contest-visibility" className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Arena Visibility Type</label>
                    <select
                      id="contest-visibility"
                      value={contestVisibility}
                      onChange={(e) => setContestVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
                      className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-[#FF4D6D] outline-none rounded-xl p-3 text-white transition cursor-pointer font-mono"
                    >
                      <option value="PUBLIC">🌐 Public Arena</option>
                      <option value="PRIVATE">🔒 Private Arena</option>
                    </select>
                  </div>
                </div>

                {contestVisibility === 'PRIVATE' && (
                  <div className="space-y-2 p-3 bg-slate-950/80 border border-slate-850 rounded-xl">
                    <label className="text-[10px] text-[#00F3FF] uppercase tracking-widest block font-mono">Select Invited Users ({selectedInvitedUsers.length} selected)</label>
                    <span className="text-[9px] text-slate-500 block">Select users who are authorized to find and participate in this private match.</span>
                    <div className="max-h-36 overflow-y-auto space-y-1 pre-scroll pr-1">
                      {allRegisteredUsers.length === 0 ? (
                        <div className="text-[10px] text-slate-500 text-center font-mono py-2">No other registered users found.</div>
                      ) : (
                        allRegisteredUsers.map((u) => {
                          const isInvited = selectedInvitedUsers.includes(u.id);
                          return (
                            <div 
                              key={u.id}
                              onClick={() => {
                                if (isInvited) {
                                  setSelectedInvitedUsers(selectedInvitedUsers.filter(id => id !== u.id));
                                } else {
                                  setSelectedInvitedUsers([...selectedInvitedUsers, u.id]);
                                }
                              }}
                              className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition font-mono ${isInvited ? 'bg-[#00FF95]/5 border-[#00FF95]/30 text-[#00FF95]' : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700'}`}
                            >
                              <span>{u.username} ({u.fullName})</span>
                              <input 
                                type="checkbox" 
                                checked={isInvited}
                                readOnly
                                aria-label={`Invite ${u.username} to private contest`}
                                className="accent-[#00FF95] cursor-pointer"
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="contest-start-time" className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Start Date & Time</label>
                    <input
                      id="contest-start-time"
                      type="datetime-local"
                      value={contestStartTime}
                      onChange={(e) => setContestStartTime(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-[#FF4D6D] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#FF4D6D]/30"
                    />
                    <span className="text-[8px] text-slate-500 block leading-tight">Optional. Defaults to immediate launch.</span>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="contest-end-time" className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">End Date & Time</label>
                    <input
                      id="contest-end-time"
                      type="datetime-local"
                      value={contestEndTime}
                      onChange={(e) => setContestEndTime(e.target.value)}
                      className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-[#FF4D6D] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#FF4D6D]/30"
                    />
                    <span className="text-[8px] text-slate-500 block leading-tight">Optional. Defaults to 24hr duration.</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="contest-text" className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Custom Passage Text</label>
                  <textarea
                    id="contest-text"
                    required
                    rows={4}
                    placeholder="Type the exact sequence typists must match. Keep it challenging!"
                    value={contestText}
                    onChange={(e) => setContestText(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-[#FF4D6D] outline-none rounded-xl p-3 text-white transition focus:ring-1 focus:ring-[#FF4D6D]/30 resize-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-mono text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingContestId ? 'Save Custom Modifications' : 'Provision Corporate Match Room'}
                </button>

                {editingContestId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingContestId(null);
                      setContestTitle('');
                      setContestDescription('');
                      setContestText('');
                      setContestStartTime('');
                      setContestEndTime('');
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold rounded-xl cursor-pointer transition"
                  >
                    Cancel Editing Mode
                  </button>
                )}
              </div>
            </form>

            {/* List of Active Contests */}
            <div className="space-y-4">
              <h4 className="text-sm font-mono text-slate-400 font-bold">Live Configured Contest Rooms</h4>
              {contests.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">No user contests spawned yet.</div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {contests.map((cnt) => (
                    <div key={cnt.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white block">{cnt.title}</span>
                          {cnt.visibility === 'PRIVATE' ? (
                            <span className="text-[8px] font-mono leading-none uppercase bg-red-500/10 border border-red-500/20 text-[#FF4D6D] px-1.5 py-0.5 rounded flex items-center gap-0.5">🔒 Private</span>
                          ) : (
                            <span className="text-[8px] font-mono leading-none uppercase bg-blue-500/10 border border-blue-500/20 text-[#00F3FF] px-1.5 py-0.5 rounded flex items-center gap-0.5">🌐 Public</span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono uppercase bg-green-500/10 border border-green-500/20 text-[#00FF95] px-1.5 py-0.5 rounded">Active</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal font-sans italic">"{cnt.contestText.substring(0, 100)}..."</p>
                      
                      <div className="space-y-1 text-[9px] font-mono text-slate-500 border-t border-slate-900/60 pt-2">
                        <div>Start URL: <span className="text-slate-300">{new Date(cnt.startTime).toLocaleDateString()} {new Date(cnt.startTime).toLocaleTimeString()}</span></div>
                        <div>End URL: <span className="text-slate-300">{new Date(cnt.endTime).toLocaleDateString()} {new Date(cnt.endTime).toLocaleTimeString()}</span></div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono bg-slate-950 p-2 rounded">
                        <span>Share Code: <strong className="text-white">{cnt.shareCode}</strong></span>
                        <span>Length: {cnt.duration < 60 ? `${cnt.duration}s` : `${Math.round(cnt.duration / 60)}m`}</span>
                      </div>

                      {/* Edit/Delete Actions Bar */}
                      <div className="flex items-center justify-end gap-2 text-xs border-t border-slate-900 pt-2 font-mono">
                        <button
                          onClick={() => startEditingContest(cnt)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-905 border border-slate-800 text-slate-300 hover:text-[#00F3FF] hover:border-[#00F3FF]/30 transition duration-150 rounded-lg cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => deleteContest(cnt.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-950/20 border border-red-950 text-red-400 hover:text-red-300 hover:border-red-500 transition duration-150 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {!loading && activeTab === 'LOGO' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
              <Upload className="w-5 h-5 text-[#FF4D6D]" />
              <div>
                <h3 className="text-md font-mono uppercase tracking-wider text-white">System Brand & Logo Settings</h3>
                <p className="text-slate-500 text-xs font-sans">
                  Configure corporate icons displayed on user headers and About page listings.
                </p>
              </div>
            </div>

            {/* Current Logo Preview */}
            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-850 space-y-4">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Current System Brand Mark</span>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden group">
                  {currentLogo ? (
                    <img src={currentLogo} alt="System Logo" className="w-full h-full object-contain rounded-2xl p-2" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold font-display text-[#00F3FF]">FT</span>
                      <span className="text-[8px] font-mono text-slate-600 block mt-1">DEFAULT TEXT</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-grow">
                  <h4 className="text-sm font-semibold text-white">
                    {currentLogo ? 'Custom Upload Active' : 'Default Dynamic Canvas Active'}
                  </h4>
                  <p className="text-slate-400 text-xs">
                    Once updated successfully, changes will propagate immediately to all active client workspaces.
                  </p>
                  {currentLogo && (
                    <button
                      onClick={() => updateWebsiteLogo('')}
                      className="px-3 py-1 bg-red-950/40 hover:bg-red-900/40 border border-red-900/40 text-red-400 text-[10px] font-mono rounded cursor-pointer transition"
                    >
                      Reset to Default Branding
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* URL Input Form */}
            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-850 space-y-4 font-sans">
              <h4 className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-2 uppercase tracking-wider">
                <Link className="w-3.5 h-3.5 text-[#00F3FF]" /> Define Logo via Image URL
              </h4>
              <div className="flex gap-2">
                <input
                  id="logo-url-input"
                  type="url"
                  aria-label="Brand logo URL"
                  placeholder="https://example.com/logo.png"
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  className="flex-1 text-xs bg-slate-900 border border-slate-800 focus:border-[#FF4D6D] outline-none rounded-xl p-3 text-white transition"
                />
                <button
                  onClick={() => updateWebsiteLogo(logoUrlInput || '')}
                  className="px-4 py-3 bg-red-700 hover:bg-red-650 text-white font-mono text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Save URL
                </button>
              </div>
            </div>

            {/* Drag & Drop */}
            <div className="space-y-2 font-sans">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Or Drop Brand Asset File</span>
              <div
                onDragEnter={(e) => handleDragEvents(e, setDragActive)}
                onDragOver={(e) => handleDragEvents(e, setDragActive)}
                onDragLeave={(e) => handleDragEvents(e, setDragActive)}
                onDrop={(e) => handleDropEvent(e, setDragActive, updateWebsiteLogo)}
                className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#FF4D6D] bg-[#FF4D6D]/10 animate-pulse'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/85'
                }`}
                onClick={() => document.getElementById('logo-file-input')?.click()}
              >
                <input
                  type="file"
                  id="logo-file-input"
                  className="hidden"
                  aria-label="Upload brand logo file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, updateWebsiteLogo)}
                />
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-slate-900 rounded-full text-slate-400 group-hover:text-[#FF4D6D]">
                    <Upload className="w-6 h-6 text-[#FF4D6D]" />
                  </div>
                  <span className="text-xs text-slate-300 font-medium">Click to upload or drag & drop</span>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Supports JPG, PNG, WebP or SVG up to 2MB as direct Base64 representations.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800/80 my-8 pt-8"></div>

            {/* M-Square Devs Settings Subsection */}
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
              <Upload className="w-5 h-5 text-[#FF007F]" />
              <div>
                <h3 className="text-md font-mono uppercase tracking-wider text-white">M-Square Devs Logo Settings</h3>
                <p className="text-slate-500 text-xs font-sans">
                  Configure the consortium partner logo displayed on the About company card.
                </p>
              </div>
            </div>

            {/* Current M-Square Devs Logo Preview */}
            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-850 space-y-4">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Current M-Square Devs Logo</span>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden group">
                  {currentMSquareLogo ? (
                    <img src={currentMSquareLogo} alt="M-Square Devs Logo" className="w-full h-full object-contain rounded-2xl p-2" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold font-display text-[#FF007F]">M2</span>
                      <span className="text-[8px] font-mono text-slate-600 block mt-1">NO PHOTO</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-grow">
                  <h4 className="text-sm font-semibold text-white">
                    {currentMSquareLogo ? 'Custom M-Square Logo Active' : 'Default Preset Active'}
                  </h4>
                  <p className="text-slate-400 text-xs">
                    This logo will display on the company about cards at the front gate.
                  </p>
                  {currentMSquareLogo && (
                    <button
                      onClick={() => updateMSquareLogo('')}
                      className="px-3 py-1 bg-red-950/40 hover:bg-red-900/40 border border-red-900/40 text-red-400 text-[10px] font-mono rounded cursor-pointer transition"
                    >
                      Reset to Default Placeholder
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* URL Input Form for M-Square Devs */}
            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-850 space-y-4 font-sans">
              <h4 className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-2 uppercase tracking-wider">
                <Link className="w-3.5 h-3.5 text-[#FF007F]" /> Define Logo via Image URL
              </h4>
              <div className="flex gap-2">
                <input
                  id="m-square-logo-url-input"
                  type="url"
                  aria-label="M-Square Devs logo URL"
                  placeholder="https://example.com/msquare-logo.png"
                  value={mSquareLogoUrlInput}
                  onChange={(e) => setMSquareLogoUrlInput(e.target.value)}
                  className="flex-1 text-xs bg-slate-900 border border-slate-800 focus:border-[#FF007F] outline-none rounded-xl p-3 text-white transition"
                />
                <button
                  onClick={() => updateMSquareLogo(mSquareLogoUrlInput || '')}
                  className="px-4 py-3 bg-[#FF007F] hover:bg-[#D0006F] text-white font-mono text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Save URL
                </button>
              </div>
            </div>

            {/* File upload for M-Square Devs */}
            <div className="space-y-2 font-sans">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Or Upload Logo Image file</span>
              <div
                className="border border-dashed rounded-xl p-8 text-center cursor-pointer border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/85 transition-all"
                onClick={() => document.getElementById('m-square-file-input')?.click()}
                onDragEnter={(e) => handleDragEvents(e, setMsDragActive)}
                onDragOver={(e) => handleDragEvents(e, setMsDragActive)}
                onDragLeave={(e) => handleDragEvents(e, setMsDragActive)}
                onDrop={(e) => handleDropEvent(e, setMsDragActive, updateMSquareLogo)}
              >
                <input
                  type="file"
                  id="m-square-file-input"
                  className="hidden"
                  aria-label="Upload M-Square Devs logo file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, updateMSquareLogo)}
                />
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-slate-900 rounded-full text-slate-400">
                    <Upload className="w-6 h-6 text-[#FF007F]" />
                  </div>
                  <span className="text-xs text-slate-300 font-medium">Click to upload or drag & drop</span>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Supports JPG, PNG, WebP or SVG up to 2MB as direct Base64 representations.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800/80 my-8 pt-8"></div>

            {/* Founder Picture settings subsection */}
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
              <Upload className="w-5 h-5 text-[#8B5CF6]" />
              <div>
                <h3 className="text-md font-mono uppercase tracking-wider text-white">Founder Picture Settings</h3>
                <p className="text-slate-500 text-xs font-sans">
                  Configure the portrait image of founder Md Moshiur Rahaman Riat shown on the Corporate About profile.
                </p>
              </div>
            </div>

            {/* Current Founder Picture Preview */}
            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-850 space-y-4">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Current Founder Portrait</span>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden group">
                  {currentFounderPicture ? (
                    <img src={currentFounderPicture} alt="Founder Portrait" className="w-full h-full object-cover rounded-2xl p-1" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold font-display text-[#8B5CF6]">MR</span>
                      <span className="text-[8px] font-mono text-slate-600 block mt-1">NO PHOTO</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-grow">
                  <h4 className="text-sm font-semibold text-white">
                    {currentFounderPicture ? 'Founder Custom Portrait Active' : 'Placeholder Initials Active'}
                  </h4>
                  <p className="text-slate-400 text-xs">
                    This picture will display on the company about cards at the front gate.
                  </p>
                  {currentFounderPicture && (
                    <button
                      onClick={() => updateFounderPicture('')}
                      className="px-3 py-1 bg-red-950/40 hover:bg-red-900/40 border border-[#EF4444]/20 text-[#FF6B6B] text-[10px] font-mono rounded cursor-pointer transition flex items-center gap-1"
                    >
                      Nicely Clear Photo Image
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Round Avatar Resize controller */}
            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-850 space-y-4 font-sans">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Founder Portrait Resize Control</span>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-300 font-mono">
                  <span>Current Display Size: <strong className="text-[#8B5CF6]">{founderPictureSize || 48}px</strong></span>
                  <span className="text-slate-500">(16px - 150px range)</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <input 
                    type="range" 
                    min="16" 
                    max="150" 
                    value={founderPictureSize || 48} 
                    aria-label="Founder picture size"
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value, 10);
                      updateFounderPictureSize(newSize);
                    }}
                    className="flex-1 accent-[#8B5CF6] h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex gap-1.5 shrink-0">
                    <button 
                      onClick={() => updateFounderPictureSize(28)}
                      className={`px-2 py-1 text-[10px] font-mono rounded transition cursor-pointer ${founderPictureSize === 28 ? 'bg-[#8B5CF6] text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}`}
                    >
                      S (28px)
                    </button>
                    <button 
                      onClick={() => updateFounderPictureSize(40)}
                      className={`px-2 py-1 text-[10px] font-mono rounded transition cursor-pointer ${founderPictureSize === 40 ? 'bg-[#8B5CF6] text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}`}
                    >
                      M (40px)
                    </button>
                    <button 
                      onClick={() => updateFounderPictureSize(56)}
                      className={`px-2 py-1 text-[10px] font-mono rounded transition cursor-pointer ${founderPictureSize === 56 ? 'bg-[#8B5CF6] text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}`}
                    >
                      L (56px)
                    </button>
                    <button 
                      onClick={() => updateFounderPictureSize(80)}
                      className={`px-2 py-1 text-[10px] font-mono rounded transition cursor-pointer ${founderPictureSize === 80 ? 'bg-[#8B5CF6] text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}`}
                    >
                      XL (80px)
                    </button>
                  </div>
                </div>
                <p className="text-[10.5px] text-slate-500 font-sans leading-relaxed">
                  Drag the slider or click size quick presets to scale the round display frame instantly. Updates are persisted system-wide.
                </p>
              </div>
            </div>

            {/* URL Input Form for Founder */}
            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-850 space-y-4 font-sans">
              <h4 className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-2 uppercase tracking-wider">
                <Link className="w-3.5 h-3.5 text-[#8B5CF6]" /> Define Portrait via Image URL
              </h4>
              <div className="flex gap-2">
                <input
                  id="founder-picture-url-input"
                  type="url"
                  aria-label="Founder portrait URL"
                  placeholder="https://example.com/moshiur-riat.jpg"
                  value={founderPictureUrlInput}
                  onChange={(e) => setFounderPictureUrlInput(e.target.value)}
                  className="flex-1 text-xs bg-slate-900 border border-slate-800 focus:border-[#8B5CF6] outline-none rounded-xl p-3 text-white transition"
                />
                <button
                  onClick={() => updateFounderPicture(founderPictureUrlInput || '')}
                  className="px-4 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-mono text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Save URL
                </button>
              </div>
            </div>

            {/* File upload for Founder */}
            <div className="space-y-2 font-sans">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Or Upload Portrait Image file</span>
              <div
                className="border border-dashed rounded-xl p-8 text-center cursor-pointer border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/85 transition-all"
                onClick={() => document.getElementById('founder-file-input')?.click()}
                onDragEnter={(e) => handleDragEvents(e, setFDragActive)}
                onDragOver={(e) => handleDragEvents(e, setFDragActive)}
                onDragLeave={(e) => handleDragEvents(e, setFDragActive)}
                onDrop={(e) => handleDropEvent(e, setFDragActive, updateFounderPicture)}
              >
                <input
                  type="file"
                  id="founder-file-input"
                  className="hidden"
                  aria-label="Upload founder portrait file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, updateFounderPicture)}
                />
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-slate-900 rounded-full text-slate-400">
                    <Upload className="w-6 h-6 text-[#8B5CF6]" />
                  </div>
                  <span className="text-xs text-slate-300 font-medium">Click to upload portrait</span>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Supports JPG, PNG, WebP or SVG up to 2MB as direct Base64 representations.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800/80 my-8 pt-8"></div>

            {/* Super Admin Signature Section */}
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
              <PlusCircle className="w-5 h-5 text-[#00FF95]" />
              <div>
                <h3 className="text-md font-mono uppercase tracking-wider text-white font-bold">Registrar Hand-Signed Signature</h3>
                <p className="text-slate-500 text-xs font-sans">
                  Upload an image of your signature or stamp. This will automatically replace the text authority block on all generated certificates.
                </p>
              </div>
            </div>

            {/* Current Signature Image Preview */}
            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-850 space-y-4">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Active Registered Digital Signature</span>
              <div className="flex items-center gap-6">
                <div className="w-48 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center relative overflow-hidden group p-2">
                  {currentAdminSignature ? (
                    <img src={currentAdminSignature} alt="Registrar Signature" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-[10.5px] font-mono font-semibold tracking-wider text-slate-700 italic">Md Moshiur Rahaman Riat</span>
                      <span className="text-[7.5px] font-mono text-slate-400 block mt-0.5">(System Default Placeholder Text)</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-grow">
                  <h4 className="text-sm font-semibold text-white">
                    {currentAdminSignature ? 'Custom Signature File Active' : 'Text Typography Stamp Active'}
                  </h4>
                  <p className="text-slate-400 text-xs">
                    Clean, transparent PNG signatures/stamps format looks best on off-white backgrounds.
                  </p>
                  {currentAdminSignature && (
                    <button
                      onClick={() => updateAdminSignature('')}
                      className="px-3 py-1 bg-red-950/40 hover:bg-red-900/40 border border-red-900/30 text-red-400 text-[10px] font-mono rounded cursor-pointer transition"
                    >
                      Reset to Default Signatory
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* URL Input Form for Signature */}
            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-850 space-y-4 font-sans max-w-2xl">
              <h4 className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-2 uppercase tracking-wider">
                <Link className="w-3.5 h-3.5 text-[#00FF95]" /> Define Signature via Image URL
              </h4>
              <div className="flex gap-2">
                <input
                  id="admin-signature-url-input"
                  type="url"
                  aria-label="Admin signature URL"
                  placeholder="https://example.com/signature-stamp.png"
                  value={adminSignatureUrlInput}
                  onChange={(e) => setAdminSignatureUrlInput(e.target.value)}
                  className="flex-1 text-xs bg-slate-900 border border-slate-800 focus:border-[#00FF95] outline-none rounded-xl p-3 text-white transition"
                />
                <button
                  onClick={() => updateAdminSignature(adminSignatureUrlInput || '')}
                  className="px-4 py-3 bg-[#00FF95] hover:bg-[#00E585] text-slate-950 font-mono text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Save URL
                </button>
              </div>
            </div>

            {/* File upload for Signature */}
            <div className="space-y-4 font-sans max-w-2xl">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">Or Upload Signature Image file</span>
              <div
                className="border border-dashed rounded-xl p-8 text-center cursor-pointer border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/85 transition-all"
                onClick={() => document.getElementById('signature-file-input')?.click()}
                onDragEnter={(e) => handleDragEvents(e, setSigDragActive)}
                onDragOver={(e) => handleDragEvents(e, setSigDragActive)}
                onDragLeave={(e) => handleDragEvents(e, setSigDragActive)}
                onDrop={(e) => handleDropEvent(e, setSigDragActive, updateAdminSignature)}
              >
                <input
                  type="file"
                  id="signature-file-input"
                  className="hidden"
                  aria-label="Upload signature image file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, updateAdminSignature)}
                />
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-slate-900 rounded-full text-slate-400">
                    <Upload className="w-6 h-6 text-[#00FF95]" />
                  </div>
                  <span className="text-xs text-slate-300 font-medium">Click to upload signature stamp</span>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Supports transparent PNG, JPG, or SVG up to 2MB as direct Base64 representations.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}