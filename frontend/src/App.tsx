import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { SimulatePage } from "./pages/SimulatePage";
import { WhatIfLabPage } from "./pages/WhatIfLabPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { FactoryBuilderPage } from "./pages/FactoryBuilderPage";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen bg-industrial-bg flex flex-col font-sans">
        <Header />

        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/simulate" replace />} />
            <Route path="/simulate" element={<SimulatePage />} />
            <Route path="/what-if" element={<WhatIfLabPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/builder" element={<FactoryBuilderPage />} />
            <Route path="/factory" element={<FactoryBuilderPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
