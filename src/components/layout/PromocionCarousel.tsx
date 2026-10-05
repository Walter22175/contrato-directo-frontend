'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Promocion } from '@/types';
import Link from 'next/link';

interface StaticSlide {
  src: string;
  alt: string;
  title: string;
  description: string;
  ctaText?: string;
  ctaLink?: string;
}

interface PromocionCarouselProps {
  promociones: Promocion[];
  staticSlides?: StaticSlide[];
  scrollSpeed?: number;
  gap?: number;
  itemWidth?: number;
}

const DEFAULT_STATIC_SLIDES: StaticSlide[] = [
  {
    src: '/carrusel/acuerdo.png',
    alt: 'Conecta. Acuerda. Realiza.',
    title: 'Conecta. <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Acuerda.</span> Realiza.',
    description: 'La plataforma que conecta clientes con proveedores de servicios de confianza. Contratos seguros, pagos protegidos.',
    ctaText: 'Buscar Servicios',
    ctaLink: '/servicios',
  },
  {
    src: '/carrusel/plomeria.png',
    alt: 'Servicios de plomería',
    title: '¿Necesitas un <span class="text-cyan-400">plomero</span> de confianza?',
    description: 'Encuentra profesionales verificados para reparaciones, instalaciones y mantenimiento de plomería.',
    ctaText: 'Ver Plomeros',
    ctaLink: '/servicios?q=plomería',
  },
  {
    src: '/carrusel/electricidad.png',
    alt: 'Servicios eléctricos',
    title: 'Electricistas <span class="text-cyan-400">certificados</span> a tu alcance',
    description: 'Instalaciones, reparaciones y certificaciones eléctricas con garantía y seguridad.',
    ctaText: 'Ver Electricistas',
    ctaLink: '/servicios?q=electricidad',
  },
  {
    src: '/carrusel/pintura.png',
    alt: 'Servicios de pintura',
    title: 'Renueva tus espacios con <span class="text-cyan-400">pintores profesionales</span>',
    description: 'Pintura interior, exterior, decorativa y tratamiento de humedad. Presupuestos sin compromiso.',
    ctaText: 'Ver Pintores',
    ctaLink: '/servicios?q=pintura',
  },
  {
    src: '/carrusel/software.png',
    alt: 'Desarrollo de software',
    title: 'Soluciones <span class="text-cyan-400">digitales</span> a medida',
    description: 'Desarrollo web, apps móviles, sistemas a medida y consultoría tecnológica.',
    ctaText: 'Ver Desarrolladores',
    ctaLink: '/servicios?categoria=tecnologia',
  },
];

type SlideType = Promocion | StaticSlide;

function isPromocion(slide: SlideType): slide is Promocion {
  return 'id_promocion' in slide;
}

type CenterEffect = 'rotate' | 'pixelate' | 'flip' | 'scale' | 'glow';

const CENTER_EFFECTS: CenterEffect[] = ['rotate', 'pixelate', 'flip', 'scale', 'glow'];

export default function PromocionCarousel({ 
  promociones, 
  staticSlides = DEFAULT_STATIC_SLIDES,
  scrollSpeed = 40,
  gap = 32,
  itemWidth = 380,
}: PromocionCarouselProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [centerEffect, setCenterEffect] = useState<CenterEffect | null>(null);
  const [centerIndex, setCenterIndex] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const positionRef = useRef(0);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPausingRef = useRef(false);
  const lastCenterIndexRef = useRef<number | null>(null);

  // Normaliza defensivamente: el backend retorna { data, meta } y un prop
  // malformado no debe romper el render del home.
  const promocionesLista = Array.isArray(promociones)
    ? promociones.filter((p) => p && p.activa)
    : [];
  const validPromociones = promocionesLista;
  const hasRealPromociones = validPromociones.length > 0;
  const slides = hasRealPromociones ? validPromociones : staticSlides;

  // Need at least 3 slides for infinite effect, duplicate to ensure smooth looping
  const duplicatedSlides = [...slides, ...slides, ...slides];
  const singleSetLength = slides.length;
  const singleSetWidth = singleSetLength * (itemWidth + gap);

  const containerCenterX = useCallback(() => {
    if (!trackRef.current) return 0;
    const containerRect = trackRef.current.parentElement?.getBoundingClientRect();
    if (!containerRect) return 0;
    return containerRect.width / 2;
  }, []);

  const getItemCenterX = useCallback((index: number, currentPosition: number) => {
    return currentPosition + index * (itemWidth + gap) + itemWidth / 2;
  }, [itemWidth, gap]);

  // Manual navigation functions
  const scrollToNext = useCallback(() => {
    if (!trackRef.current) return;
    const itemStep = itemWidth + gap;
    positionRef.current -= itemStep;
    if (Math.abs(positionRef.current) >= singleSetWidth) {
      positionRef.current += singleSetWidth;
    }
    trackRef.current.style.transform = `translateX(${positionRef.current}px)`;
  }, [itemWidth, gap, singleSetWidth]);

  const scrollToPrev = useCallback(() => {
    if (!trackRef.current) return;
    const itemStep = itemWidth + gap;
    positionRef.current += itemStep;
    if (positionRef.current >= 0) {
      positionRef.current -= singleSetWidth;
    }
    trackRef.current.style.transform = `translateX(${positionRef.current}px)`;
  }, [itemWidth, gap, singleSetWidth]);

  useEffect(() => {
    const animate = (currentTime: number) => {
      if (!trackRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Handle pause at center
      if (isPausingRef.current) {
        lastTimeRef.current = currentTime;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      if (isPaused) {
        lastTimeRef.current = currentTime;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      positionRef.current -= scrollSpeed * deltaTime;

      // Reset position when we've scrolled one full set
      if (Math.abs(positionRef.current) >= singleSetWidth) {
        positionRef.current += singleSetWidth;
      }

      trackRef.current.style.transform = `translateX(${positionRef.current}px)`;

      // Check which item is at center
      const centerX = containerCenterX();
      let closestIndex: number | null = null;
      let closestDistance = Infinity;

      const totalItems = singleSetLength * 3;
      for (let index = 0; index < totalItems; index++) {
        const itemCenterX = getItemCenterX(index, positionRef.current);
        const distance = Math.abs(itemCenterX - centerX);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }

      // If an item is close to center (within 50px), trigger pause and effect
      if (closestIndex !== null && closestDistance < 50 && !isPausingRef.current) {
        const normalizedIndex = closestIndex % singleSetLength;

        // Only trigger if different from last centered item AND we've moved past it
        if (normalizedIndex !== lastCenterIndexRef.current && closestDistance < 30) {
          lastCenterIndexRef.current = normalizedIndex;
          setCenterIndex(normalizedIndex);

          // Random effect
          const randomEffect = CENTER_EFFECTS[Math.floor(Math.random() * CENTER_EFFECTS.length)];
          setCenterEffect(randomEffect);
          isPausingRef.current = true;

          // Pause for 2 seconds
          if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
          pauseTimerRef.current = setTimeout(() => {
            isPausingRef.current = false;
            setCenterEffect(null);
            setCenterIndex(null);
            // Don't reset lastCenterIndexRef here - let it naturally change when we move to next item
          }, 2000);
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [isPaused, scrollSpeed, containerCenterX, getItemCenterX, singleSetLength, singleSetWidth]);

  if (slides.length === 0) return null;

  const getEffectClass = (index: number, effect: CenterEffect | null) => {
    if (centerIndex !== index || !effect) return '';
    
    switch (effect) {
      case 'rotate':
        return 'animate-center-rotate';
      case 'pixelate':
        return 'animate-center-pixelate';
      case 'flip':
        return 'animate-center-flip';
      case 'scale':
        return 'animate-center-scale';
      case 'glow':
        return 'animate-center-glow';
      default:
        return '';
    }
  };

  const getEffectStyle = (index: number, effect: CenterEffect | null) => {
    if (centerIndex !== index || !effect) return {};
    
    switch (effect) {
      case 'rotate':
        return { animation: 'centerRotate 1s ease-out' };
      case 'pixelate':
        return { animation: 'centerPixelate 1s ease-out' };
      case 'flip':
        return { animation: 'centerFlip 1s ease-out' };
      case 'scale':
        return { animation: 'centerScale 1s ease-out' };
      case 'glow':
        return { animation: 'centerGlow 1s ease-out' };
      default:
        return {};
    }
  };

  return (
    <section 
      className="w-full overflow-hidden bg-slate-900 border-b border-slate-800 relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Global styles for center effects */}
      <style jsx global>{`
        @keyframes centerRotate {
          0% { transform: rotateY(0deg) scale(1); filter: none; }
          25% { transform: rotateY(90deg) scale(1.05); filter: brightness(1.2); }
          50% { transform: rotateY(180deg) scale(1.1); filter: brightness(1.3) saturate(1.5); }
          75% { transform: rotateY(270deg) scale(1.05); filter: brightness(1.2); }
          100% { transform: rotateY(360deg) scale(1); filter: none; }
        }
        @keyframes centerPixelate {
          0% { filter: none; transform: scale(1); }
          30% { filter: blur(0px) contrast(2); transform: scale(1.02); }
          50% { filter: blur(2px) contrast(3) brightness(1.5); transform: scale(1.05); }
          70% { filter: blur(0px) contrast(2); transform: scale(1.02); }
          100% { filter: none; transform: scale(1); }
        }
        @keyframes centerFlip {
          0% { transform: rotateX(0deg) scale(1); }
          50% { transform: rotateX(180deg) scale(1.1); filter: brightness(1.3); }
          100% { transform: rotateX(360deg) scale(1); filter: none; }
        }
        @keyframes centerScale {
          0% { transform: scale(1); filter: none; }
          50% { transform: scale(1.15); filter: brightness(1.4) drop-shadow(0 0 30px rgba(6, 182, 212, 0.6)); }
          100% { transform: scale(1); filter: none; }
        }
        @keyframes centerGlow {
          0% { box-shadow: 0 0 0 rgba(6, 182, 212, 0); transform: scale(1); }
          50% { box-shadow: 0 0 60px 20px rgba(6, 182, 212, 0.5), 0 0 100px 40px rgba(6, 182, 212, 0.3); transform: scale(1.08); filter: brightness(1.2); }
          100% { box-shadow: 0 0 0 rgba(6, 182, 212, 0); transform: scale(1); }
        }
        .animate-center-rotate { animation: centerRotate 1s ease-out; }
        .animate-center-pixelate { animation: centerPixelate 1s ease-out; }
        .animate-center-flip { animation: centerFlip 1s ease-out; transform-style: preserve-3d; }
        .animate-center-scale { animation: centerScale 1s ease-out; }
        .animate-center-glow { animation: centerGlow 1s ease-out; }
      `}</style>

      <div 
        className="flex items-center gap-[32px] will-change-transform"
        ref={trackRef}
        style={{ gap: `${gap}px` }}
        role="region"
        aria-label="Promociones y servicios destacados"
      >
        {duplicatedSlides.map((slide, index) => {
          const normalizedIndex = index % singleSetLength;
          const isCenter = centerIndex === normalizedIndex && centerEffect !== null;
          const effectClass = getEffectClass(normalizedIndex, centerEffect);
          const effectStyle = getEffectStyle(normalizedIndex, centerEffect);

          return (
            <div 
              key={`${index}-${isPromocion(slide) ? slide.id_promocion : slide.src}`}
              className={`flex-shrink-0 relative ${effectClass}`}
              style={{ 
                minWidth: `${itemWidth}px`, 
                maxWidth: `${itemWidth}px`,
                ...effectStyle
              }}
            >
              <article className="relative h-[260px] md:h-[300px] lg:h-[340px] rounded-xl overflow-hidden bg-slate-800/50 transition-all duration-300">
                <div className="absolute inset-0">
                  <Image
                    src={isPromocion(slide) ? slide.imagen_url : slide.src}
                    alt={isPromocion(slide) ? slide.titulo : slide.alt}
                    fill
                    priority={index === 0}
                    className="object-cover transition-all duration-500"
                    sizes="(max-width: 768px) 380px, (max-width: 1024px) 420px, 460px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-slate-900/10" />
                </div>

                <div className="absolute inset-0 flex items-end p-4 md:p-6">
                  <div className="w-full max-w-xs">
                    {isPromocion(slide) ? (
                      <>
                        <div className="mb-3 flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full">
                            Promoción
                          </span>
                          {slide.enlace && (
                            <span className="px-2.5 py-1 bg-slate-800/50 text-slate-300 text-xs font-medium rounded-full backdrop-blur">
                              Ver detalles
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 leading-tight">
                          {slide.titulo}
                        </h2>
                        <p className="text-slate-300 text-sm md:text-base mb-4 leading-relaxed line-clamp-2">
                          {slide.descripcion}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="text-xl md:text-2xl font-bold text-cyan-400">
                            {slide.precio.toLocaleString('es-AR', { 
                              style: 'currency', 
                              currency: slide.moneda || 'ARS',
                              minimumFractionDigits: 0 
                            })}
                          </div>
                          {slide.enlace && (
                            <Link
                              href={slide.enlace}
                              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors text-sm"
                            >
                              Ver promoción
                            </Link>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 leading-tight" dangerouslySetInnerHTML={{ __html: slide.title }} />
                        <p className="text-slate-300 text-sm md:text-base mb-4 leading-relaxed line-clamp-2">
                          {slide.description}
                        </p>
                        {slide.ctaLink && slide.ctaText && (
                          <Link
                            href={slide.ctaLink}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors text-sm inline-block"
                          >
                            {slide.ctaText}
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Center indicator */}
                {isCenter && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-full animate-pulse">
                    <span className="relative">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="6" cy="6" r="2" fill="currentColor"/>
                      </svg>
                    </span>
                    <span>En foco</span>
                  </div>
                )}
              </article>
            </div>
          );
        })}
      </div>

      {/* Navigation buttons - visible but subtle */}
      <button
        onClick={scrollToPrev}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all duration-200 border border-white/10"
        aria-label="Promoción anterior"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 10L7.5 5L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button
        onClick={scrollToNext}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all duration-200 border border-white/10"
        aria-label="Próxima promoción"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.5 10L12.5 5L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none" aria-hidden="true" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none" aria-hidden="true" />
    </section>
  );
}