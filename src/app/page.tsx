"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Preloader from "../components/preloader/Preloader";
import HeroSection from "./hero/hero-section/Hero";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [done, setDone] = useState(false);


  const showHeroDirect = searchParams.get("hero") === "true";

  useEffect(() => {
    if (done && !showHeroDirect) {
      router.push("/intro");
    }
  }, [done, router, showHeroDirect]);

  if (showHeroDirect) {
    return <HeroSection />;
  }

  return <>{!done && <Preloader onComplete={() => setDone(true)} />}</>;
}
