// Vista generica "Proximamente" para las funciones de etapas siguientes.
interface Props {
  name: string;
  desc: string;
}

export function SoonScreen({ name, desc }: Props) {
  return (
    <div className="soon">
      <div className="soon__icon">◷</div>
      <div style={{ font: "700 22px var(--f-display)", color: 'var(--tx)' }}>{name}</div>
      <div style={{ font: "500 13px/1.5 var(--f-body)", color: 'var(--dim)', marginTop: 8, maxWidth: 250 }}>{desc}</div>
      <div className="badge-soon">Próximamente</div>
    </div>
  );
}
