"use client";
import { createContext, useContext, useState, type ReactNode } from "react";

export type ParticleTheme = "medtronic" | "raytheon" | null;

const ParticleThemeContext = createContext<{
  theme: ParticleTheme;
  setTheme: (theme: ParticleTheme) => void;
}>({ theme: null, setTheme: () => undefined });

/**
 * Lets experience cards (in the right column) tell the particle display (in the
 * left column) to morph through company-themed shapes on hover/focus.
 */
export function ParticleThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ParticleTheme>(null);
  return (
    <ParticleThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ParticleThemeContext.Provider>
  );
}

export const useParticleTheme = () => useContext(ParticleThemeContext);

/** Maps a company name to its particle theme (null = no themed shapes). */
export function themeForCompany(company: string): ParticleTheme {
  if (company === "Medtronic") return "medtronic";
  if (company === "Raytheon") return "raytheon";
  return null;
}
