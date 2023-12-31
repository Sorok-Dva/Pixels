const socket = io({
  auth: { token: localStorage.getItem('jwt') } // Get token from local storage
});
let currentImage
let rasterInitialized = false;
let raster;

socket.emit('join game')

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  if (error.message.includes('Authentication error'))
    $(location).prop('href', '/');
});

socket.on('disconnect', (error) => {
  alert('connection lost');
});

socket.on('list users', users => {
  $('#players li').remove();
  const entries = Object.entries(users);
  entries.sort((a, b) => b[1].points - a[1].points);
  for (const [user, value] of entries) {
    $('#players').append(`<li class="user">${user} (${value.points} points)</li>`)
  }
});

socket.on('message', text => {
  const el = document.createElement('li');
  el.innerHTML = text;
  document.querySelector('ul').appendChild(el)
  scrollToBottom();
});

function initializeRaster(imageData) {
  paper.setup('canvas');

  $('#game').attr('src', imageData.data64);
  raster = new Raster('game');
  raster.source = imageData.data64;
  let loaded = false;

  raster.on('load', function() {
    loaded = true;
    onResize();
  });

  function moveHandler(event) {
    if (lastPos.getDistance(event.point) < 10)
      return;
    lastPos = event.point;

    const size = this.bounds.size.clone();
    const isLandscape = size.width > size.height;

    if (isLandscape) {
      size.width /= 2;
    } else {
      size.height /= 2;
    }

    let path = new Path.Rectangle({
      point: this.bounds.topLeft.floor(),
      size: size.ceil(),
      onMouseMove: moveHandler
    });
    path.fillColor = raster.getAverageColor(path);

    path = new Path.Rectangle({
      point: isLandscape
        ? this.bounds.topCenter.ceil()
        : this.bounds.leftCenter.ceil(),
      size: size.floor(),
      onMouseMove: moveHandler
    });

    path.fillColor = raster.getAverageColor(path);

    path = new Path.Rectangle({
      point: isLandscape
        ? this.bounds.topCenter.ceil()
        : this.bounds.leftCenter.ceil(),
      size: size.floor(),
      onMouseMove: moveHandler
    });
    path.fillColor = raster.getAverageColor(path);

    this.remove();
  }

  function onResize(event) {
    project.activeLayer.removeChildren();
    raster.fitBounds(view.bounds, true);

    new Path.Rectangle({
      rectangle: view.bounds,
      fillColor: raster.getAverageColor(view.bounds),
      onMouseMove: moveHandler
    });
  }

  raster.visible = false;
  let lastPos = view.center;
}

socket.on('image', image => {
  resetTimer();
  stopwatch();
  currentImage = image;

  if (!rasterInitialized) {
    initializeRaster(image);
    rasterInitialized = true;
  }

  raster.source = image.data64;
});

const processAnswer = () => {
  const answerInput = $('#answerInput')
  const text = answerInput.val().toLowerCase();
  answerInput.val('');
  if (text === '' || text === ' ') return false;
  socket.emit('answer', { answer: text, timer: timerFormatted })
  const answer = currentImage.answer.toLowerCase();
  const regexPattern = answer
    .split('')
    .map((char, index) => {
      // Rendre certains caractères facultatifs (par exemple, chaque caractère a une chance sur 5 d'être facultatif)
      return Math.random() < 0.2 ? `(${char})?` : char;
    })
    .join('');
  const regex = new RegExp(`\\b${regexPattern}\\b`, 'g');
  const matches = text.match(regex);
  if (currentImage.answer.includes(text) || (matches)) {
    console.log('good answer')
    project.activeLayer.removeChildren();
    socket.emit('retrieve image')
  } else console.log('bad answer')
}

$('#sendAnswer').click(() => processAnswer());
$('#answerInput').keypress((event) => {
  if (event.key === 'Enter') processAnswer();
});

const scrollToBottom = () => {
  $('#answers').animate({
    scrollTop: $('#answers')[0].scrollHeight
  }, 'fast');
}

document.onkeydown = (e) => {
  if (e.key == 123) {
    e.preventDefault();
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'I') {
    e.preventDefault();
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    e.preventDefault();
  }
  if (e.ctrlKey && e.shiftKey && e.key === 'J') {
    e.preventDefault();
  }
  if (e.ctrlKey && e.key === 'U') {
    e.preventDefault();
  }
};
