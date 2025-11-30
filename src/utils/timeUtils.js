export function getCurrentTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const day = now.getDate();
  const month = now.toLocaleString('default', { month: 'long' });
  const time = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${year}, ${day} ${month} - ${time.toLowerCase()}`;
}

export function formatDuration(time) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  let display = '';
  if (minutes > 0) display += `${minutes}m `;
  if (seconds > 0 || minutes === 0) display += `${seconds}s`;

  return display.trim();
}

export function formatTime(time, showMilliseconds = true) {
  const totalSeconds = Math.floor(time / 1000); // Total seconds
  const milliseconds = time % 1000; // Milliseconds
  const seconds = totalSeconds % 60; // Remaining seconds
  const minutes = Math.floor(totalSeconds / 60) % 60; // Remaining minutes
  const hours = Math.floor(totalSeconds / 3600); // Hours

  const getSeconds = `0${seconds}`.slice(-2);
  const getMinutes = `0${minutes}`.slice(-2);
  const getHours = `0${hours}`.slice(-2);
  const getMilliseconds = String(milliseconds).padStart(2, '0').slice(0, 2);
  return `${getHours}:${getMinutes}:${getSeconds}${
    showMilliseconds ? '.' + getMilliseconds : ''
  }`;
}
