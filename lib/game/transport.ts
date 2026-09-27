import { advanceMatch, createMatch, type MatchState, type Vector } from "@/lib/game/engine";

/**
 * Rendering only depends on this transport boundary. Replace LocalTrainingTransport
 * with an authoritative websocket adapter when a persistent realtime backend exists.
 */
export interface MatchTransport {
  createSession(seed?: number): MatchState;
  submitMovement(state: MatchState, input: Vector, deltaSeconds: number): MatchState;
}

export const LocalTrainingTransport: MatchTransport = {
  createSession: (seed) => createMatch(seed),
  submitMovement: (state, input, deltaSeconds) => advanceMatch(state, input, deltaSeconds),
};
