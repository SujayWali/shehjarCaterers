import { storage } from '../lib/firebase';
import { ref, deleteObject } from 'firebase/storage';

export async function safeDelete(path?: string) {
  if (!path) return;
  await deleteObject(ref(storage, path)).catch(() => {});
}
