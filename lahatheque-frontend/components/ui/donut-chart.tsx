"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface DonutChartSegment {
  value: number;
  color: string; // CSS color string or var token ex: "var(--navy)"
  label: string;
  sublabel?: string;
  [key: string]: any;
}

interface DonutChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: DonutChartSegment[];
  totalValue?: number;
  size?: number;
  strokeWidth?: number;
  animationDuration?: number;
  animationDelayPerSegment?: number;
  highlightOnHover?: boolean;
  centerContent?: React.ReactNode;
  onSegmentHover?: (segment: DonutChartSegment | null) => void;
}

export const DonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>(
  (
    {
      data,
      totalValue: propTotalValue,
      size = 220,
      strokeWidth = 24,
      animationDuration = 1,
      animationDelayPerSegment = 0.05,
      highlightOnHover = true,
      centerContent,
      onSegmentHover,
      className,
      ...props
    },
    ref
  ) => {
    const [hoveredSegment, setHoveredSegment] = React.useState<DonutChartSegment | null>(null);

    const internalTotalValue = React.useMemo(
      () => propTotalValue || data.reduce((sum, segment) => sum + segment.value, 0),
      [data, propTotalValue]
    );

    const radius = size / 2 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercentage = 0;

    React.useEffect(() => {
      onSegmentHover?.(hoveredSegment);
    }, [hoveredSegment, onSegmentHover]);

    const handleMouseLeave = () => {
      setHoveredSegment(null);
    };

    return (
      <div
        ref={ref}
        className={cn("relative flex items-center justify-center select-none", className)}
        style={{ width: size, height: size }}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible -rotate-90"
        >
          {/* Subtle Background Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            className="opacity-40"
          />

          {/* Segments */}
          <AnimatePresence>
            {data.map((segment, index) => {
              if (segment.value <= 0) return null;

              const percentage = internalTotalValue === 0 ? 0 : (segment.value / internalTotalValue) * 100;
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = (cumulativePercentage / 100) * circumference;
              const isActive = hoveredSegment?.label === segment.label;

              cumulativePercentage += percentage;

              return (
                <motion.circle
                  key={segment.label || index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-strokeDashoffset}
                  strokeLinecap="round"
                  initial={{ opacity: 0, strokeDashoffset: circumference }}
                  animate={{
                    opacity: 1,
                    strokeDashoffset: -strokeDashoffset,
                  }}
                  transition={{
                    opacity: { duration: 0.3, delay: index * animationDelayPerSegment },
                    strokeDashoffset: {
                      duration: animationDuration,
                      delay: index * animationDelayPerSegment,
                      ease: "easeOut",
                    },
                  }}
                  className={cn(
                    "origin-center transition-all duration-200 cursor-pointer",
                    highlightOnHover && "hover:opacity-90"
                  )}
                  style={{
                    filter: isActive ? `drop-shadow(0px 2px 8px var(--navy-hover))` : "none",
                    transform: isActive ? "scale(1.04)" : "scale(1)",
                    transition: "filter 0.2s ease-out, transform 0.2s ease-out",
                  }}
                  onMouseEnter={() => setHoveredSegment(segment)}
                />
              );
            })}
          </AnimatePresence>
        </svg>

        {/* Center Content */}
        {centerContent && (
          <div
            className="absolute flex flex-col items-center justify-center text-center pointer-events-none p-2"
            style={{
              width: size - strokeWidth * 2.4,
              height: size - strokeWidth * 2.4,
            }}
          >
            {centerContent}
          </div>
        )}
      </div>
    );
  }
);

DonutChart.displayName = "DonutChart";
