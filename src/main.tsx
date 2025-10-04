import React from "react";
import { createRoot } from "react-dom/client";
import CasinoGame from "./games/casino"; // расширение можно не писать

function App() {
  const tg = (window as any)?.Telegram?.WebApp;
  try { tg?.ready(); tg?.expand(); } catch {}
  return <CasinoGame />;
}

createRoot(document.getElementById("root")!).render(<App />);

