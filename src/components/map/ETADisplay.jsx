/**
 * ETA countdown: "Arriving in X minutes". Auto-updates every second when using targetTime.
 * Can show static duration (durationSeconds) or live countdown (targetTime).
 */
import { useState, useEffect } from 'react';

function formatMinutes(seconds) {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) return '--';
  const mins = Math.max(0, Math.ceil(seconds / 60));
  if (mins === 0) return 'Less than 1 min';
  return mins === 1 ? '1 min' : `${mins} min`;
}

export default function ETADisplay({
  durationSeconds,
  targetTime,
  label = 'Arriving in',
  className = '',
}) {
  const [liveSeconds, setLiveSeconds] = useState(null);

  // Live countdown from targetTime (updates every second)
  useEffect(() => {
    if (!targetTime) {
      setLiveSeconds(null);
      return;
    }
    const target = targetTime instanceof Date ? targetTime.getTime() : new Date(targetTime).getTime();

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((target - now) / 1000));
      setLiveSeconds(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const displaySeconds = liveSeconds !== null ? liveSeconds : durationSeconds;
  const text = displaySeconds !== null ? formatMinutes(displaySeconds) : '--';

  return (
    <div className={className}>
      <span className="text-text-secondary">{label} </span>
      <span className="font-semibold text-text-primary">{text}</span>
    </div>
  );
}
