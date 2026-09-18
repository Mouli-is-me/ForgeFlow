import React from "react";
import { Layers, Moon, Sun, Monitor } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Theme } from "../../App";

interface HeaderProps {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, setTheme }) => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive
        ? "text-foreground border-b-2 border-primary pb-4 pt-4"
        : "text-muted hover:text-foreground py-4"
    }`;

  return (
    <header className="bg-surface border-b border-border px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-12">
        {/* Logo / Title */}
        <div className="flex items-center space-x-3 text-foreground py-3">
          <Layers className="w-6 h-6 text-primary" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-semibold leading-tight tracking-wide">
              FORGEFLOW
            </h1>
            <p className="text-xs text-muted tracking-widest uppercase">
              Simulation Engine
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex space-x-8 h-full items-end">
          <NavLink to="/simulate" className={linkClass}>
            SIMULATE
          </NavLink>
          <NavLink to="/builder" className={linkClass}>
            FACTORY BUILDER
          </NavLink>
          <NavLink to="/what-if" className={linkClass}>
            WHAT-IF LAB
          </NavLink>
          <NavLink to="/analytics" className={linkClass}>
            ANALYTICS
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center space-x-6">
        {/* Theme Toggle */}
        <div className="flex bg-background border border-border rounded-md p-1">
          <button
            onClick={() => setTheme("light")}
            className={`p-1 rounded ${theme === "light" ? "bg-surface shadow-sm text-primary" : "text-muted hover:text-foreground"}`}
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme("system")}
            className={`p-1 rounded ${theme === "system" ? "bg-surface shadow-sm text-primary" : "text-muted hover:text-foreground"}`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`p-1 rounded ${theme === "dark" ? "bg-surface shadow-sm text-primary" : "text-muted hover:text-foreground"}`}
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>

        <div
          className="flex items-center space-x-2 bg-background px-3 py-1.5 border border-border rounded-md"
          role="status"
        >
          <span
            className="w-2 h-2 rounded-full bg-success animate-pulse"
            aria-hidden="true"
          ></span>
          <span className="text-xs text-success font-medium uppercase tracking-wider">
            Engine Active
          </span>
        </div>
      </div>
    </header>
  );
};
