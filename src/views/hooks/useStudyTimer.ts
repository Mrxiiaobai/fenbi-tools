import * as React from "react";

export interface StudyTimer {
  elapsedSeconds: number;
  isStarted: boolean;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  destroy: () => void;
}

const getCurrentElapsedMs = (
  elapsedMs: number,
  activeStartedAt: number | null,
) => {
  if (activeStartedAt === null) return elapsedMs;
  return elapsedMs + Date.now() - activeStartedAt;
};

export const formatStudyTime = (elapsedSeconds: number) => {
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

export const useStudyTimer = (): StudyTimer => {
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [isStarted, setIsStarted] = React.useState(false);
  const [isRunning, setIsRunning] = React.useState(false);

  // Preserve partial seconds across pauses; round only when updating the display.
  const elapsedMsRef = React.useRef(0);
  const activeStartedAtRef = React.useRef<number | null>(null);
  const startedRef = React.useRef(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const clearIntervalRef = React.useCallback(() => {
    if (intervalRef.current === null) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const refresh = React.useCallback(() => {
    const nextElapsedMs = getCurrentElapsedMs(
      elapsedMsRef.current,
      activeStartedAtRef.current,
    );
    setElapsedSeconds(Math.floor(nextElapsedMs / 1000));
  }, []);

  const startInterval = React.useCallback(() => {
    clearIntervalRef();
    intervalRef.current = setInterval(refresh, 1000);
  }, [clearIntervalRef, refresh]);

  const start = React.useCallback(() => {
    if (startedRef.current) return;

    startedRef.current = true;
    activeStartedAtRef.current = Date.now();
    setIsStarted(true);
    setIsRunning(true);
    startInterval();
  }, [startInterval]);

  const pause = React.useCallback(() => {
    if (!startedRef.current || activeStartedAtRef.current === null) return;

    const nextElapsedMs = getCurrentElapsedMs(
      elapsedMsRef.current,
      activeStartedAtRef.current,
    );
    elapsedMsRef.current = nextElapsedMs;
    activeStartedAtRef.current = null;
    setElapsedSeconds(Math.floor(nextElapsedMs / 1000));
    setIsRunning(false);
    clearIntervalRef();
  }, [clearIntervalRef]);

  const resume = React.useCallback(() => {
    if (!startedRef.current || activeStartedAtRef.current !== null) return;

    activeStartedAtRef.current = Date.now();
    setIsRunning(true);
    startInterval();
  }, [startInterval]);

  const destroy = React.useCallback(() => {
    clearIntervalRef();
    elapsedMsRef.current = 0;
    activeStartedAtRef.current = null;
    startedRef.current = false;
    setElapsedSeconds(0);
    setIsStarted(false);
    setIsRunning(false);
  }, [clearIntervalRef]);

  React.useEffect(() => {
    return () => {
      clearIntervalRef();
      activeStartedAtRef.current = null;
    };
  }, [clearIntervalRef]);

  return {
    elapsedSeconds,
    isStarted,
    isRunning,
    start,
    pause,
    resume,
    destroy,
  };
};
