document.getElementById('theme-toggle').onclick = () => {
  document.body.classList.toggle('dark');
};

const audio = document.getElementById('bg-audio');
const audioToggle = document.getElementById('audio-toggle');
let isPlaying = false;

audioToggle.onclick = () => {
  if (isPlaying) {
    audio.pause();
    audioToggle.textContent = '🔔';
  } else {
    audio.play();
    audioToggle.textContent = '🔕';
  }
  isPlaying = !isPlaying;
};