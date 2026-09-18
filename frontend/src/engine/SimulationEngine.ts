import { SimulationConfig, SimulationState, InjectedEvent } from "./types";
import { SimulationMachine } from "./Machine";
import { SimulationQueue } from "./Queue";
import { DeterministicRandom } from "./utils";

export class SimulationEngine {
  private timeSec: number = 0;
  private rng: DeterministicRandom;
  
  private machines: SimulationMachine[] = [];
  private queues: SimulationQueue[] = [];
  
  private eventsLog: string[] = [];
  private inputRateAccumulator: number = 0;
  private config: SimulationConfig;

  constructor(config: SimulationConfig) {
    this.config = config;
    this.rng = new DeterministicRandom(config.randomSeed || 42);
    
    this.initialize();
  }

  private initialize(): void {
    // Create machines
    for (const stageConfig of this.config.stages) {
      this.machines.push(new SimulationMachine(stageConfig));
    }

    // Create queues between stages
    // Including an input queue for the first stage
    if (this.machines.length > 0) {
      // Input queue (infinite capacity, or very large)
      this.queues.push(new SimulationQueue(
        "q-input", 
        "INPUT", 
        this.machines[0].config.id, 
        999999
      ));

      for (let i = 0; i < this.machines.length - 1; i++) {
        const source = this.machines[i];
        const target = this.machines[i+1];
        this.queues.push(new SimulationQueue(
          `q-${source.config.id}-${target.config.id}`,
          source.config.id,
          target.config.id,
          source.config.queueCapacity
        ));
      }
    }
  }

  private log(msg: string) {
    const timeStr = new Date(this.timeSec * 1000).toISOString().substr(11, 8);
    this.eventsLog.push(`${timeStr} - ${msg}`);
  }

  public injectEvent(event: InjectedEvent) {
    const machine = this.machines.find(m => m.config.id === event.targetStage);
    if (machine) {
      machine.applyEvent(event);
      this.log(`Injected event ${event.type} at ${machine.config.name}`);
    }
  }

  public tick(): void {
    this.timeSec += 1;

    // 1. Generate new inputs based on arrival rate (units per hour)
    const arrivalPerSec = this.config.arrivalRatePerHour / 3600;
    this.inputRateAccumulator += arrivalPerSec;
    if (this.inputRateAccumulator >= 1) {
      const unitsToAdd = Math.floor(this.inputRateAccumulator);
      this.inputRateAccumulator -= unitsToAdd;
      if (this.queues.length > 0) {
        this.queues[0].add(unitsToAdd);
      }
    }

    // 2. Tick machines
    for (let i = 0; i < this.machines.length; i++) {
      const upstreamQueue = i === 0 ? this.queues[0] : this.queues[i];
      const downstreamQueue = i < this.machines.length - 1 ? this.queues[i + 1] : null;
      
      this.machines[i].tick(upstreamQueue, downstreamQueue, this.rng, (msg) => this.log(msg));
    }

    // 3. Tick queues (metrics)
    for (const queue of this.queues) {
      queue.tick();
    }
  }

  public getState(): SimulationState {
    const machineStates: Record<string, ReturnType<typeof this.machines[0]['getSnapshot']>> = {};
    for (const m of this.machines) {
      machineStates[m.config.id] = m.getSnapshot(this.timeSec);
    }

    const queueStates: Record<string, ReturnType<typeof this.queues[0]['getSnapshot']>> = {};
    for (const q of this.queues) {
      queueStates[q.id] = q.getSnapshot();
    }

    const totalCompleted = this.machines.length > 0 ? this.machines[this.machines.length - 1].processedCount : 0;
    const throughputPerHour = this.timeSec > 0 ? (totalCompleted / this.timeSec) * 3600 : 0;

    return {
      timeSec: this.timeSec,
      totalCompleted,
      throughputPerHour,
      machines: machineStates,
      queues: queueStates,
      bottleneck: null, // to be populated by BottleneckAnalyzer
      eventsLog: [...this.eventsLog]
    };
  }
}
