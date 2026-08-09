import { useEffect, useState } from "react";

const BREAKPOINTS = {
  SM: 0,
  MD: 600,
  LG: 960,
  XL: 1200
};

export interface ResponsiveProp<T> {
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}

export const useResponsive = <T>(styles: T | ResponsiveProp<T>): T | undefined => {
  const getResponsive = (styles: any): T | undefined => {
    if (styles === null || styles === undefined) return undefined;
    if (typeof styles !== "object") return styles as T;

    if (typeof window === "undefined") {
      return (styles.sm ?? styles.md ?? styles.lg ?? styles.xl) as T;
    }

    let current: T | undefined = styles.sm;
    if (styles.md !== undefined && window.innerWidth >= BREAKPOINTS.MD) {
      current = styles.md;
    }
    if (styles.lg !== undefined && window.innerWidth >= BREAKPOINTS.LG) {
      current = styles.lg;
    }
    if (styles.xl !== undefined && window.innerWidth >= BREAKPOINTS.XL) {
      current = styles.xl;
    }
    return current;
  };

  const [responsiveStyles, setResponsiveStyles] = useState<T | undefined>(() => getResponsive(styles));

  useEffect(() => {
    const listener = () => {
      setResponsiveStyles(getResponsive(styles));
    };

    listener();

    window.addEventListener("resize", listener);

    return () => {
      window.removeEventListener("resize", listener);
    };
  }, [JSON.stringify(styles)]);

  return responsiveStyles;
};
