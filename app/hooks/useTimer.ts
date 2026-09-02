"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionBlock } from "../lib/types";

const DEFAULT_BLOCK_SECONDS = 45; // fallback for blocks without an explicit duration

export interface TimerState {
  index: number;
  remaining: number;
  running: boolean;
  finished: boolean;
}

function blockSeconds(block: SessionBlock | undefined): number {
  if (!block) return 0;
  return block.duration && block.duration > 0 ? block.duration : DEFAULT_BLOCK_SECONDS;
}

/**
 * Drives a sequence of session blocks. Auto-advances when a block's countdown
 * reaches zero and fires callbacks so the UI can beep / celebrate.
 */
export function useTimer(
  blocks: SessionBlock[],
  opts: { onBlockEnd?: () => void; onSessionEnd?: () => void } = {}
) {
  const { onBlockEnd, onSessionEnd } = opts;
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(() => blockSeconds(blocks[0]));
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cbRef = useRef({ onBlockEnd, onSessionEnd });
  cbRef.current = { onBlockEnd, onSessionEnd };

  const clear = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex >= blocks.length) {
        clear();
        setRunning(false);
        setFinished(true);
        cbRef.current.onSessionEnd?.();
        return;
      }
      setIndex(nextIndex);
      setRemaining(blockSeconds(blocks[nextIndex]));
    },
    [blocks]
  );

  const tick = useCallback(() => {
    setRemaining((r) => {
      if (r <= 1) {
        cbRef.current.onBlockEnd?.();
        // advance on next microtask to keep state updates clean
        setIndex((i) => {
          const next = i + 1;
          if (next >= blocks.length) {
            clear();
            setRunning(false);
            setFinished(true);
            cbRef.current.onSessionEnd?.();
            return i;
          }
          setRemaining(blockSeconds(blocks[next]));
          return next;
        });
        return 0;
      }
      return r - 1;
    });
  }, [blocks]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
      return clear;
    }
    clear();
  }, [running, tick]);

  useEffect(() => clear, []);

  const start = useCallback(() => {
    if (finished) return;
    setRunning(true);
  }, [finished]);
  const pause = useCallback(() => setRunning(false), []);
  const skip = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);
  const reset = useCallback(() => {
    clear();
    setRunning(false);
    setFinished(false);
    setIndex(0);
    setRemaining(blockSeconds(blocks[0]));
  }, [blocks]);

  return {
    index,
    remaining,
    running,
    finished,
    total: blockSeconds(blocks[index]),
    current: blocks[index],
    next: blocks[index + 1],
    start,
    pause,
    skip,
    reset,
  };
}
