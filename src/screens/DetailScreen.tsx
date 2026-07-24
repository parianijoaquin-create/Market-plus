// Pantalla Detalle de un activo. Muestra SOLO datos reales de Etapa 1
// (precio, variacion, cierre previo, volumen, timestamp). Las senales
// tecnicas (RSI, medias, oportunidades) llegan en la Etapa 4: se muestran
// como "Proximamente" para no inventar indicadores ni sugerir operaciones.
import type { StockRow } from '@/types';
import { formatMoney, formatPct, formatVolume, timeAgo } from '@/utils/format';

interface Props {
  row: StockRow;
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ font: "500 11px var(--f-body)", color: 'var(--dim)' }}>{label}</div>
      <div style={{ font: "700 15px var(--f-mono)", color: color ?? 'var(--tx)', marginTop: 4 }}>{value}</div>
    </div>
  );
}

export function DetailScreen({ row }: Props) {
  const up = (row.change_pct ?? 0) >= 0;
  return (
    <>
      <div style={{ textAlign: 'center', margin: '8px 0 18px' }}>
        <div style={{ font: "700 40px/1 var(--f-display)", color: 'var(--tx)', fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(row.price)}
        </div>
        <span
          className={'pill ' + (up ? 'pill--up' : 'pill--down')}
          style={{ marginTop: 9, padding: '4px 12px', fontSize: 14 }}
        >
          {formatPct(row.change_pct)}
        </span>
      </div>

      <div className="section-h">Datos del día</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <Stat label="Variación" value={formatPct(row.change_pct)} color={up ? 'var(--up)' : 'var(--down)'} />
        <Stat label="Cierre previo" value={formatMoney(row.prev_close)} />
        <Stat label="Volumen" value={formatVolume(row.volume)} />
        <Stat label="Actualizado" value={timeAgo(row.quoted_at)} />
      </div>

      {/* Señales técnicas — Etapa 4 */}
      <div className="section-h">Señales técnicas</div>
      <div className="empty" style={{ textAlign: 'left', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>◷</span>
          <span style={{ font: "700 14px var(--f-display)", color: 'var(--tx)' }}>Próximamente</span>
        </div>
        RSI, medias móviles y detección de oportunidades llegan en la Etapa 4, cuando se
        acumule el historial diario de cada activo.
      </div>

      <div className="disclaimer" style={{ marginTop: 14 }}>
        Información con fines informativos. No constituye recomendación de compra o venta.
      </div>
    </>
  );
}
