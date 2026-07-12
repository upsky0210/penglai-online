import { performance } from "node:perf_hooks";
import type { SaveGameInput, SavedGame } from "./persistence.js";

interface PendingPlayerSave {
  saveSlot: string;
  data: SaveGameInput;
  firstQueuedAt: number;
  attempts: number;
  lastAttemptAt?: number;
}

interface SaveSnapshot {
  saveSlot: string;
  data: SaveGameInput;
}

export interface SaveCoordinatorOptions {
  createSnapshot: (playerId: string) => SaveSnapshot | undefined;
  persist: (saveSlot: string, data: SaveGameInput) => void;
  simulatedFailureSlotPrefix?: string;
  logger?: Pick<Console, "error">;
}

export interface SaveFlushMetrics {
  attempts: number;
  successes: number;
  failures: number;
  lastSuccessAt: number;
  lastFailureAt: number;
  durationSamples: number;
  totalDurationMs: number;
  averageDurationMs: number;
  maxDurationMs: number;
  lastDurationMs: number;
  queued: number;
  oldestQueuedMs: number;
}

export class SaveCoordinator {
  private readonly pending = new Map<string, PendingPlayerSave>();
  private readonly simulatedFailures = new Set<string>();
  private readonly logger: Pick<Console, "error">;
  private readonly stats = {
    attempts: 0,
    successes: 0,
    failures: 0,
    lastSuccessAt: 0,
    lastFailureAt: 0,
    durationSamples: 0,
    totalDurationMs: 0,
    maxDurationMs: 0,
    lastDurationMs: 0
  };

  constructor(private readonly options: SaveCoordinatorOptions) {
    this.logger = options.logger ?? console;
  }

  queuePlayer(playerId: string) {
    const snapshot = this.options.createSnapshot(playerId);
    if (!snapshot) {
      return undefined;
    }

    const existing = this.pending.get(snapshot.saveSlot);
    this.pending.set(snapshot.saveSlot, {
      saveSlot: snapshot.saveSlot,
      data: snapshot.data,
      firstQueuedAt: existing?.firstQueuedAt ?? Date.now(),
      attempts: existing?.attempts ?? 0,
      lastAttemptAt: existing?.lastAttemptAt
    });
    return snapshot.saveSlot;
  }

  flushPlayer(playerId: string) {
    const saveSlot = this.queuePlayer(playerId);
    return saveSlot ? this.flushSaveSlot(saveSlot) : false;
  }

  flushDirty() {
    let failures = 0;
    for (const saveSlot of [...this.pending.keys()]) {
      try {
        this.flushSaveSlot(saveSlot);
      } catch (error) {
        failures += 1;
        this.logger.error(`Failed to flush save slot ${saveSlot}`, error);
      }
    }
    return failures;
  }

  getPendingSavedGame(saveSlot: string): SavedGame | undefined {
    const data = this.pending.get(saveSlot)?.data;
    if (!data) {
      return undefined;
    }

    return {
      character: {
        name: data.player.name,
        className: data.player.className,
        identityLocked: data.identityLocked,
        level: data.player.level,
        exp: data.player.exp,
        expToNext: data.player.expToNext,
        gold: data.player.gold,
        hp: data.player.hp,
        mp: data.player.mp,
        mapId: data.player.mapId,
        x: data.player.x,
        y: data.player.y,
        facing: data.player.facing
      },
      inventory: data.inventory.map((slot) => ({ ...slot })),
      equipment: { ...data.equipment },
      quests: data.quests.map((quest) => ({
        questId: quest.id,
        status: quest.status,
        progress: quest.progress,
        interactedTargetIds: [...(quest.interactedTargetIds ?? [])]
      }))
    };
  }

  getMetrics(): SaveFlushMetrics {
    return {
      ...this.stats,
      averageDurationMs: this.stats.durationSamples > 0
        ? this.stats.totalDurationMs / this.stats.durationSamples
        : 0,
      queued: this.pending.size,
      oldestQueuedMs: this.getOldestPendingAge()
    };
  }

  private flushSaveSlot(saveSlot: string) {
    const pending = this.pending.get(saveSlot);
    if (!pending) {
      return true;
    }

    pending.attempts += 1;
    pending.lastAttemptAt = Date.now();
    this.stats.attempts += 1;
    const startedAt = performance.now();

    try {
      const failurePrefix = this.options.simulatedFailureSlotPrefix;
      if (failurePrefix && saveSlot.startsWith(failurePrefix) && !this.simulatedFailures.has(saveSlot)) {
        this.simulatedFailures.add(saveSlot);
        throw new Error("Simulated one-time save failure for reliability smoke");
      }
      this.options.persist(saveSlot, pending.data);
      if (this.pending.get(saveSlot) === pending) {
        this.pending.delete(saveSlot);
      }
      this.stats.successes += 1;
      this.stats.lastSuccessAt = Date.now();
      return true;
    } catch (error) {
      this.stats.failures += 1;
      this.stats.lastFailureAt = Date.now();
      throw error;
    } finally {
      const durationMs = performance.now() - startedAt;
      this.stats.durationSamples += 1;
      this.stats.totalDurationMs += durationMs;
      this.stats.maxDurationMs = Math.max(this.stats.maxDurationMs, durationMs);
      this.stats.lastDurationMs = durationMs;
    }
  }

  private getOldestPendingAge() {
    if (this.pending.size === 0) {
      return 0;
    }
    const oldestQueuedAt = Math.min(...[...this.pending.values()].map((pending) => pending.firstQueuedAt));
    return Date.now() - oldestQueuedAt;
  }
}
