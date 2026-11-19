"use client";
import React, { useId, useState } from "react";

export interface SparkPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface SparkAreaChartProps {
  data: SparkPoint[];
  unit: string;
  accentColor?: string;
  secondaryLabel?: string;
  primaryLabel?: string;
  thresholdValue?: number;
  thresholdLabel?: string;
  height?: number;
}

/**
 * Zero-dependency responsive SVG area chart for low-end field devices.
 * Replaces Chart.js with <2ms CPU render cost and crisp vector output.
 */
export function SparkAreaChart({
  data,
  unit,
  accentColor = "#06b6d4",
  primaryLabel = "Value",
  secondaryLabel,
  thresholdValue,
  thresholdLabel,
  height = 170,
}: SparkAreaChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const gradId = useId();

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-gray-500 border border-dashed border-[#242a36] rounded-lg"
        style={{ height }}
      >
        No telemetry series available
      </div>
    );
  }

  const width = 520;
  const padL = 36;
  const padR = 12;
  const padT = 16;
  const padB = 26;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const allValues = data.flatMap((d) =>
    d.secondaryValue !== undefined ? [d.value, d.secondaryValue] : [d.value]
  );
  if (thresholdValue !== undefined) {
    allValues.push(thresholdValue);
  }

  let minVal = Math.min(...allValues);
  let maxVal = Math.max(...allValues);
  if (minVal === maxVal) {
    minVal -= 5;
    maxVal += 5;
  } else {
    const margin = (maxVal - minVal) * 0.15;
    minVal = Math.floor(minVal - margin);
    maxVal = Math.ceil(maxVal + margin);
  }

  const scaleX = (idx: number) =>
    data.length <= 1
      ? padL + innerW / 2
      : padL + (idx / (data.length - 1)) * innerW;

  const scaleY = (v: number) =>
    padT + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

  const pointsStr = data
    .map((d, i) => `${scaleX(i).toFixed(1)},${scaleY(d.value).toFixed(1)}`)
    .join(" ");

  const areaPath = `M ${scaleX(0).toFixed(1)},${(padT + innerH).toFixed(1)} L ${pointsStr.replace(/ /g, " L ")} L ${scaleX(data.length - 1).toFixed(1)},${(padT + innerH).toFixed(1)} Z`;

  const hasSecondary = data.some((d) => d.secondaryValue !== undefined);
  const secondaryStr = hasSecondary
    ? data
        .map(
          (d, i) =>
            `${scaleX(i).toFixed(1)},${scaleY(d.secondaryValue ?? d.value).toFixed(1)}`
        )
        .join(" ")
    : "";

  const activeIndex = hoverIdx !== null ? hoverIdx : 0;
  const activePoint = data[activeIndex];
  const thresholdY =
    thresholdValue !== undefined ? scaleY(thresholdValue) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono tabular-nums text-gray-400">
        <span>
          {activePoint.label}:{" "}
          <strong className="text-gray-100">
            {primaryLabel} {activePoint.value}
            {unit}
          </strong>
          {activePoint.secondaryValue !== undefined && secondaryLabel && (
            <span className="ml-2 text-amber-400">
              {secondaryLabel} {activePoint.secondaryValue}
              {unit}
            </span>
          )}
        </span>
        <span>
          Min {Math.min(...data.map((d) => d.value))}
          {unit} · Max {Math.max(...data.map((d) => d.value))}
          {unit}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible select-none"
        style={{ height }}
        role="img"
        aria-label={`${primaryLabel} trend chart`}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal reference grid */}
        {[0, 0.5, 1].map((ratio) => {
          const val = Math.round(minVal + (maxVal - minVal) * ratio);
          const y = scaleY(val);
          return (
            <g key={ratio}>
              <line
                x1={padL}
                x2={width - padR}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                fill="#6b7280"
                fontSize="10"
                className="font-mono tabular-nums"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Safety threshold line */}
        {thresholdY !== null && (
          <g>
            <line
              x1={padL}
              x2={width - padR}
              y1={thresholdY}
              y2={thresholdY}
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {thresholdLabel && (
              <text
                x={width - padR}
                y={thresholdY - 4}
                textAnchor="end"
                fill="#f87171"
                fontSize="9"
                className="font-mono"
              >
                {thresholdLabel}
              </text>
            )}
          </g>
        )}

        <path d={areaPath} fill={`url(#${gradId})`} />

        {hasSecondary && (
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            points={secondaryStr}
          />
        )}

        <polyline
          fill="none"
          stroke={accentColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsStr}
        />

        {/* Active cursor line & marker */}
        <circle
          cx={scaleX(activeIndex)}
          cy={scaleY(activePoint.value)}
          r="4"
          fill={accentColor}
          stroke="#0d1015"
          strokeWidth="1.5"
        />

        {/* X axis start / mid / end labels */}
        {[0, Math.floor((data.length - 1) / 2), data.length - 1]
          .filter((idx, i, arr) => arr.indexOf(idx) === i)
          .map((idx) => (
            <text
              key={idx}
              x={scaleX(idx)}
              y={height - 6}
              textAnchor={
                idx === 0 ? "start" : idx === data.length - 1 ? "end" : "middle"
              }
              fill="#6b7280"
              fontSize="10"
              className="font-mono"
            >
              {data[idx]?.label}
            </text>
          ))}

        {/* Invisible hit bands for snappy hover without DOM churn */}
        {data.map((_, i) => {
          const bandW = innerW / data.length;
          return (
            <rect
              key={i}
              x={padL + i * bandW}
              y={padT}
              width={Math.max(bandW, 8)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
          );
        })}
      </svg>
    </div>
  );
}

export interface BarSeriesItem {
  label: string;
  primary: number;
  secondary?: number;
  tertiary?: number;
}

interface BarBreakdownChartProps {
  items: BarSeriesItem[];
  primaryLabel: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  emptyText?: string;
}

/**
 * Pure-CSS column chart for maintenance counts and shift workload reports.
 */
export function BarBreakdownChart({
  items,
  primaryLabel,
  secondaryLabel,
  tertiaryLabel,
  primaryColor = "bg-cyan-500",
  secondaryColor = "bg-amber-500",
  tertiaryColor = "bg-emerald-500",
  emptyText = "No records found for this selection.",
}: BarBreakdownChartProps) {
  if (!items || items.length === 0) {
    return (
      <div className="flex items-center justify-center h-44 text-xs text-gray-500 border border-dashed border-[#242a36] rounded-lg">
        {emptyText}
      </div>
    );
  }

  const maxTotal = Math.max(
    1,
    ...items.map(
      (item) => item.primary + (item.secondary ?? 0) + (item.tertiary ?? 0)
    )
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-sm ${primaryColor}`} />
          {primaryLabel}
        </span>
        {secondaryLabel && (
          <span className="inline-flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${secondaryColor}`} />
            {secondaryLabel}
          </span>
        )}
        {tertiaryLabel && (
          <span className="inline-flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${tertiaryColor}`} />
            {tertiaryLabel}
          </span>
        )}
      </div>

      <div className="grid grid-flow-col auto-cols-fr gap-2 items-end h-44 pt-6 pb-1 px-2 border-b border-[#242a36]">
        {items.map((item) => {
          const total =
            item.primary + (item.secondary ?? 0) + (item.tertiary ?? 0);
          const pH = Math.round((item.primary / maxTotal) * 100);
          const sH = Math.round(((item.secondary ?? 0) / maxTotal) * 100);
          const tH = Math.round(((item.tertiary ?? 0) / maxTotal) * 100);

          return (
            <div
              key={item.label}
              className="flex flex-col items-center justify-end h-full gap-1.5 min-w-0 group"
              title={`${item.label}: ${total}`}
            >
              <span className="text-[11px] font-mono tabular-nums text-gray-400 group-hover:text-white">
                {total}
              </span>
              <div className="w-full max-w-[36px] flex flex-col-reverse justify-start flex-1 bg-[#10141c] rounded-t-md overflow-hidden border border-[#242a36]/70">
                {item.primary > 0 && (
                  <div
                    className={`${primaryColor} w-full`}
                    style={{ height: `${Math.max(pH, 6)}%` }}
                  />
                )}
                {(item.secondary ?? 0) > 0 && (
                  <div
                    className={`${secondaryColor} w-full`}
                    style={{ height: `${Math.max(sH, 6)}%` }}
                  />
                )}
                {(item.tertiary ?? 0) > 0 && (
                  <div
                    className={`${tertiaryColor} w-full`}
                    style={{ height: `${Math.max(tH, 6)}%` }}
                  />
                )}
              </div>
              <span className="text-[10px] font-mono text-gray-400 truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
