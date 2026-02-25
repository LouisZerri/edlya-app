import 'dotenv/config';

const appJson = require('./app.json');

if (!process.env.API_URL) {
  console.warn(
    '[Edlya] API_URL non défini dans .env — copier .env.example vers .env et renseigner l\'URL',
  );
}

export default {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    apiUrl: process.env.API_URL,
  },
};
