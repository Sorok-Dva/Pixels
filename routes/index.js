const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

/* Post Login page (jwt) */
router.post('/login', (req, res) => {
  const user = { username: req.body.username };
  const token = jwt.sign({ user }, process.env.SECRET, { expiresIn: '24h' }); // Create JWT token
  res.json({ token });
});

/* GET game page */
router.get('/game', async (req, res, next) => {
  res.render('game')
})

module.exports = router;
