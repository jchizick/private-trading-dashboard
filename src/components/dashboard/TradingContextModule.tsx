"use client";

import { useEffect, useState } from "react";
import { useDailySnapshot } from "@/components/dashboard/DailySnapshotProvider";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cloneSynthesisNotes } from "@/lib/dailySnapshotFactory";
import type {
  ChecklistStatus,
  SynthesisNotes,
  TradingBias
} from "@/types/dailySnapshot";
import type { TradingContext } from "@/types/dashboard";

interface TradingContextModuleProps {
  context: TradingContext;
}

const marketNews = [
  {
    headline: "Index futures hold bid as megacap strength offsets rate pressure.",
    source: "Market Desk",
    timestamp: "08:55 ET",
    tag: "Equities"
  },
  {
    headline: "Dollar firms into US data window; metals fade early-session impulse.",
    source: "Macro Wire",
    timestamp: "09:10 ET",
    tag: "FX"
  },
  {
    headline: "Crypto majors remain range-bound ahead of liquidity sweep zones.",
    source: "Flow Brief",
    timestamp: "09:18 ET",
    tag: "Crypto"
  }
];

const economicEvents = [
  {
    time: "10:00",
    event: "ISM Manufacturing PMI",
    impact: "high",
    detail: "Fcst 50.3 / Prior 50.2"
  },
  {
    time: "10:00",
    event: "JOLTS Job Openings",
    impact: "medium",
    detail: "Fcst 8.75M / Prior 8.76M"
  },
  {
    time: "13:00",
    event: "Treasury Auction",
    impact: "medium",
    detail: "Duration supply watch"
  },
  {
    time: "14:00",
    event: "Fed Speaker",
    impact: "low",
    detail: "Tone risk only"
  }
];

const externalTools = [
  { name: "Bookmap", action: "launch" },
  { name: "SPX Flow (Tradytics)", action: "open" },
  { name: "SpotGamma", action: "open" },
  { name: "Unusual Whales", action: "link" },
  { name: "Macro Calendar", action: "open" },
  { name: "+ Add Tool", action: "note" }
];

const tradingBiasOptions: TradingBias[] = [
  "long selective",
  "short selective",
  "neutral",
  "no trade"
];

const checklistStatusCycle: ChecklistStatus[] = ["not checked", "watch", "checked"];

function getToolTone(status: ChecklistStatus) {
  if (status === "checked") {
    return "positive";
  }

  if (status === "watch") {
    return "warning";
  }

  return "neutral";
}

function getImpactTone(impact: string) {
  if (impact === "high") {
    return "warning";
  }

  if (impact === "medium") {
    return "neutral";
  }

  return "positive";
}

function getNextChecklistStatus(status: ChecklistStatus) {
  const currentIndex = checklistStatusCycle.indexOf(status);
  return checklistStatusCycle[(currentIndex + 1) % checklistStatusCycle.length];
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
  const [isEditingSynthesis, setIsEditingSynthesis] = useState(false);

  useEffect(() => {
    setDraftSynthesis(cloneSynthesisNotes(dailySnapshot.synthesis));
    setIsEditingSynthesis(false);
  }, [activeDate, dailySnapshot.synthesis]);

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
          <StatusBadge tone="neutral">{dailySnapshot.synthesis.primaryBias}</StatusBadge>
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
            <h3>Market News</h3>
            <span>External read</span>
          </header>
          <div className="newsFeed">
            {marketNews.map((item) => (
              <article className="newsFeed__item" key={item.headline}>
                <div>
                  <strong>{item.headline}</strong>
                  <span>{item.source} / {item.timestamp}</span>
                </div>
                <StatusBadge tone="neutral">{item.tag}</StatusBadge>
              </article>
            ))}
          </div>
        </section>

        <section className="contextColumn contextColumn--calendar" aria-label="Economic calendar">
          <header className="contextColumn__header">
            <h3>Economic Calendar</h3>
            <span>Macro tape</span>
          </header>
          <div className="calendarFeed">
            {economicEvents.map((item) => (
              <article className="calendarFeed__item" key={`${item.time}-${item.event}`}>
                <time>{item.time}</time>
                <div>
                  <strong>{item.event}</strong>
                  <span>{item.detail}</span>
                </div>
                <StatusBadge tone={getImpactTone(item.impact)}>{item.impact}</StatusBadge>
              </article>
            ))}
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
                  value={draftSynthesis.primaryBias}
                  onChange={(event) => updateDraftSynthesis("primaryBias", event.target.value as TradingBias)}
                >
                  {tradingBiasOptions.map((bias) => (
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
                <strong>{dailySnapshot.synthesis.primaryBias}</strong>
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

      <footer className="externalToolsStrip" aria-label="External tools notes and links">
        <div className="externalToolsStrip__label">External Tools <span>Notes / Links</span></div>
        <nav className="externalToolsStrip__links" aria-label="External trading tools">
          {externalTools.map((tool) => (
            <a href="#" key={tool.name} aria-label={`${tool.action} ${tool.name}`}>
              <strong>{tool.name}</strong>
              <span>{tool.action}</span>
            </a>
          ))}
        </nav>
      </footer>
    </SectionPanel>
  );
}
