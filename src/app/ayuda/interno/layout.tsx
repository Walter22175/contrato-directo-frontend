import type { Metadata } from 'next';
import SoporteInternoGuard from '@/components/auth/SoporteInternoGuard';

export const metadata: Metadata = {
  title: 'Manual interno de soporte',
  robots: { index: false, follow: false },
};

export default function InternoLayout({ children }: { children: React.ReactNode }) {
  return <SoporteInternoGuard>{children}</SoporteInternoGuard>;
}
