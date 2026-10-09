import express from 'express';
import multer from 'multer';
import { createWorker } from 'tesseract.js';
import { supabase } from '../config/supabase.js';
import { extractExpirationDate, generateNote } from '../lib/idDates.js';
import { logActivity } from '../lib/activity.js';
import { fetchLibrary } from '../lib/catalog.js';

const router = express.Router();
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Images are processed in memory and never written to disk or stored.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'idImage'));
  },
});

async function runOcr(buffer) {
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(buffer);
    return data.text || '';
  } finally {
    await worker.terminate();
  }
}

// POST /api/id-check  (multipart/form-data: idImage = file, idType = text)
router.post('/', upload.single('idImage'), async (req, res) => {
  try {
    const userId = req.user?.id ?? null;
    const idType = req.body?.idType;

    if (!req.file) {
      return res.status(400).json({ error: 'Upload an image of your ID (field name: idImage)' });
    }

    const library = await fetchLibrary();
    if (!library.some((d) => d.id === idType)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    const text = await runOcr(req.file.buffer);
    const expiryDate = extractExpirationDate(text);
    const note = generateNote(expiryDate, idType);

    // Only record the ID when a date was actually found, so a blurry photo
    // can never overwrite a record the user already entered by hand.
    let saved = false;
    if (expiryDate && userId) {
      const { error } = await supabase.from('user_documents').upsert(
        {
          user_id: userId,
          document_id: idType,
          held: true,
          expiry_date: expiryDate,
          notes: note,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,document_id' },
      );
      if (error) {
        console.error('Error saving ID check result:', error);
        return res.status(500).json({ error: 'Failed to save ID check results' });
      }
      saved = true;
      await logActivity(userId, `ID expiration check saved (${idType})`);
    }

    res.json({
      expiryDate,
      note,
      rawText: text.trim().slice(0, 200) + (text.trim().length > 200 ? '…' : ''),
      saved,
    });
  } catch (err) {
    console.error('Error in ID check route:', err);
    res.status(500).json({ error: 'ID analysis failed. Please try a clearer image.' });
  }
});

export default router;
