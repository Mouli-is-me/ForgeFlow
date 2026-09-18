export class DeterministicRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Returns a float between 0 and 1
  public next(): number {
    // LCG using glibc parameters
    this.seed = (this.seed * 1103515245 + 12345) % 2147483648;
    return this.seed / 2147483648;
  }
}
