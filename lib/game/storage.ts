import AsyncStorage from "@react-native-async-storage/async-storage";

export type CareerProfile = {
  callsign: string;
  matches: number;
  wins: number;
  eliminations: number;
  bestPlacement: number;
  aimAssist: boolean;
  haptics: boolean;
};

const PROFILE_KEY = "shethil-career-v1";

export const defaultProfile: CareerProfile = {
  callsign: "SHE-01",
  matches: 0,
  wins: 0,
  eliminations: 0,
  bestPlacement: 7,
  aimAssist: true,
  haptics: true,
};

export async function loadProfile(): Promise<CareerProfile> {
  try {
    const stored = await AsyncStorage.getItem(PROFILE_KEY);
    return stored ? { ...defaultProfile, ...(JSON.parse(stored) as Partial<CareerProfile>) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

export async function saveProfile(profile: CareerProfile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function recordMatch(result: { won: boolean; eliminations: number; placement: number }) {
  const current = await loadProfile();
  const profile: CareerProfile = {
    ...current,
    matches: current.matches + 1,
    wins: current.wins + (result.won ? 1 : 0),
    eliminations: current.eliminations + result.eliminations,
    bestPlacement: Math.min(current.bestPlacement, result.placement),
  };
  await saveProfile(profile);
  return profile;
}
