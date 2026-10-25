import type { ReactNode } from 'react';

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function ProveedorLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
