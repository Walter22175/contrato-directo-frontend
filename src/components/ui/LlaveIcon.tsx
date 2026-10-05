import type { CSSProperties } from 'react';

type LlaveIconProps = {
  className?: string;
};

/**
 * Icono de llave del sistema de valoracion (5 llaves).
 * Usa la silueta de /icons/llave.png como mascara y colorea con currentColor,
 * por lo que respeta las clases text- y fill del contexto (amarillo activo,
 * slate inactivo) igual que los iconos de lucide-react.
 */
export function LlaveIcon({ className = '' }: LlaveIconProps) {
  const mascara = {
    WebkitMaskImage: 'url(/icons/llave.png)',
    maskImage: 'url(/icons/llave.png)',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  } as CSSProperties;

  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current align-middle ${className}`}
      style={mascara}
    />
  );
}

export default LlaveIcon;
