import { storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export async function saveMenuToStorage({ userId, menuId, blob, filename, contentType }:{ 
  userId: string; menuId: string; blob: Blob; filename: string; contentType: string; 
}) {
  const objectRef = ref(storage, `menus/${userId}/${menuId}/${filename}`);
  const file = new File([blob], filename, { type: contentType });
  await uploadBytes(objectRef, file, { contentType });
  const url = await getDownloadURL(objectRef);
  return { url };
}
