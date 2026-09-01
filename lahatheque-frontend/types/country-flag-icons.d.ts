declare module "country-flag-icons/react/3x2" {
  import type React from "react";
  const flags: Record<string, React.ComponentType<{ title?: string; className?: string }>>;
  export = flags;
}
