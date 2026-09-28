import { Router, Response } from 'express';
import { db, hashPin, generateSalt, DbUser } from '../db.js';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../middleware.js';

const router = Router();

// Helper to sanitize user object
function sanitizeUser(u: DbUser) {
  return {
    id: u.id,
    employee_id: u.employee_id,
    name: u.name,
    username: u.username,
    department: u.department,
    position: u.position,
    role: u.role,
    is_active: u.is_active,
    last_login: u.last_login,
    created_at: u.created_at,
  };
}

// GET /api/users
router.get('/', authMiddleware, requireRoles(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const users = db.getData().users.map(sanitizeUser);
  return res.json({ users });
});

// POST /api/users
router.post('/', authMiddleware, requireRoles(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const { employee_id, name, username, pin, department, position, role } = req.body;

  if (!employee_id || !name || !username || !pin || !role) {
    return res.status(400).json({ error: 'Employee ID, Name, Username, 4-digit PIN, and Role are required.' });
  }

  // Validate 4-digit PIN
  if (!/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({ error: 'PIN must be exactly 4 numeric digits (0-9).' });
  }

  // Check unique username and employee_id
  const users = db.getData().users;
  const usernameExists = users.some((u) => u.username.toLowerCase() === String(username).trim().toLowerCase());
  if (usernameExists) {
    return res.status(400).json({ error: `Username '${username}' is already in use.` });
  }

  const empIdExists = users.some((u) => u.employee_id.toLowerCase() === String(employee_id).trim().toLowerCase());
  if (empIdExists) {
    return res.status(400).json({ error: `Employee ID '${employee_id}' is already registered.` });
  }

  const salt = generateSalt();
  const newUser: DbUser = {
    id: 'USR-' + Date.now(),
    employee_id: String(employee_id).trim().toUpperCase(),
    name: String(name).trim(),
    username: String(username).trim(),
    pin_hash: hashPin(String(pin), salt),
    salt,
    department: department ? String(department).trim() : 'QA/QC',
    position: position ? String(position).trim() : 'Technician',
    role,
    is_active: true,
    failed_attempts: 0,
    lockout_until: null,
    last_login: null,
    created_at: new Date().toISOString(),
  };

  users.push(newUser);
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'CREATE_USER',
    module: 'USER_MANAGEMENT',
    recordId: newUser.id,
    newValue: sanitizeUser(newUser),
    ipAddress: req.ip,
  });

  return res.status(201).json({ user: sanitizeUser(newUser) });
});

// PUT /api/users/:id
router.put('/:id', authMiddleware, requireRoles(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = db.getData().users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const oldValues = sanitizeUser(user);
  const { name, department, position, role } = req.body;

  if (name) user.name = String(name).trim();
  if (department !== undefined) user.department = String(department).trim();
  if (position !== undefined) user.position = String(position).trim();
  if (role) user.role = role;

  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'UPDATE_USER',
    module: 'USER_MANAGEMENT',
    recordId: user.id,
    oldValue: oldValues,
    newValue: sanitizeUser(user),
    ipAddress: req.ip,
  });

  return res.json({ user: sanitizeUser(user) });
});

// POST /api/users/:id/reset-pin
router.post('/:id/reset-pin', authMiddleware, requireRoles(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { new_pin } = req.body;

  if (!new_pin || !/^\d{4}$/.test(String(new_pin))) {
    return res.status(400).json({ error: 'New PIN must be exactly 4 numeric digits.' });
  }

  const user = db.getData().users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const newSalt = generateSalt();
  user.salt = newSalt;
  user.pin_hash = hashPin(String(new_pin), newSalt);
  user.failed_attempts = 0;
  user.lockout_until = null;
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'RESET_PASSWORD',
    module: 'USER_MANAGEMENT',
    recordId: user.id,
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: `PIN for ${user.name} has been reset successfully.` });
});

// POST /api/users/:id/toggle-status
router.post('/:id/toggle-status', authMiddleware, requireRoles(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = db.getData().users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Prevent disabling self
  if (user.id === req.user!.id) {
    return res.status(400).json({ error: 'You cannot disable your own administrator account.' });
  }

  user.is_active = !user.is_active;
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: user.is_active ? 'ENABLE_USER' : 'DISABLE_USER',
    module: 'USER_MANAGEMENT',
    recordId: user.id,
    newValue: { is_active: user.is_active },
    ipAddress: req.ip,
  });

  return res.json({ success: true, user: sanitizeUser(user) });
});

// DELETE /api/users/:id (Admin only)
router.delete('/:id', authMiddleware, requireRoles(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const users = db.getData().users;
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const user = users[index];

  // Prevent admin from deleting their own account
  if (user.id === req.user!.id) {
    return res.status(400).json({ error: 'You cannot delete your own administrator account.' });
  }

  const sanitized = sanitizeUser(user);

  // Remove from users list
  users.splice(index, 1);
  db.persist();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    employeeId: req.user!.employee_id,
    action: 'DELETE_USER',
    module: 'USER_MANAGEMENT',
    recordId: user.id,
    oldValue: sanitized,
    ipAddress: req.ip,
  });

  return res.json({
    success: true,
    message: `User ${user.name} (${user.employee_id}) has been permanently deleted.`,
  });
});

export default router;
