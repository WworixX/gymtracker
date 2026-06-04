'use client';

interface TooltipPayloadItem {
  value: number;
  payload: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  unit?: string;
  labelKey?: string;
}

export function ChartTooltip({ active, payload, unit = '', labelKey = 'date' }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const label = item.payload?.[labelKey];
  return (
    <div
      style={{
        background: '#18181f',
        border: '0.5px solid rgba(200,245,66,0.2)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(200,245,66,0.1)',
      }}
    >
      <p style={{ color: '#c8f542', fontFamily: 'DM Mono, monospace', fontSize: 16, margin: 0, fontWeight: 500 }}>
        {item.value}{unit}
      </p>
      {label != null && (
        <p style={{ color: '#4a4a5a', fontSize: 11, margin: '2px 0 0', fontFamily: 'Outfit, sans-serif' }}>
          {String(label)}
        </p>
      )}
    </div>
  );
}
