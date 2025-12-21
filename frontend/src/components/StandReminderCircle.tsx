import { useState, useEffect } from 'react';

export function StandReminderCircle() {
  const intervalMinutes = 30;
  const [minutesRemaining, setMinutesRemaining] = useState(intervalMinutes);
  const [lastStandTime, setLastStandTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const elapsedMinutes = Math.floor((now.getTime() - lastStandTime.getTime()) / (1000 * 60));
      const remaining = intervalMinutes - elapsedMinutes;
      
      setMinutesRemaining(remaining);

      // Auto-reset after 1 minute of showing "Stand!"
      if (remaining <= -1) {
        setLastStandTime(new Date());
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastStandTime]);

  const handleReset = () => {
    setLastStandTime(new Date());
    setMinutesRemaining(intervalMinutes);
  };

  // Determine colors and animations based on time remaining
  let bgColor = '';
  let pulseClass = '';
  
  if (minutesRemaining <= 0) {
    // Time to stand NOW!
    bgColor = 'bg-red-500';
    pulseClass = 'animate-pulse-strong';
  } else if (minutesRemaining <= 5) {
    // 0-5 minutes - Red (no pulse yet)
    bgColor = 'bg-red-500';
    pulseClass = '';
  } else if (minutesRemaining <= 10) {
    // 5-10 minutes - Yellow
    bgColor = 'bg-yellow-400';
    pulseClass = '';
  } else {
    // >10 minutes - Green
    bgColor = 'bg-green-500';
    pulseClass = '';
  }

  const displayText = minutesRemaining <= 0 ? 'Stand!' : minutesRemaining + 'm';
  const titleText = minutesRemaining <= 0 
    ? 'Time to stand up! Click to reset' 
    : minutesRemaining + ' minutes until stand reminder. Click to reset';

  const classes = `fixed top-5 right-5 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-lg hover:scale-110 transition-transform select-none z-50 ${bgColor} ${pulseClass}`;

  return (
    <div
      onClick={handleReset}
      className={classes}
      title={titleText}
    >
      {displayText}
    </div>
  );
}