// src/functions/submitReport.js
import { db } from '../firestore.js';

export async function submitAccessibilityReport({ place_id, note, user }) {
  const ref = db.collection('reports').doc();
  await ref.set({
    place_id, note, user, created_at: Date.now(), status:'pending'
  });
  return { ok:true, report_id: ref.id };
}
