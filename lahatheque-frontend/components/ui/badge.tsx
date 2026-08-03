import React from "react";

export function Badge({ children, ...props }: any) {
  return <span {...props}>{children}</span>;
}
