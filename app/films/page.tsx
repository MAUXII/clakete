"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FilmsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/films/discover");
  }, [router]);
  return null;
}
