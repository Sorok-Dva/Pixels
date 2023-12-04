let timer;
let running = false;
let hours = 0;
let minutes = 0;
let seconds = 0;
let milliseconds = 0;

function stopwatch() {
  if (!running) {
    running = true;
    timer = setInterval(updateStopwatch, 10);
    socket.emit('startTimer');
  } else {
    running = false;
    clearInterval(timer);
    socket.emit('stopTimer');
  }
}

function resetTimer() {
  clearInterval(timer);
  running = false;
  hours = 0;
  minutes = 0;
  seconds = 0;
  milliseconds = 0;
  updateStopwatch();
  socket.emit('resetTimer');
}

function updateStopwatch() {
  milliseconds += 10; // Incrémentation toutes les 10 ms
  if (milliseconds >= 1000) {
    milliseconds = 0;
    seconds++;
    if (seconds >= 60) {
      seconds = 0;
      minutes++;
      if (minutes >= 60) {
        minutes = 0;
        hours++;
      }
    }
  }

  const stopwatch = document.getElementById('stopwatch');
  stopwatch.textContent = `${formatTime(minutes)}:${formatTime(seconds)}.${formatMilliseconds(milliseconds)}`;

}

function formatTime(time) {
  return time < 10 ? `0${time}` : time;
}

function formatMilliseconds(time) {
  return time < 10 ? `00${time}` : (time < 100 ? `0${time}` : time);
}

socket.on('syncTimer', (data) => {
  running = data.running;
  hours = data.hours;
  minutes = data.minutes;
  seconds = data.seconds;

  if (running) {
    timer = setInterval(updateStopwatch, 1000);
  } else {
    clearInterval(timer);
  }

  updateStopwatch();
});
