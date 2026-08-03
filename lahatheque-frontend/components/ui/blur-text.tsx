import React from "react";

export default function BlurText({ text, delay, animateBy, direction, className, ...props }: any) {
  return <span className={className} {...props}>{text}</span>;
}
