"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Preloader from "../components/preloader/Preloader";

export default function Home() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) {
      router.push('/intro');
    }
  }, [done, router]);

  return (
    <>
      {!done && <Preloader onComplete={() => setDone(true)} />}
    </>
  );
}