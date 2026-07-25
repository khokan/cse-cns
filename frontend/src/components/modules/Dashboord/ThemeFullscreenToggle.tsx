"use client"

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, SunMedium, Maximize, Minimize2 } from "lucide-react";

type ExtendedDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

type ExtendedHTMLElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

const getFullscreenElement = () => {
  const doc = document as ExtendedDocument;
  return (
    document.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    doc.msFullscreenElement ??
    null
  );
};

const exitFullscreen = async () => {
  const doc = document as ExtendedDocument;
  return (
    doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.() ?? doc.mozCancelFullScreen?.() ?? doc.msExitFullscreen?.()
  );
};

const requestFullscreen = async (element: ExtendedHTMLElement) => {
  return (
    element.requestFullscreen?.() ?? element.webkitRequestFullscreen?.() ?? element.mozRequestFullScreen?.() ?? element.msRequestFullscreen?.()
  );
};

const ThemeFullscreenToggle = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(getFullscreenElement()));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    handleFullscreenChange();

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme ?? "light" : theme ?? "light";
  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const toggleFullscreen = async () => {
    const fullscreenElement = getFullscreenElement();

    try {
      if (fullscreenElement) {
        await exitFullscreen();
      } else {
        await requestFullscreen(document.documentElement as ExtendedHTMLElement);
      }
    } catch {
      // ignore any fullscreen errors
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
        {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default ThemeFullscreenToggle;
