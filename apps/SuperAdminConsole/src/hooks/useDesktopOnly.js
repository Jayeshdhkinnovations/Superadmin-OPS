import { useEffect, useState } from "react";

const BREAKPOINT = 1024;

export function useDesktopOnly() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= BREAKPOINT : true
  );

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= BREAKPOINT);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isDesktop;
}
