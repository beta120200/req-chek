import express from 'express';
import { supabase } from '../config/supabase.js';
import { loadContext } from '../lib/catalog.js';
import { daysUntil, isISODate } from '../lib/dates.js';
import { documentStatus } from '../lib/readiness.js';
import { logActivity } from '../lib/activity.js';

const router = express.Router();

const MAX_NOTES_LENGTH = 500;

// GET /api/documents
// -> { library: [...every document type], documents: { [docId]: record + status } }
router.get('/', async (req, res) => {
  try {
    const ctx = await loadContext(req);
    const documents = {};
    for (const [docId, doc] of Object.entries(ctx.documents)) {
      documents[docId] = { ...doc, status: documentStatus(ctx.documents, docId), remaining: daysUntil(doc.expiryDate) };
    }
    res.json({ library: ctx.library, documents });
  } catch (err) {
    console.error('Error in documents GET route:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// POST /api/documents - create/update the user's record for one document type
router.post('/', async (req, res) => {
  try {
    const { documentId, held = true, issueDate = null, expiryDate = null, notes = '' } = req.body ?? {};

    if (typeof documentId !== 'string' || !documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }
    if (typeof held !== 'boolean') {
      return res.status(400).json({ error: '"held" must be true or false' });
    }
    for (const [label, value] of [['issueDate', issueDate], ['expiryDate', expiryDate]]) {
      if (value !== null && value !== '' && !isISODate(value)) {
        return res.status(400).json({ error: `${label} must be a valid YYYY-MM-DD date` });
      }
    }
    if (typeof notes !== 'string' || notes.length > MAX_NOTES_LENGTH) {
      return res.status(400).json({ error: `Notes must be text up to ${MAX_NOTES_LENGTH} characters` });
    }

    const { data: docType, error: docTypeError } = await supabase
      .from('document_library')
      .select('id, name')
      .eq('id', documentId)
      .maybeSingle();
    if (docTypeError) {
      console.error('Error validating document ID:', docTypeError);
      return res.status(500).json({ error: 'Failed to save document' });
    }
    if (!docType) return res.status(400).json({ error: 'Invalid document ID' });

    const { error } = await supabase.from('user_documents').upsert(
      {
        user_id: req.user.id,
        document_id: documentId,
        held,
        issue_date: held ? issueDate || null : null,
        expiry_date: held ? expiryDate || null : null,
        notes: held ? notes : '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,document_id' },
    );
    if (error) {
      console.error('Error saving document:', error);
      return res.status(500).json({ error: 'Failed to save document' });
    }

    await logActivity(req.user.id, held ? `${docType.name} saved` : `${docType.name} marked as not held`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error in documents POST route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/documents - clear every document record the user has
router.delete('/', async (req, res) => {
  try {
    const { error } = await supabase.from('user_documents').delete().eq('user_id', req.user.id);
    if (error) {
      console.error('Error clearing documents:', error);
      return res.status(500).json({ error: 'Failed to clear documents' });
    }
    await logActivity(req.user.id, 'All document records cleared');
    res.json({ success: true });
  } catch (err) {
    console.error('Error in documents DELETE-all route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/documents/:documentId - clear the user's record for a document type
router.delete('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { error } = await supabase
      .from('user_documents')
      .delete()
      .eq('user_id', req.user.id)
      .eq('document_id', documentId);
    if (error) {
      console.error('Error deleting document:', error);
      return res.status(500).json({ error: 'Failed to delete document' });
    }

    const { data: docType } = await supabase.from('document_library').select('name').eq('id', documentId).maybeSingle();
    await logActivity(req.user.id, `${docType?.name || documentId} removed from inventory`);
    res.json({ success: true });
  } catch (err) {
    console.error('Error in documents DELETE route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
