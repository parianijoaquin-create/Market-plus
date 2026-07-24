// Barra de navegacion inferior. Inicio y Movers estan implementados (Etapa 1).
// Noticias, Cartera y Alertas abren la vista "Proximamente" (etapas siguientes).

interface Props {
  active: 'home' | 'movers' | 'other';
  onHome: () => void;
  onMovers: () => void;
  onSoon: (info: { name: string; desc: string }) => void;
}

const ink = (on: boolean) => (on ? 'var(--brand)' : 'var(--dim)');

export function BottomNav({ active, onHome, onMovers, onSoon }: Props) {
  return (
    <nav className="nav">
      <button className="nav__btn" style={{ color: ink(active === 'home') }} onClick={onHome}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
          <rect x="4.5" y="9" width="15" height="11" rx="2.5" fill="currentColor" />
          <rect x="9.5" y="13.5" width="5" height="6.5" rx="1" fill="var(--bg)" />
          <rect x="10.5" y="3.5" width="3" height="4" rx="1" fill="currentColor" />
        </svg>
        <span className="nav__lbl">Inicio</span>
      </button>

      <button className="nav__btn" style={{ color: ink(active === 'movers') }} onClick={onMovers}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
          <rect x="4.5" y="13" width="3.6" height="7" rx="1" fill="currentColor" />
          <rect x="10.2" y="9" width="3.6" height="11" rx="1" fill="currentColor" />
          <rect x="15.9" y="5" width="3.6" height="15" rx="1" fill="currentColor" />
        </svg>
        <span className="nav__lbl">Movers</span>
      </button>

      <button
        className="nav__btn"
        style={{ color: ink(false) }}
        onClick={() =>
          onSoon({
            name: 'Noticias',
            desc: 'Titulares del mercado argentino, cripto y global desde fuentes RSS. Llega en la Etapa 2.',
          })
        }
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
          <rect x="4.5" y="5" width="13" height="14.5" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          <rect x="7.5" y="8.5" width="7" height="1.7" rx=".8" fill="currentColor" />
          <rect x="7.5" y="12" width="7" height="1.7" rx=".8" fill="currentColor" />
          <rect x="7.5" y="15.5" width="4" height="1.7" rx=".8" fill="currentColor" />
        </svg>
        <span className="nav__lbl">Noticias</span>
      </button>

      <button
        className="nav__btn"
        style={{ color: ink(false) }}
        onClick={() =>
          onSoon({
            name: 'Tu cartera',
            desc: 'Cargá tus posiciones y seguí el rendimiento. Llega en la Etapa 4.',
          })
        }
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="6.5" width="16" height="12" rx="3" fill="currentColor" />
          <rect x="13" y="10.5" width="6" height="4.5" rx="1.4" fill="var(--bg)" />
          <circle cx="15.6" cy="12.7" r="1" fill="currentColor" />
        </svg>
        <span className="nav__lbl">Cartera</span>
      </button>

      <button
        className="nav__btn"
        style={{ color: ink(false) }}
        onClick={() =>
          onSoon({
            name: 'Alertas',
            desc: 'Avisos push de tus favoritos y del mercado. Llega en la Etapa 3.',
          })
        }
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
          <circle cx="11.5" cy="11" r="5.4" fill="currentColor" />
          <rect x="9" y="17.4" width="5" height="2.2" rx="1.1" fill="currentColor" />
        </svg>
        <span className="nav__lbl">Alertas</span>
      </button>
    </nav>
  );
}
