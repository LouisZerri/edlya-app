import 'dotenv/config';

const appJson = require('./app.json');

export default {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    apiUrl: process.env.API_URL || 'https://dorathy-perspectiveless-besiegingly.ngrok-free.dev',
  },
};
