"use client";
import { useEffect, useRef, useState } from "react";

const CURSOR_SIZE = 25;

export const CustomCursor = ({ children }: { children: React.ReactNode }) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    const onMove = (e: MouseEvent) => {
      // Move the cursor via a ref + rAF so pointer movement never triggers a
      // React re-render of the wrapped app subtree.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = cursorRef.current;
        if (el) {
          const offset = CURSOR_SIZE / 2;
          el.style.transform = `translate(${e.pageX - offset}px, ${e.pageY - offset}px)`;
        }
      });
    };
    const show = () => setIsVisible(true);
    const hide = () => setIsVisible(false);

    window.addEventListener("mousemove", onMove);
    document.body.addEventListener("mouseover", show);
    document.body.addEventListener("mouseout", hide);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
      document.body.removeEventListener("mouseover", show);
      document.body.removeEventListener("mouseout", hide);
    };
  }, []);

  return (
    <div className="custom-cursor-container">
      <div
        ref={cursorRef}
        aria-hidden="true"
        className={`custom-cursor drop-shadow-glow pointer-events-none absolute left-0 top-0 h-[25px] w-[25px] rounded-full bg-zinc-300 mix-blend-difference ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />
      {children}
    </div>
  );
};
