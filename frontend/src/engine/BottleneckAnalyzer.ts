import { SimulationState, BottleneckInfo } from "./types";

export class BottleneckAnalyzer {
  public static analyze(state: SimulationState): BottleneckInfo | null {
    const machines = Object.values(state.machines);
    if (machines.length === 0 || state.timeSec < 60) {
      return null; // Not enough data or no machines
    }

    let highestScore = -1;
    let bottleneckId = "";
    let bottleneckReasons: string[] = [];

    // Simple multi-factor bottleneck scoring
    for (const machine of machines) {
      let score = 0;
      const reasons: string[] = [];

      // 1. Utilization
      if (machine.utilization > 0.9) {
        score += 5;
        reasons.push(`High utilization (${(machine.utilization * 100).toFixed(1)}%)`);
      } else if (machine.utilization > 0.8) {
        score += 3;
      }

      // 2. Upstream queue pressure (if not the first machine, check the queue feeding it)
      const upstreamQueue = Object.values(state.queues).find(q => q.targetId === machine.id);
      if (upstreamQueue) {
        const fillRatio = upstreamQueue.currentUnits / upstreamQueue.maxCapacity;
        if (fillRatio > 0.8) {
          score += 4;
          reasons.push(`Persistent upstream queue buildup (${upstreamQueue.currentUnits} units)`);
        } else if (fillRatio > 0.5) {
          score += 2;
        }
      }

      // 3. Downstream impact (is it starving the next machine?)
      const downstreamQueue = Object.values(state.queues).find(q => q.sourceId === machine.id);
      if (downstreamQueue) {
        if (downstreamQueue.currentUnits === 0) {
          score += 3;
          reasons.push(`Effective output is limiting downstream (downstream starved)`);
        }
      }

      // 4. Downtime impact
      if (machine.state === "DOWN" || machine.timeDown > (state.timeSec * 0.2)) {
          score += 6;
          reasons.push(`Significant downtime impacting line throughput`);
      }

      if (score > highestScore) {
        highestScore = score;
        bottleneckId = machine.id;
        bottleneckReasons = reasons;
      }
    }

    if (bottleneckId && highestScore >= 3) {
      return {
        machineId: bottleneckId,
        confidence: highestScore > 10 ? "High" : (highestScore > 6 ? "Medium" : "Low"),
        reasons: bottleneckReasons.length > 0 ? bottleneckReasons : ["Consistently constraining flow"]
      };
    }

    return null;
  }
}
