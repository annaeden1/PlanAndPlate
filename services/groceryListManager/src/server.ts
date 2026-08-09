import { Express } from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { initApp } from './index';
import { getServerBaseUrl } from './utils/serverBaseUrl';

const PORT = process.env.PORT || 8080;

initApp()
  .then((app: Express) => {
    if (process.env.NODE_ENV === 'development') {
      http
        .createServer(app)
        .listen(PORT, () =>
          console.log(`Development Server is running on ${getServerBaseUrl()}`),
        );
    } else if (process.env.NODE_ENV === 'production') {
      const options = {
        key: fs.readFileSync('../../key.pem'),
        cert: fs.readFileSync('../../cert.pem'),
      };
      https
        .createServer(options, app)
        .listen(PORT, () =>
          console.log(`Production Server is running on ${getServerBaseUrl()}`),
        );
    }
  })
  .catch((err) => {
    console.error('Failed to run server:', err);
    process.exit(1);
  });