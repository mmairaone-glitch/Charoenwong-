import { Router, Response } from 'express';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../middleware.js';

const router = Router();

// Handle certificate uploads (base64 data URL payload)
router.post('/', authMiddleware, requireRoles(['Admin', 'QA/QC']), (req: AuthenticatedRequest, res: Response) => {
  const { fileName, fileData, fileType } = req.body;

  if (!fileData) {
    return res.status(400).json({ error: 'No file data received.' });
  }

  // In production with R2, this writes to Cloudflare R2 bucket.
  // In Node full-stack environment, we accept the base64 data URI directly for instant preview and download.
  const attachment_url = fileData;
  const attachment_name = fileName || `cert_${Date.now()}.${fileType === 'application/pdf' ? 'pdf' : 'png'}`;

  return res.json({
    success: true,
    attachment_url,
    attachment_name,
    message: 'Certificate uploaded successfully.',
  });
});

export default router;
