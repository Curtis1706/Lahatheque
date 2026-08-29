"use client";

import React from "react";
import { useResponsive, ResponsiveProp } from "@/components/ui/use-responsive";
import clsx from "clsx";

const DefaultIllustration = (
  <svg fill="none" height="56" viewBox="0 0 36 56" width="36" xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M3.03113 28.0005C6.26017 23.1765 11.7592 20.0005 18 20.0005C24.2409 20.0005 29.7399 23.1765 32.9689 28.0005C29.7399 32.8244 24.2409 36.0005 18 36.0005C11.7592 36.0005 6.26017 32.8244 3.03113 28.0005Z"
      fill="currentColor"
      className="text-navy"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M32.9691 28.0012C34.8835 25.1411 36 21.7017 36 18.0015C36 8.06034 27.9411 0.00146484 18 0.00146484C8.05887 0.00146484 0 8.06034 0 18.0015C0 21.7017 1.11648 25.1411 3.03094 28.0012C6.25996 23.1771 11.7591 20.001 18 20.001C24.2409 20.001 29.74 23.1771 32.9691 28.0012Z"
      fill="currentColor"
      className="text-gold"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M32.9692 28.0005C29.7402 32.8247 24.241 36.001 18 36.001C11.759 36.001 6.25977 32.8247 3.03077 28.0005C1.11642 30.8606 0 34.2999 0 38C0 47.9411 8.05887 56 18 56C27.9411 56 36 47.9411 36 38C36 34.2999 34.8836 30.8606 32.9692 28.0005Z"
      fill="currentColor"
      className="text-navy-hover"
      fillRule="evenodd"
    />
  </svg>
);

export interface BookProps {
  title: string;
  author?: string;
  variant?: "simple" | "stripe" | "classic" | "lahatheque";
  width?: number | ResponsiveProp<number>;
  color?: string;
  textColor?: string;
  illustration?: React.ReactNode;
  textured?: boolean;
}

export const Book = ({
  title,
  author,
  variant = "lahatheque",
  width = 196,
  color,
  textColor,
  illustration,
  textured = true
}: BookProps) => {
  const _width = useResponsive(width) ?? (typeof width === "number" ? width : 196);
  const _color = color ? color : "var(--navy)";
  const _textColor = textColor ? textColor : "var(--gold)";

  if (variant === "lahatheque" || variant === "classic") {
    return (
      <div className="inline-block w-fit group" style={{ perspective: 1000 }}>
        <div
          className="aspect-[2/3] relative rotate-0 duration-300 book-rotate rounded-r-md rounded-l-sm shadow-2xl overflow-hidden flex flex-col justify-between p-4 text-center border-l-4 border-black/25"
          style={{
            width: _width,
            backgroundColor: _color,
            color: _textColor,
            boxShadow: "0 15px 35px -5px rgba(0,0,0,0.3), inset 2px 0 4px rgba(255,255,255,0.15)"
          }}
        >
          {/* Subtle leather/paper texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
          
          {/* Spine crease simulation */}
          <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />

          {/* Book Header / Title */}
          <div className="relative z-10 pt-2 px-1">
            <h4 className="font-serif font-bold text-[11px] sm:text-[12px] leading-snug tracking-wide uppercase line-clamp-3 mb-1" style={{ color: _textColor }}>
              {title}
            </h4>
            {author && (
              <p className="text-[8px] opacity-75 font-sans font-medium uppercase tracking-wider" style={{ color: _textColor }}>
                {author}
              </p>
            )}
          </div>

          {/* Golden Tree Logo Silhouette & Brand */}
          <div className="relative z-10 pb-1 flex flex-col items-center">
            <svg className="w-5 h-5 mb-1 fill-current opacity-85" viewBox="0 0 24 24" style={{ color: _textColor }}>
              <path d="M12 2C11.5 4 9 6 9 9c0 1.66 1.34 3 3 3s3-1.34 3-3c0-3-2.5-5-3-7zm0 10c-2.21 0-4 1.79-4 4v5h8v-5c0-2.21-1.79-4-4-4zm0 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
            </svg>
            <span className="text-[7px] font-serif font-bold tracking-widest uppercase opacity-90" style={{ color: _textColor }}>
              LAHATHÈQUE
            </span>
          </div>

          {/* 3D Pages Thickness on the right */}
          <div
            className="absolute -right-3 top-1 bottom-1 w-3 bg-gradient-to-r from-[#e6e2d8] to-[#f7f5ef] rounded-r-xs border-r border-[#d4cebe] shadow-inner transform rotate-y-90 origin-left pointer-events-none"
            style={{ transform: "rotateY(-90deg) translateX(100%)" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="inline-block w-fit" style={{ perspective: 900 }}>
      <div
        className="aspect-[49/60] w-fit relative rotate-0 duration-[250ms] book-rotate"
        style={{ transformStyle: "preserve-3d", minWidth: _width, containerType: "inline-size" }}
      >
        <div
          className="flex flex-col h-full rounded-l-md rounded-r overflow-hidden bg-background-200 shadow-book translate-x-0 relative after:absolute after:border after:border-gray-alpha-400 after:w-full after:h-full after:shadow-book-border after:rounded-l-md after:rounded-r"
          style={{ width: _width }}
        >
          <div
            className={clsx(
              "w-full relative overflow-hidden",
              variant === "stripe" && "flex-1"
            )}
            style={{ background: _color }}
          >
            {variant === "stripe" && (
              <div className="absolute h-full w-full opacity-60 flex items-center justify-center">
                {illustration || DefaultIllustration}
              </div>
            )}
            <div className="absolute h-full w-[8.2%] mix-blend-overlay" style={{ background: "var(--ds-book-bind)" }} />
          </div>
          <div
            className={clsx(
              "relative flex-1",
              (variant === "stripe" || (variant === "simple" && color === undefined)) && "bg-book-gradient"
            )}
            style={{ background: variant === "simple" && color !== undefined ? _color : undefined }}
          >
            <div className="absolute h-full w-[8.2%] opacity-20" style={{ background: "var(--ds-book-bind)" }} />
            <div
              className={clsx(
                "flex flex-col w-full h-full p-[6.1%] pl-[14.3%]",
                variant === "simple" ? "gap-4" : "justify-between"
              )}
              style={{ containerType: "inline-size", gap: `calc((24px / 196) * ${_width})` }}
            >
              <span
                className={clsx(
                  "leading-[1.25em] tracking-[-.02em] text-balance font-semibold",
                  variant === "simple" ? "text-[12cqw]" : "text-[10.5cqw]"
                )}
                style={{ color: textColor || "var(--ds-gray-1000)" }}
              >
                {title}
              </span>
              {variant === "stripe" ? (
                <svg className="scale-75 -ml-1 -mb-1" height="24" width="24" style={{ fill: textColor || "var(--ds-gray-1000)" }}>
                  <path d="M21,21H3L12,3Z" />
                </svg>
              ) : (illustration || DefaultIllustration)}
            </div>
          </div>
          {textured && (
            <div
              className="absolute top-0 left-0 inset-0 rotate-180 rounded-l-md rounded-r mix-blend-hard-light pointer-events-none bg-cover bg-no-repeat opacity-50 brightness-110 bg-[url('https://assets.vercel.com/image/upload/v1720554484/front/design/book-texture.avif')]" />
          )}
        </div>

        <div
          className="h-[calc(100%_-_2_*_3px)] w-[calc(29cqw_-_2px)] absolute top-[3px]"
          style={{
            background: "linear-gradient(90deg, var(--border), transparent 70%), linear-gradient(var(--background), var(--background-secondary))",
            transform: `translateX(calc(${_width} * 1px - 29cqw / 2 - 3px)) rotateY(90deg) translateX(calc(29cqw / 2))`
          }}
        />
        <div
          className="bg-gray-200 absolute left-0 top-0 rounded-l-md rounded-r h-full"
          style={{ width: _width, transform: "translateZ(calc(-1 * 29cqw))" }}
        />
      </div>
    </div>
  );
};
