"use client";
import { useEffect, useState } from "react";

/**
 * Temporary on-device diagnostic. Renders a small readout ONLY when the URL has
 * `?debug` (e.g. rounsifer.github.io/?debug=1), so the real site stays clean.
 * Used to see why the WebGL particle field isn't appearing on a specific phone.
 */
export function WebGLDebug() {
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!window.location.search.includes("debug")) return;
    const lines: string[] = [];
    try {
      const c = document.createElement("canvas");
      const gl2 = c.getContext("webgl2");
      const gl = gl2 ?? c.getContext("webgl");
      lines.push(`webgl2: ${gl2 ? "YES" : "no"}`);
      lines.push(`webgl1: ${gl ? "yes" : "NO"}`);
      if (gl) {
        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        lines.push(
          `gpu: ${dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "(masked)"}`,
        );
      }
      const cv = document.querySelector("canvas");
      const r = cv?.getBoundingClientRect();
      lines.push(
        `pageCanvas: ${cv ? `${Math.round(r!.width)}x${Math.round(r!.height)}` : "MISSING"}`,
      );
      lines.push(`dpr: ${window.devicePixelRatio} | w: ${window.innerWidth}`);
      lines.push(
        `reduceMotion: ${window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "ON" : "off"}`,
      );
      lines.push(`ua: ${navigator.userAgent}`);
    } catch (e) {
      lines.push(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time debug readout
    setInfo(lines.join("\n"));

    const onErr = (e: ErrorEvent) =>
      setInfo((p) => `${p ?? ""}\nJS ERR: ${e.message}`);
    window.addEventListener("error", onErr);
    return () => window.removeEventListener("error", onErr);
  }, []);

  if (info === null) return null;
  return (
    <pre
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 99999,
        margin: 0,
        padding: "8px",
        maxWidth: "100vw",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        background: "rgba(0,0,0,0.9)",
        color: "#3f3",
        font: "11px/1.4 monospace",
      }}
    >
      {info}
    </pre>
  );
}
