const Sequelize = require('sequelize')
const Models = require(`../orm/models/index`);

const images = {
  retrieveImage: async () => {
    console.log('new image requested')
    return await Models.Images.findAll({ order: Sequelize.literal('rand()'), limit: 1 }).then((image) => {
      console.log('the image is : ', image[0].answer)
      return {
        data64: image[0].data64,
        answer: image[0].answer,
      };
    });
  }
}

module.exports = images;
