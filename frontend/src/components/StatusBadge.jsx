const STATUS_MAP = {
  /* Asset */
  Available:      { color: 'var(--success)', bg: 'var(--success-bg)',  border: 'var(--success-border)' },
  Allocated:      { color: 'var(--accent)',  bg: 'var(--info-bg)',     border: 'var(--info-border)'    },
  Maintenance:    { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)'  },
  Retired:        { color: 'var(--text-muted)', bg: 'rgba(138,147,165,0.08)', border: 'rgba(138,147,165,0.2)' },
  /* Booking */
  Confirmed:      { color: 'var(--success)', bg: 'var(--success-bg)',  border: 'var(--success-border)' },
  Pending:        { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)'  },
  Cancelled:      { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)'   },
  /* Maintenance */
  'In Progress':  { color: 'var(--accent)',  bg: 'var(--info-bg)',     border: 'var(--info-border)'    },
  Approved:       { color: 'var(--success)', bg: 'var(--success-bg)',  border: 'var(--success-border)' },
  Resolved:       { color: 'var(--text-muted)', bg: 'rgba(138,147,165,0.08)', border: 'rgba(138,147,165,0.2)' },
  /* Allocation */
  Active:         { color: 'var(--success)', bg: 'var(--success-bg)',  border: 'var(--success-border)' },
  Returned:       { color: 'var(--text-muted)', bg: 'rgba(138,147,165,0.08)', border: 'rgba(138,147,165,0.2)' },
  /* Priority */
  High:           { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)'   },
  Medium:         { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)'  },
  Low:            { color: 'var(--success)', bg: 'var(--success-bg)',  border: 'var(--success-border)' },
  /* Employee */
  Inactive:       { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'var(--danger-border)'   },
};

const DEFAULT = {
  color: 'var(--text-muted)',
  bg:    'rgba(138,147,165,0.08)',
  border:'rgba(138,147,165,0.18)',
};

export default function StatusBadge({ status, showDot = true, size = 'sm' }) {
  const cfg = STATUS_MAP[status] || DEFAULT;

  const paddings = { xs: '2px 7px', sm: '3px 9px', md: '4px 12px' };
  const fontSizes = { xs: '0.65rem', sm: '0.72rem', md: '0.8rem' };
  const dotSizes  = { xs: 4, sm: 5, md: 6 };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: paddings[size] || paddings.sm,
        borderRadius: '9999px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: fontSizes[size] || fontSizes.sm,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }}
    >
      {showDot && (
        <span
          style={{
            width:  dotSizes[size] || 5,
            height: dotSizes[size] || 5,
            borderRadius: '50%',
            background: cfg.color,
            flexShrink: 0,
            boxShadow: `0 0 4px ${cfg.color}`,
          }}
        />
      )}
      {status}
    </span>
  );
}
