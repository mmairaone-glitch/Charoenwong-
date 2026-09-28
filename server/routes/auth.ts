import { Router, Response } from 'express';
import crypto from 'crypto';
import { db, hashPin, generateSalt } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, pin } = req.body;

  if (!username || !pin) {
    return res.status(400).json({ error: 'Username and 4-digit PIN are required.' });
  }

  // Validate 4-digit PIN
  if (!/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({ error: 'PIN must be exactly 4 numeric digits (0-9).' });
  }

  const users = db.getData().users;
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === String(username).trim().toLowerCase() ||
      u.employee_id.toLowerCase() === String(username).trim().toLowerCase()
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or PIN.' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'This user account has been disabled. Please contact an Administrator.' });
  }

  // Check lockout
  if (user.lockout_until && Date.now() < user.lockout_until) {
    const remainingMinutes = Math.ceil((user.lockout_until - Date.now()) / (60 * 1000));
    return res.status(429).json({
      error: `Account locked due to too many failed attempts. Please retry in ${remainingMinutes} minute(s).`,
    });
  }

  // Verify PIN
  const calculatedHash = hashPin(String(pin), user.salt);
  if (calculatedHash !== user.pin_hash) {
    user.failed_attempts = (user.failed_attempts || 0) + 1;
    if (user.failed_attempts >= 5) {
      user.lockout_until = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
      db.persist();
      db.logAudit({
        userId: user.id,
        userName: user.name,
        employeeId: user.employee_id,
        action: 'ACCOUNT_LOCKED',
        module: 'SECURITY',
        recordId: user.id,
        oldValue: null,
        newValue: { failed_attempts: user.failed_attempts, locked_for_minutes: 15 },
        ipAddress: req.ip,
      });
      return res.status(429).json({
        error: 'Too many failed login attempts. Account has been locked for 15 minutes for security.',
      });
    }
    db.persist();
    return res.status(401).json({
      error: `Invalid PIN. ${5 - user.failed_attempts} attempt(s) remaining before account lockout.`,
    });
  }

  // Success: reset attempts
  user.failed_attempts = 0;
  user.lockout_until = null;
  user.last_login = new Date().toISOString();

  // Create session token (expires in 24 hours)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  db.getData().sessions[token] = {
    userId: user.id,
    role: user.role,
    expiresAt,
  };

  db.persist();

  db.logAudit({
    userId: user.id,
    userName: user.name,
    employeeId: user.employee_id,
    action: 'USER_LOGIN',
    module: 'AUTH',
    recordId: user.id,
    oldValue: null,
    newValue: { username: user.username, role: user.role },
    ipAddress: req.ip,
  });

  const safeUser = {
    id: user.id,
    employee_id: user.employee_id,
    name: user.name,
    username: user.username,
    department: user.department,
    position: user.position,
    role: user.role,
    is_active: user.is_active,
    last_login: user.last_login,
    created_at: user.created_at,
  };

  return res.json({
    token,
    user: safeUser,
  });
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    delete db.getData().sessions[token];
    db.persist();
  }

  if (req.user) {
    db.logAudit({
      userId: req.user.id,
      userName: req.user.name,
      employeeId: req.user.employee_id,
      action: 'USER_LOGOUT',
      module: 'AUTH',
      recordId: req.user.id,
      ipAddress: req.ip,
    });
  }

  return res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const safeUser = {
    id: req.user.id,
    employee_id: req.user.employee_id,
    name: req.user.name,
    username: req.user.username,
    department: req.user.department,
    position: req.user.position,
    role: req.user.role,
    is_active: req.user.is_active,
    last_login: req.user.last_login,
    created_at: req.user.created_at,
  };

  return res.json({ user: safeUser });
});

// POST /api/auth/change-pin
router.post('/change-pin', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { current_pin, new_pin } = req.body;
  const user = req.user!;

  if (!current_pin || !new_pin) {
    return res.status(400).json({ error: 'Current PIN and new PIN are required.' });
  }

  if (!/^\d{4}$/.test(String(new_pin))) {
    return res.status(400).json({ error: 'New PIN must be exactly 4 numeric digits.' });
  }

  const currentHash = hashPin(String(current_pin), user.salt);
  if (currentHash !== user.pin_hash) {
    return res.status(400).json({ error: 'Incorrect current PIN.' });
  }

  const newSalt = generateSalt();
  user.salt = newSalt;
  user.pin_hash = hashPin(String(new_pin), newSalt);
  db.persist();

  db.logAudit({
    userId: user.id,
    userName: user.name,
    employeeId: user.employee_id,
    action: 'CHANGE_PIN',
    module: 'AUTH',
    recordId: user.id,
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: 'PIN updated successfully.' });
});

export default router;
