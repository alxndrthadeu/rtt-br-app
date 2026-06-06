'use client';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  return (
    <button
      onClick={toggle}
      title={dark ? 'Modo claro' : 'Modo escuro'}
      className="text-[9px] tracking-[0.35em] uppercase font-bold border border-ink/30 dark:border-gold/40 px-3 py-1.5 transition-colors
        text-ink/75 hover:text-ink hover:border-ink
        dark:text-cream/35 dark:hover:text-cream dark:hover:border-gold/60"
    >
      {dark ? '◐ Claro' : '◑ Escuro'}
    </button>
  );
}
