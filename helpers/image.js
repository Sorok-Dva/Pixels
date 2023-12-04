const axios = require('axios');
const fs = require('fs');

const imageUrlToBase64 = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'];
    const buffer = Buffer.from(response.data, 'binary').toString('base64');
    const base64Data = `data:${contentType};base64,${buffer}`;
    return base64Data;
  } catch (error) {
    console.error('Error converting image to Base64:', error);
    throw error;
  }
}

module.exports = {
  imageUrlToBase64,
}
