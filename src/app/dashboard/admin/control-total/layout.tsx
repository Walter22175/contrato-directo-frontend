import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Control Total | Contrato Directo',
  robots: { index: false, follow: false },
};

export default function ControlTotalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
