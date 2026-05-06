"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { isMarketCandlesFetchResult } from "@/lib/marketCandleValidation";
import type { MarketCandle, MarketCandlesFetchResult } from "@/types/marketCandles";
import type { HistogramData, IChartApi, UTCTimestamp } from "lightweight-charts";

interface MarketOverviewCandlesChartProps {
  fallback: ReactNode;
}

const chartPalette = {
  bullishBody: "rgba(209, 216, 213, 0.9)",
  bullishLine: "rgba(102, 217, 157, 0.8)",
  bullishVolume: "rgba(102, 217, 157, 0.15)",
  bearishBody: "rgba(35, 40, 43, 1)",
  bearishLine: "rgba(102, 217, 157, 0.5)",
  bearishVolume: "rgba(35, 40, 43, 1)"
} as const;

function toCandlestickData(candles: MarketCandle[]) {
  return candles.map((candle) => ({
    time: candle.time as UTCTimestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close
  }));
}

function toVolumeData(candles: MarketCandle[]): HistogramData[] {
  return candles
    .filter((candle) => candle.volume !== null)
    .map((candle) => ({
      time: candle.time as UTCTimestamp,
      value: candle.volume ?? 0,
      color: candle.close >= candle.open
        ? chartPalette.bullishVolume
        : chartPalette.bearishVolume
    }));
}

function getStatusLabel(result: MarketCandlesFetchResult) {
  return result.isProxy && result.providerSymbol === "SPY"
    ? "SPX500 proxy via SPY / 30m / Yahoo Finance / Live"
    : "SPX500 / 30m / Yahoo Finance / Live";
}

export function MarketOverviewCandlesChart({ fallback }: MarketOverviewCandlesChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [candlesResult, setCandlesResult] = useState<MarketCandlesFetchResult | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const statusLabel = useMemo(
    () => candlesResult ? getStatusLabel(candlesResult) : null,
    [candlesResult]
  );

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadCandles() {
      try {
        const response = await fetch("/api/market-candles?symbol=SPX500", {
          cache: "no-store",
          signal: controller.signal
        });
        const payload: unknown = await response.json();

        if (!isMounted) {
          return;
        }

        if (
          response.ok &&
          isMarketCandlesFetchResult(payload) &&
          payload.ok &&
          payload.candles.length > 0
        ) {
          setCandlesResult(payload);
        }
      } catch (error) {
        if (!isMounted || error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    loadCandles();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!candlesResult || candlesResult.candles.length === 0) {
      return;
    }

    const candles = candlesResult.candles;
    let chart: IChartApi | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeFrame = 0;
    let isDisposed = false;

    async function renderChart() {
      const container = chartContainerRef.current;

      if (!container) {
        return;
      }

      try {
        const {
          CandlestickSeries,
          ColorType,
          HistogramSeries,
          createChart
        } = await import("lightweight-charts");

        if (isDisposed) {
          return;
        }

        const bounds = container.getBoundingClientRect();
        const width = Math.max(Math.floor(bounds.width || container.clientWidth || 640), 1);
        const height = Math.max(Math.floor(bounds.height || container.clientHeight || 318), 286);

        chart = createChart(container, {
          width,
          height,
          autoSize: false,
          layout: {
            background: {
              type: ColorType.Solid,
              color: "rgba(8, 13, 15, 0)"
            },
            textColor: "rgba(177, 188, 184, 0.82)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 11
          },
          grid: {
            vertLines: {
              color: "rgba(102, 113, 111, 0.055)"
            },
            horzLines: {
              color: "rgba(102, 113, 111, 0.07)"
            }
          },
          rightPriceScale: {
            borderColor: "rgba(48, 59, 62, 0.62)",
            scaleMargins: {
              top: 0.07,
              bottom: 0.22
            }
          },
          timeScale: {
            borderColor: "rgba(48, 59, 62, 0.62)",
            barSpacing: 7,
            rightOffset: 4,
            timeVisible: true,
            secondsVisible: false
          },
          crosshair: {
            vertLine: {
              color: "rgba(138, 153, 148, 0.22)"
            },
            horzLine: {
              color: "rgba(138, 153, 148, 0.22)"
            }
          },
          localization: {
            priceFormatter: (price: number) => price.toLocaleString("en-US", {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2
            })
          }
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: chartPalette.bullishBody,
          downColor: chartPalette.bearishBody,
          borderUpColor: chartPalette.bullishLine,
          borderDownColor: chartPalette.bearishLine,
          wickUpColor: chartPalette.bullishLine,
          wickDownColor: chartPalette.bearishLine
        });

        candleSeries.setData(toCandlestickData(candles));

        const volumeData = toVolumeData(candles);

        if (volumeData.length > 0) {
          const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: {
              type: "volume"
            },
            priceScaleId: "",
            lastValueVisible: false,
            priceLineVisible: false
          });

          volumeSeries.setData(volumeData);
          chart.priceScale("").applyOptions({
            scaleMargins: {
              top: 0.84,
              bottom: 0
            }
          });
        }

        chart.timeScale().fitContent();
        setIsRendered(true);

        if (typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(([entry]) => {
            const nextWidth = Math.max(Math.floor(entry.contentRect.width), 1);
            const nextHeight = Math.max(Math.floor(entry.contentRect.height), 286);

            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(() => {
              chart?.applyOptions({
                width: nextWidth,
                height: nextHeight
              });
              chart?.timeScale().fitContent();
            });
          });
          resizeObserver.observe(container);
        }
      } catch {
        setIsRendered(false);
        chart?.remove();
        chart = null;
      }
    }

    renderChart();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(resizeFrame);
      resizeObserver?.disconnect();
      chart?.remove();
      chart = null;
    };
  }, [candlesResult]);

  return (
    <div className="marketCandlesChart" data-live-chart={isRendered ? "ready" : "fallback"}>
      <div className={isRendered ? "marketCandlesChart__fallback marketCandlesChart__fallback--hidden" : "marketCandlesChart__fallback"}>
        {fallback}
      </div>
      {candlesResult ? (
        <div className={isRendered ? "marketCandlesChart__live marketCandlesChart__live--ready" : "marketCandlesChart__live"} aria-label="SPX500 30 minute candlestick chart">
          <div className="marketCandlesChart__meta">
            <span>{statusLabel}</span>
          </div>
          <div ref={chartContainerRef} className="marketCandlesChart__canvas" />
        </div>
      ) : null}
    </div>
  );
}
