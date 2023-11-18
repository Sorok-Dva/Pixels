const socket = io({
  auth: { token: localStorage.getItem('jwt') } // Get token from local storage
});

socket.emit('join game')
console.log('join game')
socket.on('message', text => {
  const el = document.createElement('li');
  el.innerHTML = text;
  document.querySelector('ul').appendChild(el)
});

socket.on('image', image => {
  paper.setup('canvas');

  $('#game').attr('src', image.data64)
  const raster = new Raster('game');
  raster.source = image.data64;
  let loaded = false;

  raster.on('load', function() {
    loaded = true;
    onResize();
  });

  raster.visible = false;

  let lastPos = view.center;

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

  document.querySelector('button').onclick = () => {
    const answerInput = $('#answerInput')
    const text = answerInput.val();
    answerInput.val('');
    socket.emit('answer', text)
    const regex = new RegExp(`\\b${image.answer}\\b`, 'g');
    const matches = text.match(regex);
    console.log(matches)
    if (matches) {
      console.log('good answer')
      project.activeLayer.removeChildren();
      socket.emit('retrieve image')
    } else console.log('bad answer')
  }
});