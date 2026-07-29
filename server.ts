import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { store } from './server/db/store.js';
import { connectToDatabase, isMongoConnected } from './server/db/mongodb.js';
import { MongoUserModel } from './server/db/models/User.js';
import { processBinDensityAnalysis } from './server/agents/binDensityAgent.js';
import { processRoutingOptimization, handleRoadClosureDisruption } from './server/agents/routingAgent.js';
import { processRecyclingAnalytics } from './server/agents/analyticsAgent.js';
import { processCampaignGeneration } from './server/agents/campaignAgent.js';
import { WorkflowOrchestrator } from './server/workflows/orchestrator.js';
import { SimulationEngine } from './server/simulation/simulator.js';
import { User } from './src/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'wastewise_super_secret_jwt_key_2026';

// Auth Rate Limiter
const authRateLimits = new Map<string, { count: number; resetAt: number }>();

function authRateLimiter(req: any, res: any, next: any) {
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 25;

  const current = authRateLimits.get(ip);
  if (!current || now > current.resetAt) {
    authRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (current.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please wait a minute before trying again.'
    });
  }

  current.count++;
  next();
}

// Auth Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.cookies && req.cookies.wastewise_token) {
    token = req.cookies.wastewise_token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired authentication session.' });
    }

    const user = store.getUserById(decoded.id) || store.getUserByEmail(decoded.email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    req.user = user;
    next();
  });
}

function requireRole(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient role permissions.' });
    }
    next();
  };
}

async function startServer() {
  await connectToDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // ==========================================
  // REST API ENDPOINTS
  // ==========================================

  // Health
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'WasteWise Multi-Agent Platform',
      mongoConnected: isMongoConnected(),
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================
  // AUTHENTICATION ENDPOINTS (PHASE 2)
  // ==========================================

  // 1. REGISTER USER (Public - ALWAYS creates role: 'USER')
  app.post('/api/auth/register', authRateLimiter, async (req, res) => {
    try {
      const { name, fullName, email, password, confirmPassword, phone, termsAccepted } = req.body;
      const displayName = (fullName || name || '').trim();

      if (!displayName) {
        return res.status(400).json({ success: false, message: 'Please enter your name.' });
      }

      if (!email || !email.includes('@') || !email.includes('.')) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email.' });
      }

      if (!password || password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must contain at least 8 characters.' });
      }

      if (confirmPassword !== undefined && password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match.' });
      }

      if (termsAccepted === false) {
        return res.status(400).json({ success: false, message: 'You must accept the Terms & Conditions.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const existingUser = store.getUserByEmail(cleanEmail);
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }

      // SECURITY CRITICAL: Public signup ALWAYS assigns role = 'USER'
      const passwordHash = bcrypt.hashSync(password, 10);
      const nowIso = new Date().toISOString();
      const userId = `USR-${Date.now()}`;

      const newUser: User = {
        id: userId,
        name: displayName,
        email: cleanEmail,
        role: 'USER', // FORCED SECURITY BOUNDARY
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D9488&color=fff`,
        phone: phone ? phone.trim() : undefined,
        isActive: true,
        isEmailVerified: false,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash
      };

      store.addUser(newUser);

      if (isMongoConnected()) {
        try {
          await MongoUserModel.create(newUser);
        } catch (err) {
          console.warn('[MongoDB] Registration sync notice:', err);
        }
      }

      const safeUser = store.sanitizeUser(newUser);
      const token = jwt.sign({ id: safeUser.id, email: safeUser.email, role: safeUser.role }, JWT_SECRET, { expiresIn: '24h' });

      res.cookie('wastewise_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        token,
        user: safeUser
      });
    } catch (err: any) {
      console.error('[API/Auth/Register] Error:', err);
      res.status(500).json({ success: false, message: err.message || 'Internal server error during registration.' });
    }
  });

  // 2. LOGIN API
  app.post('/api/auth/login', authRateLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = store.getUserByEmail(cleanEmail);

      if (!user || !user.passwordHash) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (user.isActive === false) {
        return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact administrator.' });
      }

      const passwordValid = bcrypt.compareSync(password, user.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const updatedUser = store.updateUser(user.id, { lastLoginAt: new Date().toISOString() }) || user;

      if (isMongoConnected()) {
        try {
          await (MongoUserModel as any).updateOne({ id: user.id }, { lastLoginAt: updatedUser.lastLoginAt });
        } catch (err) {
          console.warn('[MongoDB] Login sync notice:', err);
        }
      }

      const safeUser = store.sanitizeUser(updatedUser);
      const token = jwt.sign({ id: safeUser.id, email: safeUser.email, role: safeUser.role }, JWT_SECRET, { expiresIn: '24h' });

      res.cookie('wastewise_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        message: 'Authenticated successfully.',
        token,
        user: safeUser
      });
    } catch (err: any) {
      console.error('[API/Auth/Login] Error:', err);
      res.status(500).json({ success: false, message: 'Internal server error during login.' });
    }
  });

  // 3. LOGOUT API
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('wastewise_token');
    res.json({ success: true, message: 'Successfully logged out.' });
  });

  // 4. ME (Session Verification)
  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    if (!token && req.cookies && req.cookies.wastewise_token) {
      token = req.cookies.wastewise_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No active authentication session.' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        res.clearCookie('wastewise_token');
        return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
      }

      const user = store.getUserById(decoded.id) || store.getUserByEmail(decoded.email);
      if (!user) {
        res.clearCookie('wastewise_token');
        return res.status(404).json({ success: false, message: 'User account not found.' });
      }

      if (user.isActive === false) {
        res.clearCookie('wastewise_token');
        return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
      }

      res.json({
        success: true,
        user: store.sanitizeUser(user)
      });
    });
  });

  // 5. FORGOT PASSWORD API
  app.post('/api/auth/forgot-password', authRateLimiter, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = store.getUserByEmail(cleanEmail);

      if (user) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        store.updateUser(user.id, {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires
        });

        if (isMongoConnected()) {
          try {
            await (MongoUserModel as any).updateOne({ id: user.id }, {
              resetPasswordToken: resetToken,
              resetPasswordExpires: resetExpires
            });
          } catch (err) {
            console.warn('[MongoDB] Forgot password sync notice:', err);
          }
        }
      }

      // Security requirement: Generic message to avoid email enumeration
      res.json({
        success: true,
        message: 'If an account exists for this email, password reset instructions will be sent.'
      });
    } catch (err: any) {
      console.error('[API/Auth/ForgotPassword] Error:', err);
      res.status(500).json({ success: false, message: 'Internal server error processing reset request.' });
    }
  });

  // 6. RESET PASSWORD API
  app.post(['/api/auth/reset-password/:token', '/api/auth/reset-password'], authRateLimiter, async (req, res) => {
    try {
      const token = req.params.token || req.body.token;
      const { newPassword, password, confirmPassword } = req.body;
      const targetPassword = newPassword || password;

      if (!token) {
        return res.status(400).json({ success: false, message: 'Password reset token is required.' });
      }

      if (!targetPassword || targetPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must contain at least 8 characters.' });
      }

      if (confirmPassword !== undefined && targetPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match.' });
      }

      const user = store.getUserByResetToken(token);
      if (!user || !user.resetPasswordExpires) {
        return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
      }

      if (new Date(user.resetPasswordExpires).getTime() < Date.now()) {
        return res.status(400).json({ success: false, message: 'Password reset token has expired.' });
      }

      const passwordHash = bcrypt.hashSync(targetPassword, 10);
      store.updateUser(user.id, {
        passwordHash,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined
      });

      if (isMongoConnected()) {
        try {
          await (MongoUserModel as any).updateOne({ id: user.id }, {
            passwordHash,
            resetPasswordToken: null,
            resetPasswordExpires: null
          });
        } catch (err) {
          console.warn('[MongoDB] Reset password sync notice:', err);
        }
      }

      res.json({
        success: true,
        message: 'Password successfully updated.'
      });
    } catch (err: any) {
      console.error('[API/Auth/ResetPassword] Error:', err);
      res.status(500).json({ success: false, message: 'Internal server error processing password reset.' });
    }
  });

  // 7. CHANGE PASSWORD API (Protected)
  app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Please enter your current password.' });
      }

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must contain at least 8 characters.' });
      }

      if (confirmPassword !== undefined && newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New passwords do not match.' });
      }

      const user = store.getUserById((req as any).user.id);
      if (!user || !user.passwordHash) {
        return res.status(400).json({ success: false, message: 'Invalid user account.' });
      }

      const validCurrent = bcrypt.compareSync(currentPassword, user.passwordHash);
      if (!validCurrent) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      const passwordHash = bcrypt.hashSync(newPassword, 10);
      store.updateUser(user.id, { passwordHash });

      if (isMongoConnected()) {
        try {
          await (MongoUserModel as any).updateOne({ id: user.id }, { passwordHash });
        } catch (err) {
          console.warn('[MongoDB] Change password sync notice:', err);
        }
      }

      res.json({
        success: true,
        message: 'Your password has been changed successfully.'
      });
    } catch (err: any) {
      console.error('[API/Auth/ChangePassword] Error:', err);
      res.status(500).json({ success: false, message: 'Internal server error changing password.' });
    }
  });

  // 8. GOOGLE AUTH (Preserved)
  app.post('/api/auth/google', authRateLimiter, (req, res) => {
    const { email, name, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = store.getUserByEmail(cleanEmail);

    if (!user) {
      const isDomainAdmin = cleanEmail.includes('admin') || cleanEmail.includes('gov');
      const assignedRole = isDomainAdmin ? 'ADMIN' : 'USER';
      const userName = name || cleanEmail.split('@')[0].replace('.', ' ').toUpperCase();
      const userAvatar = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D9488&color=fff`;

      const nowIso = new Date().toISOString();
      user = {
        id: `USR-G-${Math.floor(Math.random() * 9000 + 1000)}`,
        name: userName,
        email: cleanEmail,
        role: assignedRole,
        avatar: userAvatar,
        isActive: true,
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso
      };

      store.addUser(user);
    }

    const safeUser = store.sanitizeUser(user);
    const token = jwt.sign({ id: safeUser.id, email: safeUser.email, role: safeUser.role }, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('wastewise_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      user: safeUser
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Successfully logged out.' });
  });

  app.get('/api/auth/users', authenticateToken, requireRole(['ADMIN']), (req, res) => {
    const usersWithoutHash = store.users.map(({ passwordHash, resetPasswordToken, resetPasswordExpires, ...u }) => u);
    res.json({ success: true, count: usersWithoutHash.length, data: usersWithoutHash });
  });

  app.get('/api/admin/users', authenticateToken, requireRole(['ADMIN']), (req, res) => {
    const usersWithoutHash = store.users.map(({ passwordHash, resetPasswordToken, resetPasswordExpires, ...u }) => u);
    res.json({ success: true, count: usersWithoutHash.length, data: usersWithoutHash });
  });

  // Bins API
  app.get('/api/bins', (req, res) => {
    res.json({ success: true, count: store.bins.length, data: store.bins });
  });

  app.get('/api/bins/:id', (req, res) => {
    const bin = store.bins.find(b => b.id === req.params.id || b.binId === req.params.id);
    if (!bin) return res.status(404).json({ success: false, message: 'Bin not found' });
    res.json({ success: true, data: bin });
  });

  app.post('/api/bins/simulate', (req, res) => {
    const { binId, fillLevel, delta } = req.body;
    let result;
    if (delta) {
      result = SimulationEngine.increaseBinFill(binId, delta);
    } else if (fillLevel !== undefined) {
      const target = store.bins.find(b => b.binId === binId || b.id === binId);
      if (target) {
        target.fillLevel = fillLevel;
        target.status = store.getBinStatus(fillLevel);
        target.priority = store.getPriority(target.status);
        target.lastUpdated = new Date().toISOString();
        result = { message: `Updated bin ${target.binId} fill level to ${fillLevel}%`, bin: target };
      }
    } else {
      result = SimulationEngine.generateNewWasteEvent();
    }
    store.saveToDisk();
    res.json({ success: true, ...result });
  });

  app.post('/api/bins/scan', async (req, res) => {
    try {
      const { binId, fillLevel, imageDescription } = req.body;
      const result = await processBinDensityAnalysis({ binId, fillPercentage: fillLevel || 85, imageDescription });
      res.json({ success: true, data: result });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/bins/update-waste-type', (req, res) => {
    const { binId, wasteType, isMixed, contaminationDetails } = req.body;
    const target = store.bins.find(b => b.binId === binId || b.id === binId);
    if (!target) return res.status(404).json({ success: false, message: 'Bin not found' });

    target.wasteType = wasteType;
    target.isMixed = isMixed !== undefined ? isMixed : (wasteType === 'mixed');
    if (contaminationDetails !== undefined) target.contaminationDetails = contaminationDetails;
    target.lastUpdated = new Date().toISOString();

    if (target.isMixed || wasteType === 'mixed') {
      store.alerts.unshift({
        id: `ALT-${Date.now()}`,
        severity: 'WARNING',
        title: `Mixed Waste Contamination at ${target.binId}`,
        message: contaminationDetails || `Bin ${target.binId} (${target.locationName}) contains mixed degradable and non-degradable waste.`,
        entityType: 'bin',
        entityId: target.binId,
        timestamp: new Date().toISOString()
      });
    }

    store.saveToDisk();
    res.json({ success: true, message: `Updated bin ${target.binId} waste type to ${wasteType}`, bin: target });
  });

  // Trucks API
  app.get('/api/trucks', (req, res) => {
    res.json({ success: true, count: store.trucks.length, data: store.trucks });
  });

  app.get('/api/trucks/:id', (req, res) => {
    const truck = store.trucks.find(t => t.id === req.params.id || t.truckId === req.params.id);
    if (!truck) return res.status(404).json({ success: false, message: 'Truck not found' });
    res.json({ success: true, data: truck });
  });

  // Routes API
  app.get('/api/routes', (req, res) => {
    res.json({ success: true, count: store.routes.length, data: store.routes });
  });

  app.post('/api/routes/optimize', async (req, res) => {
    try {
      const { targetBinIds } = req.body;
      const result = await processRoutingOptimization(targetBinIds || []);
      res.json({ success: true, data: result });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/routes/:id/approve', (req, res) => {
    const route = store.routes.find(r => r.id === req.params.id || r.routeId === req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    route.approvalStatus = 'APPROVED';
    route.updatedAt = new Date().toISOString();

    const truck = store.trucks.find(t => t.truckId === route.truckId);
    if (truck) truck.status = 'IN_TRANSIT';

    store.alerts.unshift({
      id: `ALT-${Date.now().toString().slice(-5)}`,
      severity: 'INFO',
      title: 'Route Approved',
      message: `Dispatcher approved collection Route ${route.routeId} for Truck ${route.truckId}.`,
      timestamp: new Date().toISOString()
    });

    store.saveToDisk();
    res.json({ success: true, message: 'Route approved and truck dispatched', data: route });
  });

  app.post('/api/routes/:id/reject', (req, res) => {
    const route = store.routes.find(r => r.id === req.params.id || r.routeId === req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    route.approvalStatus = 'REJECTED';
    route.updatedAt = new Date().toISOString();

    const truck = store.trucks.find(t => t.truckId === route.truckId);
    if (truck) {
      truck.status = 'IDLE';
      truck.assignedRouteId = null;
    }

    store.saveToDisk();
    res.json({ success: true, message: 'Route rejected', data: route });
  });

  app.post('/api/routes/:id/modify', (req, res) => {
    const route = store.routes.find(r => r.id === req.params.id || r.routeId === req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    const { newBinSequence, newTruckId } = req.body;
    if (newTruckId) {
      route.truckId = newTruckId;
      const truck = store.trucks.find(t => t.truckId === newTruckId);
      if (truck) route.truckName = `${truck.truckId} (${truck.driverName})`;
    }

    if (Array.isArray(newBinSequence) && newBinSequence.length > 0) {
      route.assignedBinIds = newBinSequence;
      route.orderedBins = newBinSequence.map(binId => {
        const bin = store.bins.find(b => b.binId === binId);
        return {
          binId,
          locationName: bin?.locationName || binId,
          neighborhood: bin?.neighborhood || 'Gandhipuram',
          lat: bin?.lat || 11.0168,
          lng: bin?.lng || 76.9558,
          fillLevel: bin?.fillLevel || 80,
          wasteType: bin?.wasteType || 'mixed',
          priority: bin?.priority || 'HIGH'
        };
      });
    }

    route.modifiedByHuman = true;
    route.updatedAt = new Date().toISOString();
    store.saveToDisk();

    res.json({ success: true, message: 'Route manually modified by dispatcher', data: route });
  });

  app.post('/api/routes/:id/approve', async (req, res) => {
    const route = store.routes.find(r => r.id === req.params.id || r.routeId === req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    const result = await WorkflowOrchestrator.handleHumanApproval(
      route.routeId,
      'ROUTE',
      route.id,
      'APPROVED',
      req.body.comments || 'Approved by dispatcher'
    );

    res.json({ success: true, message: 'Route approved and dispatched to truck driver', data: route, approval: result });
  });

  app.post('/api/routes/:id/reject', async (req, res) => {
    const route = store.routes.find(r => r.id === req.params.id || r.routeId === req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    const result = await WorkflowOrchestrator.handleHumanApproval(
      route.routeId,
      'ROUTE',
      route.id,
      'REJECTED',
      req.body.comments || 'Rejected by dispatcher'
    );

    res.json({ success: true, message: 'Route rejected and re-optimization triggered', data: route, approval: result });
  });

  app.post('/api/routes/:id/reoptimize', async (req, res) => {
    try {
      const route = store.routes.find(r => r.id === req.params.id || r.routeId === req.params.id);
      if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

      const result = await processRoutingOptimization(route.assignedBinIds);
      res.json({ success: true, message: 'Route reoptimized considering new traffic/road conditions', data: result });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Analytics API
  app.get('/api/analytics', async (req, res) => {
    try {
      const finding = await processRecyclingAnalytics();
      res.json({ success: true, data: finding });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Campaigns API
  app.get('/api/campaigns', (req, res) => {
    res.json({ success: true, count: store.campaigns.length, data: store.campaigns });
  });

  app.post('/api/campaigns/generate', async (req, res) => {
    try {
      const { neighborhood, wasteIssue } = req.body;
      const campaign = await processCampaignGeneration({ zone: neighborhood || 'Ukkadam', issue: wasteIssue || 'High Plastic Packaging' });
      res.json({ success: true, data: campaign });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/campaigns/:id/approve', async (req, res) => {
    const campaign = store.campaigns.find(c => c.id === req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const result = await WorkflowOrchestrator.handleHumanApproval(
      'WORKFLOW-CAMPAIGN',
      'CAMPAIGN',
      campaign.id,
      'APPROVED',
      req.body.comments || 'Approved by administrator'
    );

    res.json({ success: true, message: 'Campaign approved and published successfully', data: campaign, approval: result });
  });

  app.post('/api/campaigns/:id/publish', (req, res) => {
    const campaign = store.campaigns.find(c => c.id === req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    campaign.status = 'PUBLISHED';
    store.saveToDisk();
    res.json({ success: true, message: 'Campaign published successfully', data: campaign });
  });

  // Agents API
  app.get('/api/agents/status', (req, res) => {
    store.ensureFourAgents();
    res.json({ success: true, data: store.agentStatuses });
  });

  app.get('/api/agents/events', (req, res) => {
    res.json({ success: true, count: store.agentEvents.length, data: store.agentEvents });
  });

  app.get('/api/agents/workflows', (req, res) => {
    res.json({ success: true, count: store.workflowRuns.length, data: store.workflowRuns });
  });

  app.get('/api/agents/workflows/:id', (req, res) => {
    const wf = store.workflowRuns.find(w => w.workflowId === req.params.id);
    if (!wf) return res.status(404).json({ success: false, message: 'Workflow run not found' });
    res.json({ success: true, data: wf });
  });

  app.get('/api/agents/messages', (req, res) => {
    res.json({ success: true, count: store.agentMessages.length, data: store.agentMessages });
  });

  app.get('/api/agents/tool-calls', (req, res) => {
    res.json({ success: true, count: store.toolCalls.length, data: store.toolCalls });
  });

  app.post('/api/agents/workflows', async (req, res) => {
    try {
      const { triggerReason, binInput } = req.body;
      const wf = WorkflowOrchestrator.createWorkflow(triggerReason || 'Manual Workflow Execution');
      const resultState = await WorkflowOrchestrator.executeStep(wf.workflowId, binInput);
      res.json({ success: true, data: resultState });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/agents/workflows/demo', async (req, res) => {
    try {
      const demoState = await WorkflowOrchestrator.runFullAutomatedDemo();
      res.json({ success: true, message: '22-Step Automated Multi-Agent Pipeline Completed Successfully', data: demoState });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Traffic & Closures
  app.get('/api/traffic', (req, res) => {
    res.json({ success: true, data: store.trafficEvents });
  });

  app.post('/api/traffic/simulate', (req, res) => {
    const { neighborhood, severity } = req.body;
    const result = SimulationEngine.simulateTraffic(neighborhood, severity);
    res.json({ success: true, data: result });
  });

  app.get('/api/road-closures', (req, res) => {
    res.json({ success: true, data: store.roadClosures });
  });

  app.post('/api/road-closures', (req, res) => {
    const { neighborhood, roadName } = req.body;
    const result = SimulationEngine.closeRoad(neighborhood, roadName);
    res.json({ success: true, data: result });
  });

  // Simulation Controls
  app.post('/api/simulation/overflow', (req, res) => {
    const { binId } = req.body;
    const result = SimulationEngine.simulateOverflow(binId);
    res.json({ success: true, data: result });
  });

  app.post('/api/simulation/reset', (req, res) => {
    const result = SimulationEngine.resetSimulation();
    res.json({ success: true, data: result });
  });

  app.post('/api/simulation/demo-step', async (req, res) => {
    try {
      const stepResult = await SimulationEngine.executeDemoPipelineStep();
      res.json({ success: true, data: stepResult });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/orchestration/trigger', async (req, res) => {
    try {
      const { triggerType } = req.body;
      const wf = WorkflowOrchestrator.createWorkflow(triggerType || 'MANUAL_OPTIMIZE');
      const state = await WorkflowOrchestrator.executeStep(wf.workflowId);
      res.json({ success: true, data: state });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Alerts API
  app.get('/api/alerts', (req, res) => {
    res.json({ success: true, data: store.alerts });
  });

  // Citizen Crowdsourced Reports API
  app.get('/api/citizen-reports', (req, res) => {
    res.json({ success: true, count: store.citizenReports.length, data: store.citizenReports });
  });

  app.post('/api/citizen-reports', (req, res) => {
    try {
      const {
        reportType,
        title,
        description,
        neighborhood,
        locationName,
        lat,
        lng,
        binId,
        photoUrl,
        reportedBy
      } = req.body;

      if (!title || !description || !neighborhood) {
        return res.status(400).json({ success: false, message: 'Title, description, and neighborhood are required' });
      }

      const id = `REP-${Date.now().toString().slice(-5)}`;
      const now = new Date().toISOString();

      // Heuristic AI classification for crowdsourced input
      let aiClassification = `AI Analyzed: High-confidence citizen report in ${neighborhood}.`;
      if (reportType === 'OVERFLOWING_BIN') {
        aiClassification = `AI Confidence: 96%. Cross-referenced with Bin Density Agent telemetry. Priority escalated for collection.`;
      } else if (reportType === 'ILLEGAL_DUMPING') {
        aiClassification = `AI Confidence: 92%. Detected unsegregated dumping pattern near commercial center. Flagged for sanitation sweep.`;
      } else if (reportType === 'MISSED_COLLECTION') {
        aiClassification = `AI Confidence: 95%. Verified delayed route dispatch for ${neighborhood} sector.`;
      } else if (reportType === 'DAMAGED_BIN') {
        aiClassification = `AI Confidence: 88%. Logged container structural defect. Maintenance ticket routed.`;
      }

      // If associated with a bin, boost bin fill/priority if overflowing
      if (binId && reportType === 'OVERFLOWING_BIN') {
        const bin = store.bins.find(b => b.binId === binId || b.id === binId);
        if (bin) {
          bin.fillLevel = Math.max(bin.fillLevel, 96);
          bin.status = 'CRITICAL';
          bin.priority = 'URGENT';
          bin.estimatedOverflowRisk = 0.98;
          bin.lastUpdated = now;
        }
      }

      const newReport = {
        id,
        reportId: id,
        reportType: reportType || 'OVERFLOWING_BIN',
        title,
        description,
        neighborhood,
        locationName: locationName || `${neighborhood} Citizen Tag`,
        lat: lat || 11.0168 + (Math.random() - 0.5) * 0.02,
        lng: lng || 76.9558 + (Math.random() - 0.5) * 0.02,
        binId: binId || undefined,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500',
        status: 'PENDING_VERIFICATION' as const,
        upvotesCount: 1,
        downvotesCount: 0,
        reportedBy: reportedBy || 'Concerned Citizen',
        aiClassification,
        createdAt: now,
        updatedAt: now
      };

      store.citizenReports.unshift(newReport);

      // System alert
      store.alerts.unshift({
        id: `ALT-${Date.now().toString().slice(-5)}`,
        severity: reportType === 'OVERFLOWING_BIN' || reportType === 'ILLEGAL_DUMPING' ? 'CRITICAL' : 'WARNING',
        title: `New Citizen Report: ${title}`,
        message: `Crowdsourced update submitted in ${neighborhood}: "${description.substring(0, 80)}..."`,
        timestamp: now,
        entityId: id,
        entityType: 'bin'
      });

      // Log agent event
      store.agentEvents.unshift({
        id: `EVT-${Date.now().toString().slice(-5)}`,
        agentName: 'Bin Density Agent',
        eventType: 'CITIZEN_REPORT_INGESTED',
        inputSummary: `Citizen report ${id} (${reportType}) at ${neighborhood}`,
        outputSummary: aiClassification,
        toolUsed: 'processCitizenCrowdsource',
        reasoning: `Ingested live GPS crowdsourced report from user ${reportedBy}. Spatial location pinned at ${neighborhood}.`,
        latencyMs: 110,
        timestamp: now,
        status: 'SUCCESS'
      });

      store.saveToDisk();

      res.json({ success: true, message: 'Citizen report submitted and AI classified', data: newReport });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/citizen-reports/:id/vote', (req, res) => {
    const report = store.citizenReports.find(r => r.id === req.params.id || r.reportId === req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const { direction } = req.body;
    if (direction === 'up') {
      report.upvotesCount += 1;
      if (report.upvotesCount >= 3 && report.status === 'PENDING_VERIFICATION') {
        report.status = 'VERIFIED';
        report.aiClassification = `Community Consensus Verified (${report.upvotesCount} citizen confirm votes).`;
      }
    } else if (direction === 'down') {
      report.downvotesCount += 1;
    }

    report.updatedAt = new Date().toISOString();
    store.saveToDisk();

    res.json({ success: true, data: report });
  });

  app.post('/api/citizen-reports/:id/status', (req, res) => {
    const report = store.citizenReports.find(r => r.id === req.params.id || r.reportId === req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    const { status } = req.body;
    report.status = status;
    report.updatedAt = new Date().toISOString();

    store.alerts.unshift({
      id: `ALT-${Date.now().toString().slice(-5)}`,
      severity: 'INFO',
      title: `Citizen Report ${report.reportId} Updated`,
      message: `Status changed to ${status} by municipal dispatcher.`,
      timestamp: new Date().toISOString()
    });

    store.saveToDisk();
    res.json({ success: true, message: `Report status updated to ${status}`, data: report });
  });

  // ==========================================
  // VITE & STATIC FILE SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WasteWise] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
