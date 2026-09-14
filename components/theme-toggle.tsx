'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [claro, setClaro] = useState(false);

  useEffect(() => {
    setClaro(document.documentElement.dataset.theme === 'claro');
  }, []);

  function alternar() {
    const nuevo = !claro;
    setClaro(nuevo);
    if (nuevo) {
      document.documentElement.dataset.theme = 'claro';
      localStorage.setItem('theme', 'claro');
    } else {
      delete document.documentElement.dataset.theme;
      localStorage.setItem('theme', 'oscuro');
    }
  }

  return (
    <button
      onClick={alternar}
      aria-label={claro ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      className="fixed bottom-6 left-6 z-40 grid h-12 w-12 place-items-center rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] transition hover:scale-105"
    >
      {claro ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
