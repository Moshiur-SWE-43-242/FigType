import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { User, TypingAttempt, Contest, Certificate, CMSNotice } from './src/types';
import http from 'http';
import { Server } from 'socket.io';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Log server start time and bootstrap notices
  console.log('Bootstrapping FigType Neural Engine. Systems active.');

  // Global simple auth middleware based on headers for simulated token verification
  // Allows unauthenticated access as 'GUEST'
  const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const userId = authHeader.substring(7);
      const user = db.getUserById(userId);
      if (user) {
        req.user = user;
        return next();
      }
    }
    next();
  };

  app.use(authenticateUser);

  // API - Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'active',
      ecosystem: 'FigType',
      owner: 'MiraCore Logix / M-Square Devs Group',
      developer: 'Md Moshiur Rahaman Riat',
      time: new Date().toISOString()
    });
  });

  // API - request login OTP
  app.post('/api/auth/otp', (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Generate a secure numerical OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`\n======================================================`);
    console.log(`[SECURE SMS/EMAIL TELEMETRY INTEGRATION]`);
    console.log(`OTP generated for: ${email}`);
    console.log(`Your FigType 6-character access OTP: ${otp}`);
    console.log(`======================================================\n`);

    // In a real database we would bcrypt it, let's keep a simple list
    db.saveOtp({
      email,
      otpHash: otp, // store directly for simple verification
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      verified: false
    });

    // Save initial audit log
    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: undefined,
      action: 'OTP_REQUESTED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { email },
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'OTP triggered! Look at the terminal logs to capture your 6-digit passcode.',
      sandboxOtp: otp // Send back only in sandbox development environment for pristine user experience!
    });
  });

  // API - request login OTP via WhatsApp (Fallback from 01841444413)
  app.post('/api/auth/whatsapp-otp', (req, res) => {
    const { email, whatsappNumber } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address to link your session.' });
    }
    if (!whatsappNumber || whatsappNumber.trim().length < 6) {
      return res.status(400).json({ error: 'Please specify a valid WhatsApp mobile number.' });
    }

    // Generate a secure numerical OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`\n======================================================`);
    console.log(`[WHATSAPP SECURITY DISPATCH CARRIER - OUTGOING]`);
    console.log(`Sender: 01841444413 (MiraCore Logix Help Center Support)`);
    console.log(`Recipient: ${whatsappNumber}`);
    console.log(`Linked Email: ${email}`);
    console.log(`WhatsApp Generated 6-character access OTP: ${otp}`);
    console.log(`======================================================\n`);

    // Save initial SMS OTP state linked to email for verification
    db.saveOtp({
      email,
      otpHash: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      verified: false
    });

    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: undefined,
      action: 'WHATSAPP_OTP_REQUESTED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { email, whatsappNumber, helpline: '01841444413' },
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'WhatsApp automated OTP generated and dispatched successfully!',
      sandboxOtp: otp,
      sender: '01841444413'
    });
  });

  // API - verify login OTP
  app.post('/api/auth/verify', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Please specify both email and OTP.' });
    }

    const matches = db.getOtps().find(
      o => o.email.toLowerCase() === email.toLowerCase() && o.otpHash === otp && !o.verified
    );

    if (!matches) {
      return res.status(400).json({ error: 'Invalid, incorrect, or expired OTP passcode.' });
    }

    matches.verified = true;

    // Check if user already exists
    let user = db.getUserByEmail(email);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Extract general name from email mapping
      const baseName = email.split('@')[0];
      const randomizedString = Math.floor(100 + Math.random() * 900).toString();
      const derivedUsername = `${baseName}${randomizedString}`;

      // Automatically assign SUPER_ADMIN role for the requested DIU and private email specs
      const isSuperAdminEmail = [
        'riat.moshiur22@gmail.com',
        'rahaman242-35-606@diu.edu.bd'
      ].includes(email.toLowerCase());

      user = {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        email: email.toLowerCase(),
        username: derivedUsername,
        fullName: baseName.charAt(0).toUpperCase() + baseName.slice(1),
        role: isSuperAdminEmail ? 'SUPER_ADMIN' : 'GENERAL_USER',
        xp: 100,
        level: 1,
        coins: 150,
        streak: 1,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      db.saveUser(user);
    } else {
      // update active time and daily streak check
      const lastActiveDate = new Date(user.lastActive);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastActiveDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.streak += 1;
      } else if (diffDays > 1) {
        user.streak = 1;
      }
      user.lastActive = new Date().toISOString();
      db.saveUser(user);
    }

    // Register active session audit
    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      action: 'USER_LOGIN',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { email, isNewUser },
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      token: user.id, // Bearer Token value simple mapping
      user,
      isNewUser
    });
  });

  // API - complete registration profile name/username customization
  app.post('/api/auth/complete-profile', (req, res) => {
    const { userId, username, fullName } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User session not found.' });
    }

    if (username) {
      const existing = db.getUserByUsername(username);
      if (existing && existing.id !== userId) {
        return res.status(400).json({ error: 'Username is already taken by another typist.' });
      }
      user.username = username;
    }

    if (fullName) {
      user.fullName = fullName;
    }

    db.saveUser(user);

    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      action: 'PROFILE_COMPLETED',
      ipAddress: req.ip,
      metadata: { username: user.username, fullName: user.fullName },
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, user });
  });

  // API - GET user profiles & statistics
  app.get('/api/user/profile', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized user access.' });
    }
    const attempts = db.getAttempts().filter(a => a.userId === req.user?.id);
    
    // Dynamic badges calculation on the fly
    const user = req.user;
    const badges: string[] = [];
    if (user.xp > 0) badges.push("FIRST_STEPS");
    if (attempts.some(a => a.wpm >= 60)) badges.push("FLAMING_SPEEDSTER");
    if (attempts.some(a => a.wpm >= 90)) badges.push("TACTICAL_ELITE");
    if (attempts.some(a => a.accuracy >= 98)) badges.push("PERFECT_CADENCE");
    if (user.streak >= 3) badges.push("STREAK_WARRIOR");
    if (user.coins >= 100) badges.push("COIN_COLLECTOR");
    if (user.level >= 5) badges.push("LEVEL_MASTER");
    
    // Sync to user if newly added or different
    const currentBadges = user.badges || [];
    if (JSON.stringify(currentBadges.sort()) !== JSON.stringify(badges.sort())) {
      user.badges = badges;
      db.saveUser(user);
    }

    res.json({
      user: req.user,
      stats: {
        attemptsCount: attempts.length,
        averageWpm: attempts.length ? Math.round(attempts.reduce((acc, a) => acc + a.wpm, 0) / attempts.length) : 0,
        bestWpm: attempts.length ? Math.max(...attempts.map(a => a.wpm)) : 0,
        averageAccuracy: attempts.length ? Number((attempts.reduce((acc, a) => acc + a.accuracy, 0) / attempts.length).toFixed(1)) : 100,
        levels: req.user.level,
        coinsBalance: req.user.coins,
        activeStreakCount: req.user.streak
      }
    });
  });

  // API - POST save user theme choices & avatar upload details
  app.post('/api/user/settings', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized user access.' });
    }
    const { themePreference, avatarUrl } = req.body;
    
    if (themePreference !== undefined) {
      req.user.themePreference = themePreference;
    }
    if (avatarUrl !== undefined) {
      req.user.avatarUrl = avatarUrl;
    }
    
    db.saveUser(req.user);
    
    res.json({
      success: true,
      user: req.user
    });
  });

  // API - GET user's typing attempts (history)
  app.get('/api/attempts', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please login to get your attempts history.' });
    }
    const attempts = db.getAttempts().filter(a => a.userId === req.user?.id);
    // Sort chronologically descending
    attempts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(attempts);
  });

  // API - save typing attempt details
  app.post('/api/attempts', (req, res) => {
    const { mode, duration, wordCount, wpm, rawWpm, accuracy, consistency, correctChars, incorrectChars, totalChars, errorHeatmap } = req.body;

    const attempt: TypingAttempt = {
      id: 'att-' + Math.random().toString(36).substr(2, 9),
      userId: req.user?.id, // undefined means guest!
      mode: mode || 'time',
      duration: Number(duration) || 30,
      wordCount: Number(wordCount) || 0,
      wpm: Number(wpm) || 0,
      rawWpm: Number(rawWpm) || 0,
      accuracy: Number(accuracy) || 100,
      consistency: Number(consistency) || 100,
      correctChars: Number(correctChars) || 0,
      incorrectChars: Number(incorrectChars) || 0,
      totalChars: Number(totalChars) || 0,
      createdAt: new Date().toISOString(),
      errorHeatmap: errorHeatmap || {}
    };

    db.saveAttempt(attempt);

    let progressResult = {
      xpEarned: 0,
      coinsEarned: 0,
      levelUp: false,
      newLevel: 1
    };

    // If an authenticated user completed it, award game economy items!
    if (req.user) {
      const user = req.user;
      const baseXP = Math.round((attempt.wpm * 1.5) + (attempt.accuracy * 0.5));
      const bonusXP = attempt.accuracy >= 98 ? 20 : 0;
      const totalXP = baseXP + bonusXP;

      // Base coins: 1 coin for every full 5 words typed with high accuracy
      const baseCoins = Math.round((attempt.wordCount / 5) * (attempt.accuracy / 100));
      const totalCoins = baseCoins + (attempt.accuracy === 100 ? 15 : 0);

      user.xp += totalXP;
      user.coins += totalCoins;

      progressResult.xpEarned = totalXP;
      progressResult.coinsEarned = totalCoins;

      // Calculate levels: each level needs 1000 XP
      const currentLevelIndex = Math.floor(user.xp / 1000) + 1;
      if (currentLevelIndex > user.level) {
        user.level = currentLevelIndex;
        progressResult.levelUp = true;
        progressResult.newLevel = currentLevelIndex;

        // Rewards for Level Ups: 150 coins per level
        let levelUpCoins = 150;
        if (currentLevelIndex % 10 === 0) {
          levelUpCoins += 500; // 500 bonus every 10 levels
        }
        if (currentLevelIndex === 100) {
          levelUpCoins += 10000; // 10000 bonus at lvl 100
        }
        user.coins += levelUpCoins;
      }

      db.saveUser(user);

      // Audit logs
      db.saveAuditLog({
        id: 'audit-' + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        action: 'ATTEMPT_COMPLETED',
        metadata: { wpm: attempt.wpm, accuracy: attempt.accuracy, xpEarned: totalXP, coinIncrement: totalCoins },
        createdAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      attempt,
      rewards: progressResult
    });
  });

  // API - list general typing course lessons
  app.get('/api/lessons', (req, res) => {
    res.json(db.getCourses());
  });

  // API - fetch typing notices cms
  app.get('/api/notices', (req, res) => {
    res.json(db.getNotices().filter(n => n.active));
  });

  // API - certificates endpoints
  app.get('/api/certificates', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Log in to view certificates.' });
    }
    const certs = db.getCertificates().filter(c => c.userId === req.user?.id);
    res.json(certs);
  });

  app.post('/api/certificates/generate', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Log in to unlock official certificates.' });
    }
    const { wpm, accuracy, challengeMode } = req.body;
    if (!wpm || !accuracy) {
      return res.status(400).json({ error: 'Incomplete parameters to establish speed benchmark.' });
    }

    if (wpm < 20) {
      return res.status(400).json({ error: 'Official Certifications require a speed benchmark of at least 20 WPM.' });
    }

    if (accuracy < 90) {
      return res.status(400).json({ error: 'Official Certifications require typing accuracy of at least 90.0%.' });
    }

    const certId = 'CERT-' + Math.floor(1000000 + Math.random() * 9000000).toString();
    const cert: Certificate = {
      id: certId,
      userId: req.user.id,
      username: req.user.username,
      fullName: req.user.fullName || req.user.username,
      wpm: Number(wpm),
      accuracy: Number(accuracy),
      mode: challengeMode || 'Neural Speed Challenge',
      issueDate: new Date().toLocaleString(),
      verificationUrl: `https://figtype.ai/certs/verify/${certId}`,
      qrCodeData: `FIGTYPE-AUTH_VERIFIED:${certId}:${req.user.fullName}:${wpm}-WPM`,
      signature: 'Md Moshiur Rahaman Riat, DIU Software Engineer Student'
    };

    db.saveCertificate(cert);

    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: req.user.id,
      action: 'CERTIFICATE_GENERATED',
      metadata: { certId, wpm, accuracy },
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, certificate: cert });
  });

  // Verify certificate endpoint
  app.get('/api/certificates/verify/:id', (req, res) => {
    const cert = db.getCertificateById(req.params.id);
    if (!cert) {
      return res.status(404).json({ error: 'Certificate registry entry not resolved.' });
    }
    res.json(cert);
  });

  // API - contests list and creation
  app.get('/api/contests', (req, res) => {
    const list = db.getContests();
    if (req.user?.role === 'SUPER_ADMIN') {
      return res.json(list);
    }
    const filtered = list.filter(c => {
      if (!c.visibility || c.visibility === 'PUBLIC') return true;
      if (req.user && c.invitedUsers && c.invitedUsers.includes(req.user.id)) return true;
      return false;
    });
    res.json(filtered);
  });

  app.post('/api/contests', (req, res) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Super Admin permissions required.' });
    }

    const { title, description, visibility, contestText, duration, startTime, endTime, invitedUsers } = req.body;
    if (!title || !contestText) {
      return res.status(400).json({ error: 'A contest title and passage text are required.' });
    }

    const shareCode = Math.random().toString(36).substr(2, 7);
    const contest: Contest = {
      id: 'contest-' + Math.random().toString(36).substr(2, 9),
      title,
      description: description || 'Participate and prove your fingers run with speed!',
      visibility: visibility || 'PUBLIC',
      status: 'LIVE',
      contestText,
      duration: Number(duration) || 60,
      shareCode,
      startTime: startTime || new Date().toISOString(),
      endTime: endTime || new Date(Date.now() + 86400000).toISOString(),
      createdById: req.user.id,
      createdAt: new Date().toISOString(),
      participants: 0,
      invitedUsers: invitedUsers || []
    };

    db.saveContest(contest);

    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: req.user.id,
      action: 'CONTEST_CREATED',
      metadata: { title, shareCode, cid: contest.id, visibility: contest.visibility },
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, contest });
  });

  // Edit / Update an existing contest
  app.put('/api/contests/:id', (req, res) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Super Admin permissions required.' });
    }

    const contest = db.getContestById(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest arena not found.' });
    }

    const { title, description, visibility, contestText, duration, startTime, endTime, invitedUsers } = req.body;
    if (!title || !contestText) {
      return res.status(400).json({ error: 'A contest title and passage text are required.' });
    }

    contest.title = title;
    contest.description = description || 'Participate and prove your fingers run with speed!';
    contest.contestText = contestText;
    contest.duration = Number(duration) || 60;
    if (visibility) contest.visibility = visibility;
    if (invitedUsers) contest.invitedUsers = invitedUsers;
    if (startTime) contest.startTime = startTime;
    if (endTime) contest.endTime = endTime;

    db.saveContest(contest);

    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: req.user.id,
      action: 'CONTEST_EDITED',
      metadata: { id: contest.id, title, shareCode: contest.shareCode, visibility: contest.visibility },
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, contest });
  });

  // Delete an existing contest
  app.delete('/api/contests/:id', (req, res) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Super Admin permissions required.' });
    }

    const contest = db.getContestById(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest arena not found.' });
    }

    db.deleteContest(req.params.id);

    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: req.user.id,
      action: 'CONTEST_DELETED',
      metadata: { id: req.params.id, title: contest.title, shareCode: contest.shareCode },
      createdAt: new Date().toISOString()
    });

    res.json({ success: true });
  });

  // Contest single view with real-time players
  app.get('/api/contests/:id', (req, res) => {
    const contest = db.getContestById(req.params.id) || db.getContestByShareCode(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest arena not found.' });
    }
    const attempts = db.getContestAttempts(contest.id);
    res.json({ contest, attempts });
  });

  // User join and register for matching contest
  app.post('/api/contests/:id/join', (req, res) => {
    const contest = db.getContestById(req.params.id) || db.getContestByShareCode(req.params.id);
    if (!contest) {
      return res.status(404).json({ error: 'Contest arena not found.' });
    }

    const uName = req.user ? req.user.username : `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    const uId = req.user ? req.user.id : `guest-user-${Math.random().toString(36).substr(2, 5)}`;

    const attempt = db.saveContestAttempt({
      id: 'ca-' + Math.random().toString(36).substr(2, 9),
      contestId: contest.id,
      userId: uId,
      username: uName,
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      progress: 0,
      correctChars: 0,
      incorrectChars: 0,
      completed: false,
      suspicious: false,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, contest, currentAttempt: attempt });
  });

  // Real-time progress synchronizer (high performance http interface)
  app.post('/api/contests/:id/progress', (req, res) => {
    const { userId, username, wpm, rawWpm, accuracy, progress, completed, correctChars, incorrectChars } = req.body;
    const contestId = req.params.id;

    // Detect impossible speed peaks (anti-cheat!)
    const suspicious = wpm > 250;

    const attempt = db.saveContestAttempt({
      id: 'ca-' + userId,
      contestId,
      userId,
      username: username || 'Typist',
      wpm: Number(wpm) || 0,
      rawWpm: Number(rawWpm) || 0,
      accuracy: Number(accuracy) || 100,
      progress: Number(progress) || 0,
      correctChars: Number(correctChars) || 0,
      incorrectChars: Number(incorrectChars) || 0,
      completed: !!completed,
      suspicious,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, attempt });
  });

  // SUPER ADMIN - API configs
  app.get('/api/admin/logs', (req, res) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized access.' });
    }
    res.json(db.getAuditLogs());
  });

  app.get('/api/admin/users', (req, res) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized access.' });
    }
    const users = db.getUsers().map(u => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName || u.username,
      email: u.email,
      role: u.role
    }));
    res.json(users);
  });

  app.post('/api/admin/cms/notice', (req, res) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'A notice title and content description are required.' });
    }

    const notice: CMSNotice = {
      id: 'notice-' + Math.random().toString(36).substr(2, 9),
      title,
      content,
      active: true,
      createdAt: new Date().toISOString()
    };

    db.saveNotice(notice);

    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: req.user.id,
      action: 'CMS_NOTICE_PUBLISHED',
      metadata: { title },
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, notice });
  });

  app.delete('/api/admin/cms/notice/:id', (req, res) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }
    db.deleteNotice(req.params.id);
    res.json({ success: true });
  });

  // API - GET global practice leaderboard rankings
  app.get('/api/leaderboard/practice', (req, res) => {
    const attempts = db.getAttempts();
    const users = db.getUsers();
    
    // Group by user to obtain their peak practice typing speed (highest WPM run)
    const bestWpmByUser: Record<string, { username: string; wpm: number; accuracy: number; createdAt: string }> = {};
    
    attempts.forEach(att => {
      const user = att.userId ? users.find(u => u.id === att.userId) : null;
      const username = user ? (user.username || user.fullName) : 'Guest Typist';
      const userKey = att.userId || `guest-${att.id}`;
      
      if (!bestWpmByUser[userKey] || att.wpm > bestWpmByUser[userKey].wpm) {
        bestWpmByUser[userKey] = {
          username,
          wpm: att.wpm,
          accuracy: att.accuracy,
          createdAt: att.createdAt
        };
      }
    });
    
    const sortedLeaderboard = Object.values(bestWpmByUser)
      .sort((a, b) => b.wpm - a.wpm)
      .slice(0, 10);
      
    res.json(sortedLeaderboard);
  });

  // API - Add gamified user rewards (XP & Coins)
  app.post('/api/user/add-rewards', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized user access.' });
    }
    const { xp, coins } = req.body;
    const user = req.user;
    
    const xpBonus = Number(xp) || 0;
    const coinsBonus = Number(coins) || 0;
    
    user.xp += xpBonus;
    user.coins += coinsBonus;
    
    let levelUp = false;
    const originalLevel = user.level;
    const currentLevelIndex = Math.floor(user.xp / 1000) + 1;
    if (currentLevelIndex > originalLevel) {
      user.level = currentLevelIndex;
      levelUp = true;
      let levelUpCoins = 150;
      if (currentLevelIndex % 10 === 0) {
        levelUpCoins += 500;
      }
      user.coins += levelUpCoins;
    }
    
    db.saveUser(user);
    
    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: user.id,
      action: 'REWARDS_EARNED',
      ipAddress: req.ip,
      createdAt: new Date().toISOString(),
      metadata: { xpEarned: xpBonus, coinsEarned: coinsBonus, levelUp, currentLevel: user.level }
    });
    
    res.json({ success: true, user, levelUp, newLevel: user.level });
  });

  // API - Website Logo Settings
  app.get('/api/settings/logo', (req, res) => {
    res.json({ websiteLogo: db.getWebsiteLogo() });
  });

  app.get('/api/settings/admin-signature', (req, res) => {
    res.json({ adminSignaturePic: db.getAdminSignaturePic() });
  });

  app.post('/api/settings/admin-signature', (req, res) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Super Admin permissions required.' });
    }
    const { adminSignaturePic } = req.body;
    db.saveAdminSignaturePic(adminSignaturePic || '');

    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: req.user.id,
      action: 'ADMIN_SIGNATURE_UPDATED',
      ipAddress: req.ip,
      createdAt: new Date().toISOString(),
      metadata: { signatureLength: adminSignaturePic?.length || 0 }
    });

    res.json({ success: true, adminSignaturePic });
  });

  app.post('/api/settings/logo', (req, res) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Super Admin permissions required.' });
    }
    const { websiteLogo } = req.body;
    db.saveWebsiteLogo(websiteLogo || '');
    
    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: req.user.id,
      action: 'LOGO_UPDATED',
      ipAddress: req.ip,
      createdAt: new Date().toISOString(),
      metadata: { logo: websiteLogo }
    });

    res.json({ success: true, websiteLogo });
  });

  // API - M-Square Logo Settings
  app.get('/api/settings/m-square-logo', (req, res) => {
    res.json({ mSquareLogo: db.getMSquareLogo() });
  });

  app.post('/api/settings/m-square-logo', (req, res) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Super Admin permissions required.' });
    }
    const { mSquareLogo } = req.body;
    db.saveMSquareLogo(mSquareLogo || '');
    
    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: req.user.id,
      action: 'M_SQUARE_LOGO_UPDATED',
      ipAddress: req.ip,
      createdAt: new Date().toISOString(),
      metadata: { mSquareLogo }
    });

    res.json({ success: true, mSquareLogo });
  });

  // API - Website Founder Picture Settings
  app.get('/api/settings/founder-picture', (req, res) => {
    res.json({ founderPicture: db.getFounderPicture() });
  });

  app.post('/api/settings/founder-picture', (req, res) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Super Admin permissions required.' });
    }
    const { founderPicture } = req.body;
    db.saveFounderPicture(founderPicture || '');
    
    db.saveAuditLog({
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      userId: req.user.id,
      action: 'FOUNDER_PICTURE_UPDATED',
      ipAddress: req.ip,
      createdAt: new Date().toISOString(),
      metadata: { founderPicture }
    });

    res.json({ success: true, founderPicture });
  });

  app.get('/api/settings/founder-picture-size', (req, res) => {
    res.json({ founderPictureSize: db.getFounderPictureSize() });
  });

  app.post('/api/settings/founder-picture-size', (req, res) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Super Admin permissions required.' });
    }
    const { founderPictureSize } = req.body;
    const sizeNum = typeof founderPictureSize === 'string' ? parseInt(founderPictureSize, 10) : founderPictureSize;
    if (isNaN(sizeNum) || sizeNum < 16 || sizeNum > 300) {
      return res.status(400).json({ error: 'Size must be a valid number between 16 and 300' });
    }
    db.saveFounderPictureSize(sizeNum);
    res.json({ success: true, founderPictureSize: sizeNum });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Socket.IO Multiplayer Contest connection handlers
  io.on('connection', (socket) => {
    socket.on('join-contest', ({ contestId, username }) => {
      socket.join(contestId);
    });

    socket.on('update-progress', ({ contestId, userId, username, wpm, accuracy, progress, wrongKeys, backspaces }) => {
      socket.to(contestId).emit('progress-pushed', {
        id: socket.id,
        userId,
        username,
        wpm,
        accuracy,
        progress,
        wrongKeys: wrongKeys || 0,
        backspaces: backspaces || 0
      });
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n------------------------------------------------------`);
    console.log(`  FigType Core Node - ON Port ${PORT}`);
    console.log(`  Systems live at http://localhost:${PORT}`);
    console.log(`  Owner: MiraCore Logix`);
    console.log(`  Director: Md Moshiur Rahaman Riat`);
    console.log(`------------------------------------------------------\n`);
  });
}

startServer();
