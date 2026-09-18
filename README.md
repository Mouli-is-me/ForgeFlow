# SI-02 — Production Line Digital Twin & Bottleneck Intelligence

## Problem Statement
"Manufacturing lines consist of multiple interconnected stages. A delay or capacity limitation at one stage can propagate through the rest of the line and reduce overall throughput. Build a digital-twin prototype representing a multi-stage manufacturing line and use it to understand operational behaviour."

## Solution
This project provides a deterministic, browser-based discrete event simulation engine that models an interconnected multi-stage production line. It acts as a Digital Twin for exploring throughput losses, queue buildup, starvation, and bottlenecks. 

## Key Features
- **Production line digital twin**: Configurable stages and buffer queues representing a factory.
- **Discrete-event simulation**: A custom deterministic engine executing state changes tick-by-tick.
- **Bottleneck intelligence**: Multi-factor algorithm utilizing queue pressure, utilization, and downtime to mathematically identify constraints.
- **What-if scenario analysis**: Safe, reproducible parallel simulation testing for engineering interventions.
- **Scenario comparison**: Baseline vs Scenario throughput and metrics evaluated automatically.

### Optional AI Assistance
The What-If Lab includes an optional natural-language interface that converts user descriptions into validated simulation scenarios. AI does not calculate production results or determine bottlenecks. All numerical results are produced by the deterministic simulation engine.

## System Architecture

```text
                    USER
                     |
          +----------+----------+
          |                     |
     Manual Input          Natural Language
          |                     |
          |                    AI
          |                     |
          +----------+----------+
                     |
             Scenario Object
                     |
                 Validation
                     |
          Deterministic Engine
                     |
                  Metrics
                     |
          Bottleneck Analysis
                     |
             Scenario Compare
                     |
                  Results
```

## How the Simulation Works
The simulation executes locally within the browser. 
1. **Machines** process units at defined rates.
2. **Queues** sit between machines, acting as buffers. 
3. If a queue fills up, the upstream machine becomes `BLOCKED`.
4. If a queue empties, the downstream machine becomes `STARVED`.
5. Events (such as random breakdowns based on a deterministic seed) disrupt production flow.

## Bottleneck Intelligence
Bottlenecks are identified deterministically. The `BottleneckAnalyzer` ranks stages based on true utilization limits, queue starvation down-line, and blocking effects.

## Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand.
- **AI Provider (Optional)**: Configurable for Ollama (Local) via standard fetch API.
- **Testing**: Vitest for robust unit testing of deterministic behaviors.

## Project Structure
```text
src/
├── components/
│   ├── common/
│   ├── layout/
│   └── simulation/
├── engine/ (Core Simulation Engine)
├── ai/     (Optional Natural Language Parser)
│   ├── prompts/
│   ├── provider/
│   ├── scenario/
│   └── validation/
├── pages/
├── store/
└── types/
```

## Installation

```bash
cd frontend
npm install
```

## Running the Application

```bash
npm run dev
```

## Running Tests

```bash
npm test
```

## AI Setup (Optional)
This project uses a flexible AI provider abstraction that defaults to a local Ollama instance for the optional What-If shortcut.

1. Install Ollama locally (https://ollama.com).
2. Start the Ollama service and pull a model (e.g., `llama3.1`).
   ```bash
   ollama pull llama3.1
   ```
3. Ensure your Ollama instance accepts CORS requests from your Vite server port.

## Validation / Testing
Unit tests verify:
- Deterministic simulation parity (same seed = identical results).
- Breakdown events appropriately disrupt identical seeds when parameters change.
- Manual vs AI consistency ensures both avenues produce the same Scenario Object.

## Development Progress
- [x] Production line modeling
- [x] Machine/queue models
- [x] Deterministic simulation
- [x] Event processing
- [x] Metrics & Bottleneck analysis
- [x] What-If Lab & Scenario comparison
- [x] Light/Dark industrial theme
- [x] Optional AI scenario parsing

## Development History
This project was developed iteratively for SI-02:
1. **Core Engine**: Initial architecture focused on translating a generic node-graph into a strict discrete-event simulation.
2. **Zustand & Visualization**: Decoupled the high-frequency tick loop from React rendering to support massive multi-hour runs instantaneously.
3. **What-If Lab**: Built isolated scenario testing to support engineering decisions (Manual-first).
4. **Theme System**: Implemented a responsive Light/Dark industrial aesthetic.
5. **AI Integration**: Layered the LLM cleanly as an optional parser over the deterministic engine, explicitly ensuring numerical validity and separating it from core calculations.

## Problem Statement Alignment
- **Digital representation of production line**: Configurable stages and interconnecting buffer queues.
- **Simulation of production behavior**: Discrete-event ticking engine.
- **Bottleneck identification**: Multi-factor deterministic logic.
- **Production performance analysis**: Analytics and live KPIs.
- **What-if experimentation**: Manual scenario configuration with strict comparison logic.
- **Decision support**: Optional AI explanation of the simulation output.

## Limitations
- Prototype-level production model (fixed linear flow).

## Future Work
- Real IIoT data integration for live production synchronization.
- Complex graph topologies (splits, merges) for the production line.
- Advanced failure distributions (Weibull) instead of simple uniform probabilities.
