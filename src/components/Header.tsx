// Header principal: marca, boton de refresco (con "hace X") y toggle de tema.
import type { Theme } from '@/hooks/useTheme';

interface Props {
  updatedLabel: string;
  spinning: boolean;
  onRefresh: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Header({ updatedLabel, spinning, onRefresh, theme, onToggleTheme }: Props) {
  return (
    <header className="hdr">
      <div className="hdr__brand">
        <div className="hdr__logo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <polyline
              points="3,16 9,10 13,14 21,5"
              stroke="var(--brand-ink)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="hdr__title">Market Pulse</div>
      </div>
      <div className="hdr__actions">
        <button className="refresh" onClick={onRefresh} title="Actualizar">
          <span className={'refresh__icon' + (spinning ? ' refresh__icon--spin' : '')}>⟳</span>
          {updatedLabel}
        </button>
        <button className="theme-toggle" onClick={onToggleTheme} title="Cambiar tema">
          <span
            className="theme-toggle__knob"
            style={{ transform: theme === 'dark' ? 'translateX(0)' : 'translateX(18px)' }}
          />
        </button>
      </div>
    </header>
  );
}
