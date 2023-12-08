const Sequelize = require('sequelize')
const { Op } = Sequelize;
const Models = require(`../orm/models/index`);

const excludedIds = [];

const images = {
  retrieveImage: async () => {
    console.log('new image requested')
    return await Models.Images.findAll({
      order: Sequelize.literal('rand()'),
      limit: 1,
      where: {
        id: {
          [Op.notIn]: excludedIds,
        },
      }
    }).then((image) => {
      excludedIds.push(image[0].id)
      console.log('the image is : ', image[0].answer)
      return {
        data64: image[0].data64,
        answer: image[0].answer,
      };
    });
  }
}

module.exports = images;
