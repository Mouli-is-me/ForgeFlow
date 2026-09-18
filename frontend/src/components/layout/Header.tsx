import React from "react";
import { Layers } from "lucide-react";
import { NavLink } from "react-router-dom";

export const Header: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive
        ? "text-industrial-text border-b-2 border-industrial-text pb-4 pt-4"
        : "text-industrial-muted hover:text-industrial-text py-4"
    }`;

  return (
    <header className="bg-industrial-panel border-b border-industrial-border px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-12">
        {/* Logo / Title */}
        <div className="flex items-center space-x-3 text-industrial-text py-3">
          <Layers
            className="w-6 h-6 text-industrial-accent"
            aria-hidden="true"
          />
          <div>
            <h1 className="text-lg font-semibold leading-tight tracking-wide">
              FORGEFLOW TWIN
            </h1>
            <p className="text-xs text-industrial-muted tracking-widest uppercase">
              Simulation Engine
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex space-x-8 h-full items-end">
          <NavLink to="/simulate" className={linkClass}>
            SIMULATE
          </NavLink>
          <NavLink to="/factory" className={linkClass}>
            BUILD FACTORY
          </NavLink>
          <NavLink to="/what-if" className={linkClass}>
            WHAT-IF LAB
          </NavLink>
          <NavLink to="/analytics" className={linkClass}>
            ANALYTICS
          </NavLink>
        </nav>
      </div>

      <div
        className="flex items-center space-x-2 bg-industrial-bg px-3 py-1.5 border border-industrial-border rounded-md"
        role="status"
      >
        <span
          className="w-2 h-2 rounded-full bg-industrial-running animate-pulse"
          aria-hidden="true"
        ></span>
        <span className="text-xs text-industrial-running font-medium uppercase tracking-wider">
          Engine Active
        </span>
      </div>
    </header>
  );
};
