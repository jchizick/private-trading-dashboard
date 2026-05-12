"use client";

import { useEffect, useMemo, useState } from "react";
import { useDailySnapshot } from "@/components/dashboard/DailySnapshotProvider";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { economicCalendar2026 } from "@/data/economicCalendar2026";
import { getEconomicCalendarEventsForDate } from "@/lib/economicCalendar";
import { cloneSynthesisNotes } from "@/lib/dailySnapshotFactory";
import type {
  ChecklistStatus,
  MarketNewsCategory,
  MarketNewsItem,
  SynthesisNotes,
  TradingBias,
  TradingBiasOption
} from "@/types/dailySnapshot";
import type { TradingContext } from "@/types/dashboard";

interface TradingContextModuleProps {
  context: TradingContext;
}

const marketNewsCategories: MarketNewsCategory[] = ["equities", "fx", "crypto", "macro", "rates", "energy"];

const tradingBiasOptions: TradingBiasOption[] = [
  "Bullish",
  "Bearish",
  "Neutral",
  "Long Selective",
  "Short Selective",
  "Range / Chop",
  "Risk Off"
];

const checklistStatusCycle: ChecklistStatus[] = ["not checked", "watch", "checked"];

function cloneMarketNewsItems(items: MarketNewsItem[]): MarketNewsItem[] {
  return items.map((item) => ({ ...item }));
}

function createDraftMarketNewsItem(date: string): MarketNewsItem {
  return {
    id: `market-news-draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date,
    headline: "",
    source: "",
    category: "macro"
  };
}

function getMarketNewsCategoryLabel(category: MarketNewsCategory) {
  return category === "fx" ? "FX" : category.toUpperCase();
}

function getToolTone(status: ChecklistStatus) {
  if (status === "checked") {
    return "positive";
  }

  if (status === "watch") {
    return "warning";
  }

  return "neutral";
}

function getNextChecklistStatus(status: ChecklistStatus) {
  const currentIndex = checklistStatusCycle.indexOf(status);
  return checklistStatusCycle[(currentIndex + 1) % checklistStatusCycle.length];
}

function getBiasOptions(currentBias: TradingBias) {
  return tradingBiasOptions.includes(currentBias as TradingBiasOption)
    ? tradingBiasOptions
    : [...tradingBiasOptions, currentBias];
}

export function TradingContextModule({ context: _context }: TradingContextModuleProps) {
  const {
    activeDate,
    dailySnapshot,
    savedSnapshotDates,
    loadSnapshotForDate,
    updateSnapshot
  } = useDailySnapshot();
  const [draftSynthesis, setDraftSynthesis] = useState<SynthesisNotes>(() =>
    cloneSynthesisNotes(dailySnapshot.synthesis)
  );
  const [draftMarketNews, setDraftMarketNews] = useState<MarketNewsItem[]>(() =>
    cloneMarketNewsItems(dailySnapshot.marketNews)
  );
  const [isEditingSynthesis, setIsEditingSynthesis] = useState(false);
  const [isEditingMarketNews, setIsEditingMarketNews] = useState(false);
  const selectedEconomicEvents = useMemo(
    () => getEconomicCalendarEventsForDate(economicCalendar2026, activeDate),
    [activeDate]
  );
  const activeMarketNews = dailySnapshot.marketNews.filter((item) => item.date === activeDate);

  useEffect(() => {
    setDraftSynthesis(cloneSynthesisNotes(dailySnapshot.synthesis));
    setDraftMarketNews(cloneMarketNewsItems(dailySnapshot.marketNews));
    setIsEditingSynthesis(false);
    setIsEditingMarketNews(false);
  }, [activeDate, dailySnapshot.marketNews, dailySnapshot.synthesis]);

  function beginSynthesisEdit() {
    setDraftSynthesis(cloneSynthesisNotes(dailySnapshot.synthesis));
    setIsEditingSynthesis(true);
  }

  function cancelSynthesisEdit() {
    setDraftSynthesis(cloneSynthesisNotes(dailySnapshot.synthesis));
    setIsEditingSynthesis(false);
  }

  function saveSynthesisEdit() {
    const now = new Date().toISOString();
    updateSnapshot((snapshot) => ({
      ...snapshot,
      status: "saved" as const,
      updatedAt: now,
      synthesis: {
        ...draftSynthesis,
        updatedAt: now
      }
    }));

    setIsEditingSynthesis(false);
  }

  function updateDraftSynthesis<Field extends keyof SynthesisNotes>(
    field: Field,
    value: SynthesisNotes[Field]
  ) {
    setDraftSynthesis((current) => ({
      ...current,
      [field]: value
    }));
  }

  function beginMarketNewsEdit() {
    setDraftMarketNews(cloneMarketNewsItems(activeMarketNews));
    setIsEditingMarketNews(true);
  }

  function cancelMarketNewsEdit() {
    setDraftMarketNews(cloneMarketNewsItems(activeMarketNews));
    setIsEditingMarketNews(false);
  }

  function addDraftMarketNewsItem() {
    setDraftMarketNews((current) => [...current, createDraftMarketNewsItem(activeDate)]);
  }

  function updateDraftMarketNewsItem<Field extends keyof MarketNewsItem>(
    itemId: string,
    field: Field,
    value: MarketNewsItem[Field]
  ) {
    setDraftMarketNews((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    );
  }

  function deleteDraftMarketNewsItem(itemId: string) {
    setDraftMarketNews((current) => current.filter((item) => item.id !== itemId));
  }

  function saveMarketNewsEdit() {
    const now = new Date().toISOString();
    const curatedItems = draftMarketNews
      .map((item) => ({
        ...item,
        date: activeDate,
        headline: item.headline.trim(),
        source: item.source.trim() || "Manual",
        url: item.url?.trim() || undefined,
        timestamp: item.timestamp?.trim() || undefined
      }))
      .filter((item) => item.headline.length > 0);

    updateSnapshot((snapshot) => ({
      ...snapshot,
      status: "saved" as const,
      updatedAt: now,
      // Market News remains manual snapshot state in this phase; future watched X/news ingestion can append here.
      marketNews: [
        ...snapshot.marketNews.filter((item) => item.date !== activeDate),
        ...curatedItems
      ]
    }));

    setIsEditingMarketNews(false);
  }

  function cycleChecklistStatus(itemId: string) {
    const now = new Date().toISOString();
    updateSnapshot((snapshot) => ({
      ...snapshot,
      status: "saved" as const,
      updatedAt: now,
      checklist: snapshot.checklist.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: getNextChecklistStatus(item.status),
              updatedAt: now
            }
          : item
      )
    }));
  }

  return (
    <SectionPanel
      title="Trading Context"
      description="Synthesized notes from specialist platforms."
      className="sectionPanel--tradingContext"
      action={
        <div className="synthesisActions">
          <div className="snapshotDateControls" aria-label="Daily snapshot date controls">
            <label className="snapshotDateControl">
              <span>Day</span>
              <input
                aria-label="Active trading date"
                type="date"
                value={activeDate}
                onChange={(event) => {
                  if (event.target.value) {
                    loadSnapshotForDate(event.target.value);
                  }
                }}
              />
            </label>
            <label className="snapshotDateControl">
              <span>Saved</span>
              <select
                aria-label="Previous snapshots"
                value={savedSnapshotDates.includes(activeDate) ? activeDate : ""}
                onChange={(event) => {
                  if (event.target.value) {
                    loadSnapshotForDate(event.target.value);
                  }
                }}
              >
                <option value="">Archive</option>
                {savedSnapshotDates.map((date) => (
                  <option value={date} key={date}>
                    {date}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <StatusBadge tone="neutral">{dailySnapshot.synthesis.marketBias}</StatusBadge>
          {isEditingSynthesis ? (
            <>
              <button className="terminalButton terminalButton--primary" type="button" onClick={saveSynthesisEdit}>
                Save
              </button>
              <button className="terminalButton" type="button" onClick={cancelSynthesisEdit}>
                Cancel
              </button>
            </>
          ) : (
            <button className="terminalButton" type="button" onClick={beginSynthesisEdit}>
              Edit
            </button>
          )}
        </div>
      }
    >
      <div className="tradingContextGrid">
        <section className="contextColumn contextColumn--news" aria-label="Market news">
          <header className="contextColumn__header">
            <div>
              <h3>Market News</h3>
              <span>{isEditingMarketNews ? "Editing curated read" : "Curated daily read"}</span>
            </div>
            <div className="marketNewsActions">
              {isEditingMarketNews ? (
                <>
                  <button className="terminalButton terminalButton--primary" type="button" onClick={saveMarketNewsEdit}>
                    Save
                  </button>
                  <button className="terminalButton" type="button" onClick={cancelMarketNewsEdit}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="terminalButton" type="button" onClick={beginMarketNewsEdit}>
                  Edit
                </button>
              )}
            </div>
          </header>
          {isEditingMarketNews ? (
            <div className="marketNewsEditor">
              {draftMarketNews.map((item) => (
                <div className="marketNewsEditor__item" key={item.id}>
                  <label className="synthesisField">
                    <span>Headline</span>
                    <input
                      value={item.headline}
                      onChange={(event) => updateDraftMarketNewsItem(item.id, "headline", event.target.value)}
                    />
                  </label>
                  <div className="marketNewsEditor__grid">
                    <label className="synthesisField">
                      <span>Category</span>
                      <select
                        value={item.category}
                        onChange={(event) =>
                          updateDraftMarketNewsItem(item.id, "category", event.target.value as MarketNewsCategory)
                        }
                      >
                        {marketNewsCategories.map((category) => (
                          <option value={category} key={category}>
                            {getMarketNewsCategoryLabel(category)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="synthesisField">
                      <span>Source</span>
                      <input
                        value={item.source}
                        onChange={(event) => updateDraftMarketNewsItem(item.id, "source", event.target.value)}
                      />
                    </label>
                    <label className="synthesisField">
                      <span>URL</span>
                      <input
                        value={item.url ?? ""}
                        onChange={(event) => updateDraftMarketNewsItem(item.id, "url", event.target.value)}
                      />
                    </label>
                    <label className="synthesisField">
                      <span>Timestamp</span>
                      <input
                        value={item.timestamp ?? ""}
                        onChange={(event) => updateDraftMarketNewsItem(item.id, "timestamp", event.target.value)}
                      />
                    </label>
                  </div>
                  <button className="terminalButton" type="button" onClick={() => deleteDraftMarketNewsItem(item.id)}>
                    Delete
                  </button>
                </div>
              ))}
              <button className="terminalButton" type="button" onClick={addDraftMarketNewsItem}>
                Add headline
              </button>
            </div>
          ) : (
            <div className="newsFeed">
              {activeMarketNews.length > 0 ? (
                activeMarketNews.map((item) => (
                  <article className="newsFeed__item" key={item.id}>
                    <div>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noreferrer">
                          {item.headline}
                        </a>
                      ) : (
                        <strong>{item.headline}</strong>
                      )}
                      <span>{item.timestamp ? `${item.source} / ${item.timestamp}` : item.source}</span>
                    </div>
                    <StatusBadge tone="neutral">{getMarketNewsCategoryLabel(item.category)}</StatusBadge>
                  </article>
                ))
              ) : (
                <p className="newsFeed__empty">NO CURATED MARKET NEWS YET</p>
              )}
            </div>
          )}
        </section>

        <section className="contextColumn contextColumn--calendar" aria-label="Economic calendar">
          <header className="contextColumn__header">
            <h3>Economic Calendar</h3>
            <span>Macro tape</span>
          </header>
          <div className="calendarFeed">
            {selectedEconomicEvents.length > 0 ? (
              selectedEconomicEvents.map((item) => (
                <article
                  className="calendarFeed__item"
                  key={`${item.date}-${item.time ?? "no-time"}-${item.currency ?? "no-currency"}-${item.event}`}
                >
                  <time dateTime={item.time ?? undefined}>{item.time ?? "--:--"}</time>
                  <div>
                    <strong>{item.event}</strong>
                  </div>
                  <StatusBadge tone="neutral">{item.currency ?? "N/A"}</StatusBadge>
                </article>
              ))
            ) : (
              <p className="calendarFeed__empty">NO WATCHED MACRO EVENTS TODAY</p>
            )}
          </div>
        </section>

        <section className="contextColumn contextColumn--synthesis" aria-label="Synthesis notes">
          <header className="contextColumn__header">
            <h3>Synthesis Notes</h3>
            <span>{isEditingSynthesis ? "Editing draft" : "Operator interpretation"}</span>
          </header>
          {isEditingSynthesis ? (
            <div className="synthesisNotes synthesisNotes--editing">
              <label className="synthesisField synthesisField--bias">
                <span>Market bias</span>
                <select
                  value={draftSynthesis.marketBias}
                  onChange={(event) => updateDraftSynthesis("marketBias", event.target.value as TradingBias)}
                >
                  {getBiasOptions(draftSynthesis.marketBias).map((bias) => (
                    <option value={bias} key={bias}>
                      {bias}
                    </option>
                  ))}
                </select>
              </label>
              <label className="synthesisField">
                <span>What matters today</span>
                <textarea
                  rows={2}
                  value={draftSynthesis.whatMattersToday}
                  onChange={(event) => updateDraftSynthesis("whatMattersToday", event.target.value)}
                />
              </label>
              <label className="synthesisField">
                <span>Conditions to watch</span>
                <textarea
                  rows={2}
                  value={draftSynthesis.conditionsToWatch}
                  onChange={(event) => updateDraftSynthesis("conditionsToWatch", event.target.value)}
                />
              </label>
              <label className="synthesisField">
                <span>Invalidation</span>
                <textarea
                  rows={2}
                  value={draftSynthesis.invalidation}
                  onChange={(event) => updateDraftSynthesis("invalidation", event.target.value)}
                />
              </label>
              <label className="synthesisField">
                <span>Operator note</span>
                <textarea
                  rows={3}
                  value={draftSynthesis.operatorNote}
                  onChange={(event) => updateDraftSynthesis("operatorNote", event.target.value)}
                />
              </label>
            </div>
          ) : (
            <div className="synthesisNotes">
              <div className="synthesisNotes__bias">
                <span>Market bias</span>
                <strong>{dailySnapshot.synthesis.marketBias}</strong>
              </div>
              <dl>
                <div>
                  <dt>What matters today</dt>
                  <dd>{dailySnapshot.synthesis.whatMattersToday}</dd>
                </div>
                <div>
                  <dt>Conditions to watch</dt>
                  <dd>{dailySnapshot.synthesis.conditionsToWatch}</dd>
                </div>
                <div>
                  <dt>Invalidation</dt>
                  <dd>{dailySnapshot.synthesis.invalidation}</dd>
                </div>
                <div>
                  <dt>Operator note</dt>
                  <dd>{dailySnapshot.synthesis.operatorNote}</dd>
                </div>
              </dl>
            </div>
          )}
        </section>

        <section className="contextColumn contextColumn--checklist" aria-label="Trading checklist">
          <header className="contextColumn__header">
            <h3>Trading Checklist</h3>
            <span>Readiness scan</span>
          </header>
          <div className="tradingChecklist" role="table" aria-label="External platform readiness checklist">
            {dailySnapshot.checklist.map((item) => (
              <div className="tradingChecklist__row" role="row" key={item.id}>
                <div role="cell">
                  <strong>{item.label}</strong>
                </div>
                <span role="cell">
                  <button
                    className="checklistStatusButton"
                    type="button"
                    onClick={() => cycleChecklistStatus(item.id)}
                    aria-label={`Set ${item.label} status. Current status: ${item.status}`}
                  >
                    <StatusBadge tone={getToolTone(item.status)}>{item.status}</StatusBadge>
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

    </SectionPanel>
  );
}
