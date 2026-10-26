'use client';

import Image from 'next/image';

const logos = [
  { src: '/clientes/image19.png', alt: 'Cliente' },
  { src: '/clientes/image20.png', alt: 'Cliente' },
  { src: '/clientes/image21.jpg', alt: 'Cliente' },
  { src: '/clientes/image22.png', alt: 'Cliente' },
  { src: '/clientes/image23.jpg', alt: 'Cliente' },
  { src: '/clientes/image24.png', alt: 'Cliente' },
  { src: '/clientes/image25.png', alt: 'Cliente' },
  { src: '/clientes/image26.jpg', alt: 'Cliente' },
];

export default function GaleriaClientes() {
  const doble = [...logos, ...logos];

  return (
    <div className="grupo-marquee relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-slate-950 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-slate-950 to-transparent z-10" />
      <div className="flex w-max animate-marquee-clientes">
        {doble.map((logo, i) => (
          <div
            key={`${logo.src}-${i}`}
            className="mx-6 sm:mx-10 flex h-20 w-40 items-center justify-center"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={160}
              height={80}
              className="max-h-20 w-auto max-w-full object-contain opacity-80 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
