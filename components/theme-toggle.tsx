'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * Vive adentro del menú de cuenta, no flotando en una esquina.
 *
 * Flotando abajo a la izquierda se superponía con la barra de navegación del
 * celular, y un botón que tapa a otro es peor que uno que está un toque más
 * adentro. Acá además se explica solo, con texto en vez de un ícono suelto.
 */
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
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-white/5"
    >
      {claro ? <Moon size={16} /> : <Sun size={16} />}
      {claro ? 'Tema oscuro' : 'Tema claro'}
    </button>
  );
}
