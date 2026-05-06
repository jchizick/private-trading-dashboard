"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type DragEvent
} from "react";
import { useDailySnapshot } from "@/components/dashboard/DailySnapshotProvider";
import { getGammaTone } from "@/lib/marketStatus";
import { SectionPanel } from "@/components/ui/SectionPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PlaceholderFrame } from "@/components/ui/PlaceholderFrame";
import { formatPrice } from "@/lib/formatters";
import {
  GAMMA_IMAGE_ACCEPTED_TYPES,
  readGammaImageFileAsDataUrl,
  validateGammaImageFile
} from "@/lib/gammaImageUpload";
import type { GammaSnapshot, GammaStatus } from "@/types/dailySnapshot";
import type { GammaContext } from "@/types/dashboard";

interface GammaContextModuleProps {
  gamma: GammaContext;
}

const gammaDistribution = [
  { strike: 7280, exposure: 38, prior: 25 },
  { strike: 7275, exposure: 48, prior: 31 },
  { strike: 7270, exposure: 68, prior: 42 },
  { strike: 7265, exposure: 61, prior: 35 },
  { strike: 7260, exposure: 78, prior: 44 },
  { strike: 7255, exposure: 32, prior: 18 },
  { strike: 7250, exposure: 12, prior: -9 },
  { strike: 7245, exposure: -28, prior: -16 },
  { strike: 7240, exposure: -66, prior: -44 },
  { strike: 7235, exposure: -42, prior: -31 },
  { strike: 7230, exposure: -35, prior: -22 },
  { strike: 7225, exposure: -24, prior: -14 }
] as const;

const gammaStatusOptions: GammaStatus[] = [
  "pending",
  "not_checked",
  "checked",
  "unavailable",
  "market_closed"
];
const gammaImageAccept = GAMMA_IMAGE_ACCEPTED_TYPES.join(",");

interface GammaDraft {
  majorPositiveGamma: string;
  majorNegativeGamma: string;
  zeroGamma: string;
  capturedAt: string;
  status: GammaStatus;
}

function formatNullableGammaPrice(value: number | null, precision: number) {
  return value === null ? "n/a" : formatPrice(value, precision);
}

function toLocalDateTimeInputValue(value: string | null) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatLastChecked(value: string | null) {
  if (!value) {
    return "n/a";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto",
    timeZoneName: "short"
  }).format(date);
}

function createDraftFromGamma(gamma: GammaSnapshot): GammaDraft {
  return {
    majorPositiveGamma: gamma.majorPositiveGamma?.toString() ?? "",
    majorNegativeGamma: gamma.majorNegativeGamma?.toString() ?? "",
    zeroGamma: gamma.zeroGamma?.toString() ?? "",
    capturedAt: toLocalDateTimeInputValue(gamma.capturedAt),
    status: gamma.status
  };
}

function parseNullableNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function getGammaStatusTone(status: GammaStatus) {
  if (status === "checked") {
    return "positive";
  }

  if (status === "pending" || status === "not_checked") {
    return "warning";
  }

  if (status === "unavailable") {
    return "negative";
  }

  return "neutral";
}

export function GammaContextModule({ gamma }: GammaContextModuleProps) {
  const { activeDate, dailySnapshot, updateSnapshot } = useDailySnapshot();
  const savedGamma = dailySnapshot.gamma;
  const [isEditingGamma, setIsEditingGamma] = useState(false);
  const [draftGamma, setDraftGamma] = useState<GammaDraft>(() => createDraftFromGamma(savedGamma));
  const [gammaError, setGammaError] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isImageDragActive, setIsImageDragActive] = useState(false);

  useEffect(() => {
    setDraftGamma(createDraftFromGamma(savedGamma));
    setIsEditingGamma(false);
    setGammaError(null);
    setImageUploadError(null);
    setIsImageDragActive(false);
  }, [activeDate, savedGamma]);

  function beginGammaEdit() {
    setDraftGamma(createDraftFromGamma(savedGamma));
    setGammaError(null);
    setIsEditingGamma(true);
  }

  function cancelGammaEdit() {
    setDraftGamma(createDraftFromGamma(savedGamma));
    setGammaError(null);
    setIsEditingGamma(false);
  }

  function updateDraftGamma(field: keyof GammaDraft, value: string) {
    setDraftGamma((current) => ({
      ...current,
      [field]: value
    }));
  }

  function saveGammaEdit() {
    const majorPositiveGamma = parseNullableNumber(draftGamma.majorPositiveGamma);
    const majorNegativeGamma = parseNullableNumber(draftGamma.majorNegativeGamma);
    const zeroGamma = parseNullableNumber(draftGamma.zeroGamma);

    if (
      majorPositiveGamma === undefined ||
      majorNegativeGamma === undefined ||
      zeroGamma === undefined
    ) {
      setGammaError("Gamma levels must be numeric.");
      return;
    }

    const now = new Date().toISOString();
    const parsedCapturedAt = draftGamma.capturedAt ? new Date(draftGamma.capturedAt) : null;

    if (parsedCapturedAt && Number.isNaN(parsedCapturedAt.getTime())) {
      setGammaError("Last checked time is invalid.");
      return;
    }

    const capturedAt = parsedCapturedAt ? parsedCapturedAt.toISOString() : now;
    const hasManualLevels =
      majorPositiveGamma !== null ||
      majorNegativeGamma !== null ||
      zeroGamma !== null;

    updateSnapshot((snapshot) => ({
      ...snapshot,
      status: "saved" as const,
      updatedAt: now,
      gamma: {
        ...snapshot.gamma,
        status: hasManualLevels ? "checked" : draftGamma.status,
        source: "manual",
        sourceName: snapshot.gamma.sourceName || "@gexbot15",
        majorPositiveGamma,
        majorNegativeGamma,
        zeroGamma,
        capturedAt,
        updatedAt: now
      }
    }));

    setGammaError(null);
    setIsEditingGamma(false);
  }

  async function uploadGammaImage(file: File) {
    const validation = validateGammaImageFile(file);

    if (!validation.ok) {
      setImageUploadError(validation.error);
      return;
    }

    try {
      const imageUrl = await readGammaImageFileAsDataUrl(file);
      const now = new Date().toISOString();

      updateSnapshot((snapshot) => ({
        ...snapshot,
        status: "saved" as const,
        updatedAt: now,
        gamma: {
          ...snapshot.gamma,
          source: "uploaded_image",
          sourceName: snapshot.gamma.sourceName || "@gexbot15",
          distributionImageUrl: imageUrl,
          updatedAt: now
        }
      }));
      setImageUploadError(null);
    } catch {
      setImageUploadError("Could not read the selected image.");
    }
  }

  function handleGammaImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) {
      void uploadGammaImage(file);
    }
  }

  function handleGammaImageDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsImageDragActive(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void uploadGammaImage(file);
    }
  }

  function clearGammaImage() {
    const now = new Date().toISOString();

    updateSnapshot((snapshot) => {
      const { distributionImageUrl, ...gammaWithoutImage } = snapshot.gamma;

      return {
        ...snapshot,
        status: "saved" as const,
        updatedAt: now,
        gamma: {
          ...gammaWithoutImage,
          source: snapshot.gamma.source === "uploaded_image" ? "manual" : snapshot.gamma.source,
          sourceName: snapshot.gamma.sourceName || "@gexbot15",
          updatedAt: now
        }
      };
    });
    setImageUploadError(null);
  }

  return (
    <SectionPanel
      title="Gamma Context"
      description="Gamma distribution and peak strike context."
      action={
        <div className="gammaActions">
          <StatusBadge tone={getGammaStatusTone(savedGamma.status)}>{savedGamma.status}</StatusBadge>
          <StatusBadge tone={getGammaTone(savedGamma.regime)}>{savedGamma.regime}</StatusBadge>
          {isEditingGamma ? (
            <>
              <button className="terminalButton terminalButton--primary" type="button" onClick={saveGammaEdit}>
                Save
              </button>
              <button className="terminalButton" type="button" onClick={cancelGammaEdit}>
                Cancel
              </button>
            </>
          ) : (
            <button className="terminalButton" type="button" onClick={beginGammaEdit}>
              Edit Gamma
            </button>
          )}
        </div>
      }
    >
      <PlaceholderFrame
        label={gamma.imageSourceLabel}
        meta={`Last checked ${formatLastChecked(savedGamma.capturedAt)}`}
        variant="gamma"
      >
        {savedGamma.distributionImageUrl ? (
          <div className="gammaImagePreview">
            {/* Data URL is intentionally local-only MVP state from DailyDashboardSnapshot.gamma. */}
            <img src={savedGamma.distributionImageUrl} alt="Uploaded gamma chart for active date" />
          </div>
        ) : (
          <svg className="gammaChart" viewBox="0 0 360 260" role="img">
            <g className="gammaChart__grid">
              <path d="M42 26H328M42 62H328M42 98H328M42 134H328M42 170H328M42 206H328" />
              <path d="M180 18V224M92 18V224M268 18V224" />
            </g>
            {gammaDistribution.map((level, index) => {
              const y = 30 + index * 17;
              const width = Math.abs(level.exposure) * 1.55;
              const priorWidth = Math.abs(level.prior) * 1.15;
              const isPositive = level.exposure >= 0;
              const x = isPositive ? 180 : 180 - width;
              const priorX = level.prior >= 0 ? 180 : 180 - priorWidth;

              return (
                <g key={level.strike} className="gammaChart__strike">
                  <text x="132" y={y + 4}>{level.strike}</text>
                  <rect
                    className={isPositive ? "gammaChart__bar gammaChart__bar--positive" : "gammaChart__bar gammaChart__bar--negative"}
                    x={x}
                    y={y}
                    width={width}
                    height="5"
                    rx="2.5"
                  />
                  <rect
                    className="gammaChart__prior"
                    x={priorX}
                    y={y + 7}
                    width={priorWidth}
                    height="3"
                    rx="1.5"
                  />
                  <circle className="gammaChart__dot" cx={x + (isPositive ? width * 0.68 : width * 0.32)} cy={y + 2.5} r="2.1" />
                </g>
              );
            })}
            <path className="gammaChart__zeroLine" d="M42 132H328" />
            <path className="gammaChart__positiveLine" d="M42 115H328" />
            <path className="gammaChart__negativeLine" d="M42 149H328" />
            <g className="gammaChart__axis">
              <text x="42" y="246">-80</text>
              <text x="174" y="246">0</text>
              <text x="300" y="246">+80</text>
              <text x="128" y="15">Strike</text>
              <text x="214" y="15">Gamma Exposure</text>
            </g>
          </svg>
        )}
      </PlaceholderFrame>

      <div className="gammaImageUpload" aria-label="Gamma chart image upload">
        <label
          className={`gammaImageUpload__dropzone${isImageDragActive ? " gammaImageUpload__dropzone--active" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsImageDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsImageDragActive(true);
          }}
          onDragLeave={() => setIsImageDragActive(false)}
          onDrop={handleGammaImageDrop}
        >
          <input
            className="gammaImageUpload__input"
            type="file"
            accept={gammaImageAccept}
            onChange={handleGammaImageInputChange}
          />
          <span>Gamma Image</span>
          <strong>{savedGamma.distributionImageUrl ? "Image saved for date" : "Upload / drop image"}</strong>
          <small>PNG, JPG, WEBP / max 3 MB</small>
        </label>
        {savedGamma.distributionImageUrl ? (
          <button className="terminalButton" type="button" onClick={clearGammaImage}>
            Clear Image
          </button>
        ) : null}
        {imageUploadError ? <p className="gammaImageUpload__error">{imageUploadError}</p> : null}
      </div>

      {isEditingGamma ? (
        <div className="gammaEditStack">
          <div className="gammaEditGrid">
            <label className="gammaField">
              <span>Major Pos Gamma</span>
              <input
                inputMode="decimal"
                type="number"
                value={draftGamma.majorPositiveGamma}
                onChange={(event) => updateDraftGamma("majorPositiveGamma", event.target.value)}
              />
            </label>
            <label className="gammaField">
              <span>Major Neg Gamma</span>
              <input
                inputMode="decimal"
                type="number"
                value={draftGamma.majorNegativeGamma}
                onChange={(event) => updateDraftGamma("majorNegativeGamma", event.target.value)}
              />
            </label>
            <label className="gammaField">
              <span>Zero Gamma / Flip</span>
              <input
                inputMode="decimal"
                type="number"
                step="0.01"
                value={draftGamma.zeroGamma}
                onChange={(event) => updateDraftGamma("zeroGamma", event.target.value)}
              />
            </label>
            <label className="gammaField">
              <span>Last Checked</span>
              <input
                type="datetime-local"
                value={draftGamma.capturedAt}
                onChange={(event) => updateDraftGamma("capturedAt", event.target.value)}
              />
            </label>
            <label className="gammaField gammaField--status">
              <span>Status</span>
              <select
                value={draftGamma.status}
                onChange={(event) => updateDraftGamma("status", event.target.value as GammaStatus)}
              >
                {gammaStatusOptions.map((status) => (
                  <option value={status} key={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {gammaError ? <p className="gammaEditError">{gammaError}</p> : null}
        </div>
      ) : (
        <div className="gammaSummary">
          <div>
            <span>Major Pos Gamma</span>
            <strong>{formatNullableGammaPrice(savedGamma.majorPositiveGamma, 0)}</strong>
          </div>
          <div>
            <span>Major Neg Gamma</span>
            <strong className="gammaSummary__negative">{formatNullableGammaPrice(savedGamma.majorNegativeGamma, 0)}</strong>
          </div>
          <div>
            <span>Zero Gamma / Flip</span>
            <strong>{formatNullableGammaPrice(savedGamma.zeroGamma, 2)}</strong>
          </div>
          <div>
            <span>Last checked</span>
            <strong>{formatLastChecked(savedGamma.capturedAt)}</strong>
          </div>
          <div>
            <span>Source</span>
            <strong>{savedGamma.sourceName || "@gexbot15"}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{savedGamma.status}</strong>
          </div>
        </div>
      )}

    </SectionPanel>
  );
}
