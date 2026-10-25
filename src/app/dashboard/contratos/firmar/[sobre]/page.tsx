import FirmarSobrePage from './page-client';

export function generateStaticParams() {
  return [{ sobre: 'placeholder' }];
}

export default function Page() {
  return <FirmarSobrePage />;
}
