import React from "react";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { useSimulationStore } from "../../store/useSimulationStore";

export const SimulationControls: React.FC = () => {
  const {
    isPlaying,
    speedMultiplier,
    state,
    play,
    pause,
    step,
    resetDemo,
    setSpeed,
  } = useSimulationStore();

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-industrial-panel p-4 rounded border border-industrial-border shadow-sm">
      <div className="flex flex-col min-w-[116px]">
        <span className="text-xs text-industrial-muted font-medium uppercase tracking-wider mb-1">
          Sim Time
        </span>
        <span className="text-xl font-mono text-industrial-text font-bold tracking-tight">
          {state ? formatTime(state.timeSec) : "00:00:00"}
        </span>
      </div>

      <div className="h-10 w-px bg-industrial-border hidden sm:block"></div>

      <div className="flex items-center gap-2">
        {!isPlaying ? (
          <button
            onClick={play}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>START</span>
          </button>
        ) : (
          <button
            onClick={pause}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium transition-colors"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>PAUSE</span>
          </button>
        )}

        <button
          onClick={() => {
            pause();
            step();
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-industrial-bg hover:bg-industrial-border text-industrial-text rounded font-medium transition-colors border border-industrial-border"
        >
          <SkipForward className="w-4 h-4" />
          <span>STEP</span>
        </button>

        <button
          onClick={() => {
            pause();
            resetDemo();
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-industrial-bg hover:bg-industrial-border text-industrial-text rounded font-medium transition-colors border border-industrial-border"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="sr-only sm:not-sr-only">RESET</span>
        </button>
      </div>

      <div className="basis-full border-t border-industrial-border/70 pt-3 mt-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-industrial-muted font-semibold uppercase tracking-wider">
              Speed
            </span>
            <output
              className="min-w-[48px] rounded bg-industrial-bg px-2 py-1 text-center text-sm font-mono font-semibold text-industrial-text"
              aria-live="polite"
            >
              {speedMultiplier.toFixed(2).replace(/\.00$/, "")}x
            </output>
          </div>
          <label
            className="relative flex-1 min-w-[120px]"
            title="Adjust simulation speed dynamically"
          >
            <span className="sr-only">Custom simulation speed</span>
            <input
              type="range"
              min="0.25"
              max="10"
              step="0.25"
              value={speedMultiplier}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="speed-slider w-full"
              style={
                { "--speed-progress": speedMultiplier } as React.CSSProperties
              }
              aria-label="Custom simulation speed"
            />
            <span
              className="mt-1 flex justify-between text-[10px] text-industrial-muted"
              aria-hidden="true"
            >
              <span>0.25x</span>
              <span>10x</span>
            </span>
          </label>
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {[0.5, 1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setSpeed(speed)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  speedMultiplier === speed
                    ? "bg-industrial-text text-industrial-bg"
                    : "bg-industrial-bg text-industrial-muted hover:text-industrial-text border border-industrial-border"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
