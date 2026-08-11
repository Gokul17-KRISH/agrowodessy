import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { store } from './server/db/store.js';
import { connectToDatabase, isMongoConnected } from './server/db/mongodb.js';
import { User } from './src/types.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'agrilink_jwt_secret_2026_resilient_supply';

// Auth Rate Limiter
const authRateLimits = new Map<string, { count: number; resetAt: number }>();

function authRateLimiter(req: any, res: any, next: any) {
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 25;

  const current = authRateLimits.get(ip);
  if (!current || now > current.resetAt) {
    authRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (current.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please wait a minute.'
    });
  }

  current.count++;
  next();
}

// Auth Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.cookies && req.cookies.agrilink_token) {
    token = req.cookies.agrilink_token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
    }

    const user = store.getUserById(decoded.id) || store.getUserByEmail(decoded.email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account deactivated.' });
    }

    req.user = user;
    next();
  });
}

function requireRole(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
    }
    next();
  };
}

export const app = express();
let isAppInitialized = false;

export async function initServerApp() {
  if (isAppInitialized) return app;
  isAppInitialized = true;

  try {
    await connectToDatabase();
    await store.syncWithMongo();
  } catch (err) {
    console.warn('[AgriLink] Database initialization warning:', err);
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // ==========================================
  // HEALTH CHECK
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AgriLink — Resilient Agricultural Marketplace',
      mongoConnected: isMongoConnected(),
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  // REGISTER
  app.post('/api/auth/register', authRateLimiter, async (req, res) => {
    try {
      const { name, fullName, email, password, confirmPassword, phone, district, role: requestedRole } = req.body;
      const displayName = (fullName || name || '').trim();

      if (!displayName) return res.status(400).json({ success: false, message: 'Name is required.' });
      if (!email || !email.includes('@')) return res.status(400).json({ success: false, message: 'Valid email is required.' });
      if (!password || password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
      if (confirmPassword !== undefined && password !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match.' });

      const cleanEmail = email.trim().toLowerCase();
      if (store.getUserByEmail(cleanEmail)) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }

      const allowedRoles = ['FARMER', 'BUYER', 'GRADER'];
      const role = (requestedRole && allowedRoles.includes(requestedRole)) ? requestedRole : 'FARMER';

      const passwordHash = bcrypt.hashSync(password, 10);
      const nowIso = new Date().toISOString();

      const newUser: User = {
        id: `USR-${Date.now()}`,
        name: displayName,
        email: cleanEmail,
        role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=16A34A&color=fff`,
        phone: phone?.trim(),
        district: district || 'Coimbatore',
        isActive: true,
        isEmailVerified: false,
        createdAt: nowIso,
        updatedAt: nowIso,
        passwordHash
      };

      store.addUser(newUser);
      const safeUser = store.sanitizeUser(newUser);
      const token = jwt.sign({ id: safeUser.id, email: safeUser.email, role: safeUser.role }, JWT_SECRET, { expiresIn: '24h' });

      res.cookie('agrilink_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 86400000 });
      res.status(201).json({ success: true, message: 'Account created.', token, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Registration error.' });
    }
  });

  // LOGIN
  app.post('/api/auth/login', authRateLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });

      const cleanEmail = email.trim().toLowerCase();
      const user = store.getUserByEmail(cleanEmail);

      if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      if (!user.passwordHash) return res.status(401).json({ success: false, message: 'Account requires password setup.' });

      const validPassword = bcrypt.compareSync(password, user.passwordHash);
      if (!validPassword) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

      store.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
      const safeUser = store.sanitizeUser(user);
      const token = jwt.sign({ id: safeUser.id, email: safeUser.email, role: safeUser.role }, JWT_SECRET, { expiresIn: '24h' });

      res.cookie('agrilink_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 86400000 });
      res.json({ success: true, token, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Login error.' });
    }
  });

  // GOOGLE SSO — Server-side token verification
  app.post('/api/auth/google', authRateLimiter, async (req, res) => {
    try {
      const { credential } = req.body;
      if (!credential) return res.status(400).json({ success: false, message: 'Google credential token is required.' });

      const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      if (!GOOGLE_CLIENT_ID) {
        return res.status(500).json({ success: false, message: 'Google OAuth is not configured on this server.' });
      }

      // Dynamically import to keep ESM/CJS compatibility
      const { OAuth2Client } = await import('google-auth-library');
      const client = new OAuth2Client(GOOGLE_CLIENT_ID);

      let payload: any;
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: GOOGLE_CLIENT_ID
        });
        payload = ticket.getPayload();
      } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired Google token. Please try again.' });
      }

      if (!payload || !payload.email) {
        return res.status(401).json({ success: false, message: 'Could not retrieve email from Google account.' });
      }

      const cleanEmail = payload.email.trim().toLowerCase();
      let user = store.getUserByEmail(cleanEmail);

      if (!user) {
        const nowIso = new Date().toISOString();
        const displayName = payload.name || cleanEmail.split('@')[0];
        user = {
          id: `USR-G-${Date.now()}`,
          name: displayName,
          email: cleanEmail,
          role: 'FARMER',
          avatar: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=16A34A&color=fff`,
          isActive: true,
          isEmailVerified: true, // Google verified the email
          district: 'Coimbatore',
          createdAt: nowIso,
          updatedAt: nowIso,
          passwordHash: bcrypt.hashSync(`google_${payload.sub}_${Date.now()}`, 10)
        };
        store.addUser(user);
      } else {
        // Update avatar if Google provides one
        if (payload.picture && !user.avatar?.includes('ui-avatars')) {
          store.updateUser(user.id, { avatar: payload.picture, isEmailVerified: true });
        }
      }

      store.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
      const safeUser = store.sanitizeUser(store.getUserById(user.id) || user);
      const token = jwt.sign({ id: safeUser.id, email: safeUser.email, role: safeUser.role }, JWT_SECRET, { expiresIn: '24h' });

      res.cookie('agrilink_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 86400000 });
      res.json({ success: true, token, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Google SSO error.' });
    }
  });

  // GET ME
  app.get('/api/auth/me', authenticateToken, (req, res) => {
    const safeUser = store.sanitizeUser(req.user);
    res.json({ success: true, user: safeUser });
  });

  // LOGOUT
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('agrilink_token');
    res.json({ success: true, message: 'Logged out.' });
  });

  // LIST USERS (Admin only)
  app.get('/api/auth/users', authenticateToken, requireRole(['ADMIN']), (req, res) => {
    const usersClean = store.users.map(u => store.sanitizeUser(u));
    res.json({ success: true, count: usersClean.length, data: usersClean });
  });

  // ==========================================
  // DEMAND CONTRACTS (Buyer creates, all view)
  // ==========================================

  app.get('/api/demands', (req, res) => {
    const { district, status, cropName } = req.query as any;
    let demands = store.getDemands();
    if (district) demands = demands.filter(d => d.district.toLowerCase() === district.toLowerCase());
    if (status) demands = demands.filter(d => d.status === status);
    if (cropName) demands = demands.filter(d => d.cropName.toLowerCase().includes(cropName.toLowerCase()));
    res.json({ success: true, count: demands.length, data: demands });
  });

  app.get('/api/demands/:id', (req, res) => {
    const demand = store.getDemandById(req.params.id);
    if (!demand) return res.status(404).json({ success: false, message: 'Demand contract not found.' });

    // Attach related commitments
    const commitments = store.getCommitments().filter(c => c.demandContractId === demand.id);
    res.json({ success: true, data: { ...demand, commitments } });
  });

  app.post('/api/demands', authenticateToken, requireRole(['BUYER', 'ADMIN']), (req, res) => {
    try {
      const { cropName, quantityRequiredKg, pricePerKg, targetMonth, district, terms, qualityRequirements } = req.body;
      if (!cropName || !quantityRequiredKg || !pricePerKg || !targetMonth || !district) {
        return res.status(400).json({ success: false, message: 'All fields required: cropName, quantityRequiredKg, pricePerKg, targetMonth, district.' });
      }

      const demand = store.addDemand({
        id: `DEM-${Date.now().toString().slice(-6)}`,
        buyerId: req.user.id,
        buyerName: req.user.name,
        businessName: req.user.businessName || '',
        cropName,
        quantityRequiredKg,
        quantityCommittedKg: 0,
        pricePerKg,
        targetMonth,
        district,
        terms: terms || '',
        qualityRequirements: qualityRequirements || '',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Notify farmers in district
      const farmersinDistrict = store.users.filter(u => u.role === 'FARMER' && u.district?.toLowerCase() === district.toLowerCase());
      farmersinDistrict.forEach(f => {
        store.addNotification({
          id: `NOT-${Date.now()}-${f.id}`,
          recipientId: f.id,
          title: 'New Crop Demand',
          message: `${req.user.name} posted a contract for ${cropName} (${quantityRequiredKg.toLocaleString()} Kg) at ₹${pricePerKg}/Kg in ${district}.`,
          type: 'DEMAND',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      });

      res.status(201).json({ success: true, data: demand });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/demands/:id', authenticateToken, requireRole(['BUYER', 'ADMIN']), (req, res) => {
    const demand = store.updateDemand(req.params.id, req.body);
    if (!demand) return res.status(404).json({ success: false, message: 'Demand not found.' });
    res.json({ success: true, data: demand });
  });

  // ==========================================
  // CROP COMMITMENTS (Farmer creates)
  // ==========================================

  app.get('/api/commitments', (req, res) => {
    const { farmerId, demandContractId, district } = req.query as any;
    let commitments = store.getCommitments();
    if (farmerId) commitments = commitments.filter(c => c.farmerId === farmerId);
    if (demandContractId) commitments = commitments.filter(c => c.demandContractId === demandContractId);
    if (district) commitments = commitments.filter(c => c.district.toLowerCase() === district.toLowerCase());
    res.json({ success: true, count: commitments.length, data: commitments });
  });

  app.post('/api/commitments', authenticateToken, requireRole(['FARMER', 'ADMIN']), (req, res) => {
    try {
      const { demandContractId, quantityKg, plantingDate, harvestDateAvailable } = req.body;

      const demand = store.getDemandById(demandContractId);
      if (!demand) return res.status(404).json({ success: false, message: 'Demand contract not found.' });
      if (demand.status === 'CANCELLED' || demand.status === 'COMPLETED') {
        return res.status(400).json({ success: false, message: 'This demand is no longer accepting commitments.' });
      }

      const commitment = store.addCommitment({
        id: `COM-${Date.now().toString().slice(-6)}`,
        farmerId: req.user.id,
        farmerName: req.user.name,
        demandContractId,
        cropName: demand.cropName,
        quantityKg,
        district: demand.district,
        plantingDate: plantingDate || new Date().toISOString().split('T')[0],
        harvestDateAvailable: harvestDateAvailable || '',
        status: 'PLANNED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Notify buyer
      store.addNotification({
        id: `NOT-${Date.now()}`,
        recipientId: demand.buyerId,
        title: 'New Farmer Commitment',
        message: `${req.user.name} committed ${quantityKg.toLocaleString()} Kg of ${demand.cropName} for your demand.`,
        type: 'COMMITMENT',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      res.status(201).json({ success: true, data: commitment });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/commitments/:id', authenticateToken, (req, res) => {
    const commitment = store.updateCommitment(req.params.id, req.body);
    if (!commitment) return res.status(404).json({ success: false, message: 'Commitment not found.' });
    res.json({ success: true, data: commitment });
  });

  // ==========================================
  // QUALITY REPORTS (Grader creates)
  // ==========================================

  app.get('/api/quality-reports', (req, res) => {
    const reports = store.getQualityReports();
    res.json({ success: true, count: reports.length, data: reports });
  });

  app.post('/api/quality-reports', authenticateToken, requireRole(['GRADER', 'ADMIN']), (req, res) => {
    try {
      const { cropCommitmentId, grade, parameters, notes } = req.body;
      if (!cropCommitmentId || !grade) {
        return res.status(400).json({ success: false, message: 'cropCommitmentId and grade required.' });
      }

      const report = store.addQualityReport({
        id: `QR-${Date.now().toString().slice(-6)}`,
        graderId: req.user.id,
        graderName: req.user.name,
        cropCommitmentId,
        grade,
        parameters: parameters || { moisturePct: 0, avgSizeCm: 0, defectsPct: 0, organicRating: 0 },
        notes: notes || '',
        certifiedAt: new Date().toISOString()
      });

      // Notify relevant farmer
      const commitment = store.getCommitments().find(c => c.id === cropCommitmentId);
      if (commitment) {
        store.addNotification({
          id: `NOT-${Date.now()}`,
          recipientId: commitment.farmerId,
          title: 'Quality Report Filed',
          message: `Your ${commitment.cropName} batch was graded "${grade}" by ${req.user.name}.`,
          type: 'QUALITY',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      res.status(201).json({ success: true, data: report });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // DELIVERIES & ESCROW
  // ==========================================

  app.get('/api/deliveries', (req, res) => {
    const { buyerId, farmerId, demandContractId } = req.query as any;
    let deliveries = store.getDeliveries();
    if (buyerId) deliveries = deliveries.filter(d => d.buyerId === buyerId);
    if (farmerId) deliveries = deliveries.filter(d => d.farmerId === farmerId);
    if (demandContractId) deliveries = deliveries.filter(d => d.demandContractId === demandContractId);
    res.json({ success: true, count: deliveries.length, data: deliveries });
  });

  app.get('/api/deliveries/:id', (req, res) => {
    const delivery = store.getDeliveryById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found.' });
    res.json({ success: true, data: delivery });
  });

  app.post('/api/deliveries', authenticateToken, (req, res) => {
    try {
      const { demandContractId, cropCommitmentId, quantityDeliveredKg } = req.body;
      const demand = store.getDemandById(demandContractId);
      const commitment = store.getCommitments().find(c => c.id === cropCommitmentId);
      if (!demand || !commitment) return res.status(404).json({ success: false, message: 'Demand or commitment not found.' });

      const delivery = store.addDelivery({
        id: `DLV-${Date.now().toString().slice(-6)}`,
        demandContractId,
        cropName: demand.cropName,
        buyerId: demand.buyerId,
        buyerName: demand.buyerName,
        farmerId: commitment.farmerId,
        farmerName: commitment.farmerName,
        cropCommitmentId,
        quantityDeliveredKg: quantityDeliveredKg || commitment.quantityKg,
        pricePerKg: demand.pricePerKg,
        totalAmount: (quantityDeliveredKg || commitment.quantityKg) * demand.pricePerKg,
        escrowStatus: 'AWAITING_DEPOSIT',
        deliveryStatus: 'PENDING',
        trackingTimeline: [{
          status: 'PENDING',
          timestamp: new Date().toISOString(),
          updatedBy: 'System',
          description: 'Delivery record created. Waiting for buyer escrow deposit.'
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      res.status(201).json({ success: true, data: delivery });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Escrow action: deposit / release / refund
  app.post('/api/deliveries/:id/escrow', authenticateToken, (req, res) => {
    const { action } = req.body;
    const delivery = store.getDeliveryById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found.' });

    const now = new Date().toISOString();
    if (action === 'deposit') {
      delivery.escrowStatus = 'HELD_IN_ESCROW';
      delivery.trackingTimeline.push({
        status: 'ESCROW_DEPOSITED',
        timestamp: now,
        updatedBy: req.user.id,
        description: `Buyer deposited ₹${delivery.totalAmount.toLocaleString()} into escrow.`
      });
    } else if (action === 'release') {
      delivery.escrowStatus = 'RELEASED_TO_FARMER';
      delivery.deliveryStatus = 'DELIVERED';
      delivery.trackingTimeline.push({
        status: 'RELEASED',
        timestamp: now,
        updatedBy: req.user.id,
        description: `Escrow funds released to farmer. Transaction complete.`
      });
    } else if (action === 'refund') {
      delivery.escrowStatus = 'REFUNDED_TO_BUYER';
      delivery.trackingTimeline.push({
        status: 'REFUNDED',
        timestamp: now,
        updatedBy: req.user.id,
        description: `Escrow refunded to buyer due to quality/delivery issue.`
      });
    }

    delivery.updatedAt = now;
    store.saveToDisk();
    res.json({ success: true, data: delivery });
  });

  // Delivery status update
  app.patch('/api/deliveries/:id', authenticateToken, (req, res) => {
    const delivery = store.updateDelivery(req.params.id, req.body);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found.' });
    res.json({ success: true, data: delivery });
  });

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  app.get('/api/notifications', authenticateToken, (req, res) => {
    const notifications = store.getNotifications(req.user.id);
    res.json({ success: true, count: notifications.length, data: notifications });
  });

  app.post('/api/notifications/:id/read', authenticateToken, (req, res) => {
    store.markNotificationAsRead(req.params.id);
    res.json({ success: true });
  });

  // ==========================================
  // DISTRICT SATURATION INTELLIGENCE
  // ==========================================

  app.get('/api/saturation', (req, res) => {
    const { district } = req.query as any;
    let data = store.getDistrictSaturationData();
    if (district) data = data.filter(d => d.district.toLowerCase() === district.toLowerCase());
    res.json({ success: true, count: data.length, data });
  });

  // ==========================================
  // SYSTEM METRICS
  // ==========================================

  app.get('/api/metrics', (req, res) => {
    const metrics = store.getSystemMetrics();
    res.json({ success: true, data: metrics });
  });

  return app;
}

export async function startStandaloneServer() {
  await initServerApp();
  const PORT = Number(process.env.PORT) || 3000;

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
    console.log(`[AgriLink] Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startStandaloneServer();
}

export default app;
