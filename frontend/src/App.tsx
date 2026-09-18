import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { SimulatePage } from "./pages/SimulatePage";
import { WhatIfLabPage } from "./pages/WhatIfLabPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { FactoryBuilderPage } from "./pages/FactoryBuilderPage";
import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
        <Header theme={theme} setTheme={setTheme} />

        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<SimulatePage />} />
            <Route path="/simulate" element={<SimulatePage />} />
            <Route path="/what-if" element={<WhatIfLabPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/builder" element={<FactoryBuilderPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
