const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const images = require('../components/images');

let connectedUsers = {}
let nicknames = []
let image = images.retrieveImage()

module.exports = async (server) => {
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
      io.emit('list users', nicknames);
      if (connectedUsers[socket.id]) {
        connectedUsers[socket.id].emit('image', await image);
      } else {
        console.log('Client with that ID is not connected.');
      }
    });

    socket.on('retrieve image', async () => {
      image = await images.retrieveImage()
      io.emit('image', image);
    });

    socket.on('answer', (answer) => {
      console.log(answer, image.answer, answer === image.answer);
      const regex = new RegExp(`\\b${image.answer}\\b`, 'g');
      const matches = answer.match(regex);
      let finalAnswer = `<span style="color: ${matches ? 'greenyellow' : 'red'}">${answer}</span>`

      io.emit('message', `${socket.user.username} said ${finalAnswer}` );
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
