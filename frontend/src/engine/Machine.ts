import {
  StageConfig,
  MachineState,
  MachineSnapshot,
  InjectedEvent,
} from "./types";
import { SimulationQueue } from "./Queue";
import { DeterministicRandom } from "./utils";

export class SimulationMachine {
  public config: StageConfig;
  public state: MachineState = "IDLE";

  public currentProcessingTimeRemaining: number = 0;
  public effectiveProcessingTimeSec: number = 0;

  public currentDowntimeLeft: number = 0;

  // Metrics
  public timeRunning: number = 0;
  public timeDown: number = 0;
  public timeIdle: number = 0;
  public timeStarved: number = 0;
  public timeBlocked: number = 0;
  public processedCount: number = 0;

  // Modifiers from events
  private slowdownMultiplier: number = 1.0;

  constructor(config: StageConfig) {
    this.config = { ...config };
    this.effectiveProcessingTimeSec = this.calculateProcessingTime();
  }

  private calculateProcessingTime(): number {
    const configuredCapacity = Math.max(
      1,
      this.config.capacity * Math.max(1, this.config.machineCount),
    );
    const capacityLimitedTime = 3600 / configuredCapacity;
    return Math.max(
      1,
      Math.ceil(
        Math.max(this.config.processingTimeSec, capacityLimitedTime) *
          this.slowdownMultiplier,
      ),
    );
  }

  public applyEvent(event: InjectedEvent): void {
    if (event.type === "BREAKDOWN") {
      this.currentDowntimeLeft = event.durationSec || 60;
      this.state = "DOWN";
    } else if (event.type === "RECOVERY") {
      this.currentDowntimeLeft = 0;
      this.state = "IDLE";
    } else if (event.type === "SLOWDOWN") {
      this.slowdownMultiplier = event.value || 1.5;
      this.effectiveProcessingTimeSec = this.calculateProcessingTime();
    } else if (event.type === "PROCESSING_TIME_CHANGE") {
      this.config.processingTimeSec =
        event.value || this.config.processingTimeSec;
      this.effectiveProcessingTimeSec = this.calculateProcessingTime();
    } else if (event.type === "CAPACITY_CHANGE") {
      this.config.capacity = event.value || this.config.capacity;
      this.effectiveProcessingTimeSec = this.calculateProcessingTime();
    }
  }

  public tick(
    upstreamQueue: SimulationQueue | null,
    downstreamQueue: SimulationQueue | null,
    rng: DeterministicRandom,
    onLog: (msg: string) => void,
  ): void {
    // 1. Check downtime
    if (this.currentDowntimeLeft > 0) {
      this.currentDowntimeLeft -= 1;
      this.state = "DOWN";
      this.timeDown += 1;
      if (this.currentDowntimeLeft <= 0) {
        onLog(`Stage ${this.config.name} recovered from downtime.`);
        this.state = "IDLE";
      }
      return;
    }

    // Attempt to push completed unit downstream
    if (this.currentProcessingTimeRemaining === 0 && this.state === "RUNNING") {
      if (downstreamQueue) {
        if (downstreamQueue.canAdd(1)) {
          downstreamQueue.add(1);
          this.processedCount += 1;
          this.state = "IDLE"; // default to idle, might immediately start next
        } else {
          this.state = "BLOCKED";
          this.timeBlocked += 1;
          return; // Can't do anything else until unblocked
        }
      } else {
        // Output stage (no downstream queue)
        this.processedCount += 1;
        this.state = "IDLE";
      }
    }

    // Try to start processing a new unit
    if (this.state === "IDLE" || this.state === "STARVED") {
      if (upstreamQueue) {
        if (upstreamQueue.canTake(1)) {
          upstreamQueue.take(1);
          this.state = "RUNNING";
          this.currentProcessingTimeRemaining = this.effectiveProcessingTimeSec;
        } else {
          this.state = "STARVED";
          this.timeStarved += 1;
          return;
        }
      } else {
        // Infinite input source?
        // We'll let the engine handle putting things into the very first queue,
        // so the first machine always has an upstream queue (the "Input Buffer").
        // If no upstream queue, just assume it always has input (for flexibility).
        this.state = "RUNNING";
        this.currentProcessingTimeRemaining = this.effectiveProcessingTimeSec;
      }
    }

    // Processing
    if (this.state === "RUNNING") {
      this.timeRunning += 1;
      this.currentProcessingTimeRemaining = Math.max(
        0,
        this.currentProcessingTimeRemaining - 1,
      );

      // Random failure check
      if (this.config.failureProbability > 0) {
        // Evaluate per tick proportionally or per unit?
        // "percentage per unit processed"
        // Let's check when processing is complete
        if (this.currentProcessingTimeRemaining === 0) {
          const roll = rng.next() * 100;
          if (roll < this.config.failureProbability) {
            this.currentDowntimeLeft = this.config.meanRecoveryTimeSec;
            onLog(
              `Stage ${this.config.name} suffered a breakdown (random failure).`,
            );
            this.state = "DOWN";
          }
        }
      }
    }
  }

  public getSnapshot(totalTimeSec: number): MachineSnapshot {
    let utilization = 0;
    if (totalTimeSec > 0) {
      utilization = this.timeRunning / totalTimeSec;
    }

    let progress = 0;
    if (this.state === "RUNNING" && this.effectiveProcessingTimeSec > 0) {
      progress =
        1 -
        this.currentProcessingTimeRemaining / this.effectiveProcessingTimeSec;
    } else if (this.state === "BLOCKED") {
      progress = 1.0;
    }

    return {
      id: this.config.id,
      name: this.config.name,
      state: this.state,
      processingProgress: progress,
      utilization,
      timeRunning: this.timeRunning,
      timeDown: this.timeDown,
      timeIdle: this.timeIdle,
      timeStarved: this.timeStarved,
      timeBlocked: this.timeBlocked,
      processedCount: this.processedCount,
      currentDowntimeLeft: this.currentDowntimeLeft,
    };
  }
}
