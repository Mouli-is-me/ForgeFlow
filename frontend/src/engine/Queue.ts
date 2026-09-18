import { QueueSnapshot } from "./types";

export class SimulationQueue {
  public id: string;
  public sourceId: string;
  public targetId: string;
  public maxCapacity: number;
  
  public currentUnits: number = 0;
  
  // Metrics
  public maxObserved: number = 0;
  private totalObserved: number = 0;
  private observations: number = 0;

  constructor(id: string, sourceId: string, targetId: string, maxCapacity: number) {
    this.id = id;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.maxCapacity = maxCapacity;
  }

  public canAdd(amount: number = 1): boolean {
    return this.currentUnits + amount <= this.maxCapacity;
  }

  public canTake(amount: number = 1): boolean {
    return this.currentUnits >= amount;
  }

  public add(amount: number = 1): void {
    if (this.canAdd(amount)) {
      this.currentUnits += amount;
      if (this.currentUnits > this.maxObserved) {
        this.maxObserved = this.currentUnits;
      }
    }
  }

  public take(amount: number = 1): void {
    if (this.canTake(amount)) {
      this.currentUnits -= amount;
    }
  }

  public tick(): void {
    this.totalObserved += this.currentUnits;
    this.observations += 1;
  }

  public getSnapshot(): QueueSnapshot {
    return {
      id: this.id,
      sourceId: this.sourceId,
      targetId: this.targetId,
      currentUnits: this.currentUnits,
      maxCapacity: this.maxCapacity,
      maxObserved: this.maxObserved,
      averageObserved: this.observations > 0 ? this.totalObserved / this.observations : 0
    };
  }
}
