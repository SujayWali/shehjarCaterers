'use client';
import { ReactNode, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';

export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const openPaths = ['/login'];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u && !openPaths.includes(pathname)) router.replace('/login');
      if (u && pathname === '/login') router.replace('/dashboard');
    });
    return () => unsub();
  }, [pathname, router]);

  if (loading) return null;
  return <>{children}</>;
}
