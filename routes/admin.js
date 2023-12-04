const express = require('express');
const router = express.Router();
const Models = require('../orm/models/index')
const imageHelper = require('../helpers/image')

/* GET admin image */
router.get('/images/:id', async (req, res, next) => {
  await Models.Images.findOne({
    fields: ['data64', 'answer'],
    where: {
      id: req.params.id,
    }
  }).then((image) => {
    res.render(`admin/images/view`, { image });
  }).catch(error => {
    console.log('Fail to retrieve image from database.', error)
  })
})

/* GET admin images add. */
router.get('/images/add', (req, res, next) => {
  res.render('admin/images/add');
});

/* POST admin add image */
router.post('/images/add', (req, res, next) => {
  const imageUrl = req.body.url;
  imageHelper.imageUrlToBase64(imageUrl)
    .then(async base64Data => {
      await Models.Images.create({
        data64: base64Data,
        answer: req.body.answer,
        validated: true,
      }).then((image) => {
        res.redirect(`/admin/images/${image.id}`);
      }).catch(error => {
        console.log('Fail to add image into database.', error)
      })
    })
    .catch(error => {
      console.error('An error has occurred:', error);
    });
})

module.exports = router;
