const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const images = require('../components/images');

let connectedUsers = {}
let users = {}

module.exports = async (server) => {
  let image = await images.retrieveImage()

  const io = socketIO(server);
  // Middleware for JWT authentication
  const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) reject(err);
        resolve(decoded);
      });
    });
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = await verifyToken(token);
      socket.user = decoded.user; // Attach user info to the socket
      next();
    } catch (err) {
      next(new Error(`Authentication error (${err.message})`));
    }
  }).on('connection', (socket) => {
    console.log('New user connected:', socket.user.username);
    // Store the client's socket ID
    connectedUsers[socket.id] = socket;

    console.log('nickname before verification', users)
    if (socket.user.username in users) {
      connectedUsers[socket.id].emit('nicknameTaken');
      console.log('nickname taken', socket.user.username in users)
    }
    else users[socket.user.username] = {
      points: 0
    };

    io.emit('list users', users);

    socket.on('join game', async () => {
      io.emit('list users', users);
      if (connectedUsers[socket.id]) {
        connectedUsers[socket.id].emit('image', image);
      } else {
        console.log('Client with that ID is not connected.');
      }
    });

    socket.on('retrieve image', async () => {
      image = await images.retrieveImage()
      io.emit('image', image);
    });

    socket.on('answer', async (data) => {
      try {
        console.log(data, image.answer, data.answer === image.answer);
        const answer = image.answer.toLowerCase();
        const regexPattern = answer
          .split('')
          .map((char, index) => {
            // Rendre certains caractères facultatifs (par exemple, chaque caractère a une chance sur 4 d'être facultatif)
            return Math.random() < 0.25 ? `(${char})?` : char;
          })
          .join('');
        const regex = new RegExp(`\\b${regexPattern}\\b`, 'gi'); // 'i' pour l'insensibilité à la casse
        const matches = data.answer.toLowerCase().match(regex) || answer.includes(data.answer);
        let finalAnswer = `<span style="color: ${matches ? 'green' : 'red'}">${data.answer}</span>`;
        let timer = matches ? `<small>(${data.timer})</small>` : '';
        users[socket.user.username].points = matches
          ? ++users[socket.user.username].points
          : users[socket.user.username].points;
        io.emit('message', `${socket.user.username} said ${finalAnswer} ${timer}`);
        io.emit('list users', users);
      } catch (error) {
        console.error('Error retrieving image or handling answer:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.username);
      delete connectedUsers[socket.id];
      delete users[socket.user.username]
      io.emit('list users', users);
    });
  });
}
