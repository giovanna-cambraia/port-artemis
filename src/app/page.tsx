"use client";
import { useState } from "react";
import Preloader from "../components/preloader/Preloader";

export default function Layout({ children }) {
  const [done, setDone] = useState(false);

  return (
    <>
      {!done && <Preloader onComplete={() => setDone(true)} />}
      <main style={{ opacity: done ? 1 : 0, transition: "opacity 0.5s ease" }}>
        {children}
      </main>
    </>
  );
}
