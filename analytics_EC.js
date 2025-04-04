const axios = require('axios');
const crypto = require('crypto');

const measurementId = process.env.GA_MEASUREMENT_ID;
const apiSecret = process.env.GA_API_SECRET;

function trackEventGA4(movieTitle, genre, path) {
  const clientId = crypto.randomBytes(16).toString('hex');

  return axios.post(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, {
    client_id: clientId,
    events: [
      {
        name: "movie_review",
        params: {
          movie_title: movieTitle,
          genre: genre,
          event_path: path,
          value: 1
        }
      }
    ]
  });
}


module.exports = trackEventGA4;