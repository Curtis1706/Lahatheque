"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Book {
  title: string;
  author: string;
  category: string;
  coverBg: string;
  titleColor: string;
  spineBg: string;
}

interface Slide {
  id: number;
  books: Book[];
}

const slidesData: Slide[] = [
  {
    id: 1,
    books: [
      {
        title: "DROIT DES AFFAIRES",
        author: "Pr. A. KOUASSI",
        category: "Droit",
        coverBg: "bg-[#1B2A4E]",
        titleColor: "text-[#B08D42]",
        spineBg: "bg-[#0F1A33]",
      },
      {
        title: "ÉCONOMIE MONÉTAIRE",
        author: "Dr. K. YAO",
        category: "Économie",
        coverBg: "bg-[#F5F3EF]",
        titleColor: "text-[#1B2A4E]",
        spineBg: "bg-[#E8E4DC]",
      },
      {
        title: "COMPTABILITÉ APPROFONDIE",
        author: "Pr. E. TRAORÉ",
        category: "Gestion",
        coverBg: "bg-[#2E3F66]",
        titleColor: "text-[#FDFCFA]",
        spineBg: "bg-[#1B2A4E]",
      },
    ],
  },
  {
    id: 2,
    books: [
      {
        title: "DROIT CONSTITUTIONNEL",
        author: "Pr. A. DIALLO",
        category: "Droit",
        coverBg: "bg-[#FDFCFA]",
        titleColor: "text-[#1B2A4E]",
        spineBg: "bg-[#E8E4DC]",
      },
      {
        title: "MANAGEMENT STRATÉGIQUE",
        author: "Dr. S. DIABY",
        category: "Gestion",
        coverBg: "bg-[#0F1A33]",
        titleColor: "text-[#C9A85E]",
        spineBg: "bg-[#1B2A4E]",
      },
      {
        title: "FINANCE D'ENTREPRISE",
        author: "Pr. J. KOUADIO",
        category: "Finance",
        coverBg: "bg-[#F5F3EF]",
        titleColor: "text-[#8A6D2F]",
        spineBg: "bg-[#E8E4DC]",
      },
    ],
  },
  {
    id: 3,
    books: [
      {
        title: "INTRODUCTION AU DROIT",
        author: "Dr. L. BADO",
        category: "Droit",
        coverBg: "bg-[#1B2A4E]",
        titleColor: "text-[#C9A85E]",
        spineBg: "bg-[#0F1A33]",
      },
      {
        title: "MARKETING DIGITAL",
        author: "Mme A. KOFFI",
        category: "Marketing",
        coverBg: "bg-[#B08D42]",
        titleColor: "text-[#FDFCFA]",
        spineBg: "bg-[#8A6D2F]",
      },
      {
        title: "GÉOPOLITIQUE AFRICAINE",
        author: "Pr. O. SOW",
        category: "Histoire",
        coverBg: "bg-[#4A7A5C]",
        titleColor: "text-[#FDFCFA]",
        spineBg: "bg-[#34533F]",
      },
    ],
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-lg aspect-square flex flex-col items-center justify-center">
      {/* Background Glow */}
      <div className="w-[120%] h-[120%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 bg-gradient-to-tr from-gold-light to-transparent rounded-full blur-3xl -z-10" />

      {/* Main Slide Area */}
      <div className="relative w-full h-[85%] flex items-end justify-center pb-8 overflow-visible">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="relative flex items-end justify-center w-full h-full"
          >
            {/* The 3D Circular Pedestal */}
            <div className="absolute bottom-0 w-[90%] md:w-[100%] h-20 bg-neutral-warm-100 dark:bg-navy-light rounded-[100%] shadow-[0_15px_30px_rgba(27,42,78,0.12)] border border-neutral-warm-200/50 flex items-center justify-center transform translate-y-6">
              {/* Inner pedestal ring for 3D depth */}
              <div className="w-[96%] h-[85%] rounded-[100%] bg-neutral-warm-50 dark:bg-navy border border-neutral-warm-200/20 shadow-inner" />
            </div>

            {/* Simulated 3D Books Stand */}
            <div className="relative z-10 flex items-end justify-center gap-2 md:gap-4 px-4 pb-2">
              {slidesData[currentSlide].books.map((book, index) => {
                // Style calculation for 3D book cover offset/rotations
                const rotation = index === 0 ? "-rotate-6 -translate-y-2 z-20" : index === 1 ? "z-30 translate-y-0 scale-105" : "rotate-6 -translate-y-2 z-10";

                return (
                  <motion.div
                    key={book.title}
                    whileHover={{ y: -8, scale: 1.08 }}
                    className={`relative w-28 md:w-36 aspect-[2/3] rounded-sm shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden ${book.coverBg} ${rotation} border-l-4 border-black/20 flex flex-col justify-between p-3 text-center`}
                    style={{
                      transformStyle: "preserve-3d",
                      perspective: "500px",
                    }}
                  >
                    {/* Golden Tree Logo Silhouette (stylized) */}
                    <div className="mx-auto mt-2 opacity-80 text-gold-light">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C11.5 4 9 6 9 9c0 1.66 1.34 3 3 3s3-1.34 3-3c0-3-2.5-5-3-7zm0 10c-2.21 0-4 1.79-4 4v5h8v-5c0-2.21-1.79-4-4-4zm0 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
                      </svg>
                    </div>

                    {/* Book Metadata */}
                    <div className="flex-grow flex flex-col items-center justify-center px-1">
                      <span className={`text-[8px] font-semibold uppercase tracking-widest ${book.titleColor} opacity-75 mb-1`}>
                        {book.category}
                      </span>
                      <h4 className={`font-headline-sm text-[10px] md:text-[11px] leading-tight font-bold tracking-wide ${book.titleColor} line-clamp-3`}>
                        {book.title}
                      </h4>
                    </div>

                    <div className="mt-auto">
                      <span className={`block text-[7px] font-medium tracking-wider ${book.titleColor} opacity-80`}>
                        {book.author}
                      </span>
                    </div>

                    {/* Left shadow effect to simulate pages/spine 3D */}
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-black/30 to-transparent" />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Navigation Dots */}
      <div className="flex justify-center items-center gap-3 mt-4 z-20">
        {slidesData.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? "bg-gold scale-125"
                : "bg-neutral-warm-200 hover:bg-neutral-warm-500 dark:bg-navy-light"
            }`}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
