const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const images = require('../components/images');

let connectedUsers = {}
let nicknames = []

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

// Socket.io logic
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
    connectedUsers[socket.id].user.points = 0;
    console.log(connectedUsers);

    console.log('nickname before verification', nicknames)
    if (nicknames.map(n => n.toLowerCase()).includes(socket.user.username.toLowerCase())) {
      connectedUsers[socket.id].emit('nicknameTaken');
      console.log('nickname taken', nicknames.map(n => n.toLowerCase()).includes(socket.user.username.toLowerCase()))
    }
    else nicknames.push(socket.user.username)
    // Handle game events, chat, etc.
    io.emit('list users', nicknames);

    socket.on('check nickname availability', (nickname) => {
      console.log('check nickname availability')
      if (nicknames.map(n => n.toLowerCase()).includes(nickname.toLowerCase()))
        connectedUsers[socket.id].emit('nicknameTaken', true);
      else {
        nicknames.push(socket.user.username)
        connectedUsers[socket.id].emit('nicknameTaken', false);
      }
    })

    socket.on('join game', async () => {
      const users = nicknames.map(u => ({ name: u, points: 0}))
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
        const regex = new RegExp(`\\b${image.answer}\\b`, 'g');
        const matches = data.answer.match(regex);
        let finalAnswer = `<span style="color: ${matches ? 'green' : 'red'}">${data.answer}</span>`;
        let timer = matches ? `<small>(${data.timer})</small>` : '';
        connectedUsers[socket.id].points = matches ? connectedUsers[socket.id].points++ : + 0;
        io.emit('message', `${socket.user.username} said ${finalAnswer} ${timer}`);
      } catch (error) {
        console.error('Error retrieving image or handling answer:', error);
      }
    });

    // Disconnect event
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.username);
      delete connectedUsers[socket.id];
      nicknames = nicknames.filter(item => item !== socket.user.username)
      io.emit('list users', nicknames);
    });
  });
}
