// Shell de la app: header, area scrolleable con la pantalla activa y nav inferior.
// Router local por estado (sin dependencias). Datos reales de Etapa 1 via useMarketData.
import { useState } from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import { useTheme } from '@/hooks/useTheme';
import { useFavorites } from '@/hooks/useFavorites';
import { timeAgo } from '@/utils/format';
import type { StockRow } from '@/types';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { HomeScreen } from '@/screens/HomeScreen';
import { MoversScreen } from '@/screens/MoversScreen';
import { DetailScreen } from '@/screens/DetailScreen';
import { SoonScreen } from '@/screens/SoonScreen';

export type Screen = 'home' | 'movers' | 'detail' | 'soon';

interface SoonInfo {
  name: string;
  desc: string;
}

export default function App() {
  const { loading, error, fxByKind, gaps, stocks, lastRun, refresh } = useMarketData();
  const { theme, toggle: toggleTheme } = useTheme();
  const { isFav, toggle: toggleFav } = useFavorites('merval');

  const [screen, setScreen] = useState<Screen>('home');
  const [prevScreen, setPrevScreen] = useState<Screen>('home');
  const [asset, setAsset] = useState<StockRow | null>(null);
  const [soon, setSoon] = useState<SoonInfo>({ name: '', desc: '' });
  const [spinning, setSpinning] = useState(false);

  const onRefresh = () => {
    setSpinning(true);
    refresh();
    setTimeout(() => setSpinning(false), 750);
  };

  const openDetail = (row: StockRow) => {
    setAsset(row);
    setPrevScreen(screen === 'detail' ? prevScreen : screen);
    setScreen('detail');
  };

  const openSoon = (info: SoonInfo) => {
    setSoon(info);
    setScreen('soon');
  };

  const updatedLabel = lastRun ? timeAgo(lastRun.finished_at ?? lastRun.started_at) : 'sin datos';

  const navActive: 'home' | 'movers' | 'other' =
    screen === 'home' ? 'home' : screen === 'movers' || screen === 'detail' ? 'movers' : 'other';

  return (
    <div className="desk">
      <div className="frame">
        {screen === 'detail' && asset ? (
          <div className="dhdr">
            <button className="icon-btn" onClick={() => setScreen(prevScreen)} aria-label="Volver">
              ‹
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ font: "700 15px var(--f-display)", color: 'var(--tx)' }}>{asset.symbol}</div>
              <div style={{ font: "500 11px var(--f-body)", color: 'var(--dim)' }}>{asset.name ?? ''}</div>
            </div>
            <button className="icon-btn" onClick={toggleTheme} style={{ fontSize: 14 }} aria-label="Cambiar tema">
              ◐
            </button>
          </div>
        ) : (
          <Header
            updatedLabel={updatedLabel}
            spinning={spinning}
            onRefresh={onRefresh}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}

        <main className="scroll">
          {error && (
            <div className="empty err" style={{ marginBottom: 14 }}>
              No se pudieron cargar los datos: {error}
            </div>
          )}
          {loading && !error && stocks.length === 0 && fxByKind.size === 0 && (
            <div className="empty" style={{ marginTop: 40 }}>
              Cargando cotizaciones…
            </div>
          )}

          {screen === 'home' && (
            <HomeScreen
              fxByKind={fxByKind}
              gaps={gaps}
              stocks={stocks}
              isFav={isFav}
              onToggleFav={toggleFav}
              onOpen={openDetail}
              onGoMovers={() => setScreen('movers')}
            />
          )}
          {screen === 'movers' && (
            <MoversScreen stocks={stocks} isFav={isFav} onToggleFav={toggleFav} onOpen={openDetail} />
          )}
          {screen === 'detail' && asset && <DetailScreen row={asset} />}
          {screen === 'soon' && <SoonScreen name={soon.name} desc={soon.desc} />}

          {screen === 'home' && (
            <div className="disclaimer">
              App informativa. No constituye recomendación de compra o venta.
            </div>
          )}
        </main>

        <BottomNav
          active={navActive}
          onHome={() => setScreen('home')}
          onMovers={() => setScreen('movers')}
          onSoon={openSoon}
        />
      </div>
    </div>
  );
}
