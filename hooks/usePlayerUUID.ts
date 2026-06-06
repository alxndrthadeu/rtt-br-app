'use client';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'rtt_player_uuid';

export function usePlayerUUID(): string {
  const [uuid, setUuid] = useState<string>('');

  useEffect(() => {
    let stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      stored = uuidv4();
      localStorage.setItem(STORAGE_KEY, stored);
    }
    setUuid(stored);
  }, []);

  return uuid;
}
