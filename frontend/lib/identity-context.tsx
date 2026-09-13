"use client";

/**
 * IdentityContext — shared Shell identity data (hero name, level, rank,
 * coins, streak, active quest count) consumed by child pages so they
 * don't need to re-fetch the same /quests/today endpoint for identity info.
 *
 * Populated once by Shell.refreshIdentity(); children read via useIdentity().
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface Identity {
  heroName: string;
  heroAssetId?: string | null;
  avatarAssetId?: string | null;
  frameAsset?: string | null;
  level: number;
  rank: string;
  coins: number;
  active: number;
  streak: number;
}

interface IdentityValue extends Identity {
  setIdentity: (id: Identity) => void;
}

const IdentityCtx = createContext<IdentityValue>({
  heroName: "Aki",
  level: 1,
  rank: "Drifter",
  coins: 0,
  active: 0,
  streak: 0,
  setIdentity: () => undefined,
});

export function useIdentity() {
  return useContext(IdentityCtx);
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, _setIdentity] = useState<Identity>({
    heroName: "Aki",
    level: 1,
    rank: "Drifter",
    coins: 0,
    active: 0,
    streak: 0,
  });

  const setIdentity = useCallback((id: Identity) => _setIdentity(id), []);

  return (
    <IdentityCtx.Provider value={{ ...identity, setIdentity }}>
      {children}
    </IdentityCtx.Provider>
  );
}
