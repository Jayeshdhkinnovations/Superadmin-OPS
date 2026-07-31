import express from 'express';
import cors from 'cors';
import { ParseServer } from 'parse-server';
import { appId, masterKey, serverUrl, port } from './Utils.js';

export const config = {
  databaseURI: process.env.MONGODB_URI || 'mongodb://localhost:27030/SuperAdminDB',
  cloud: function () {
    import('./cloud/main.js');
  },
  appId,
  masterKey,
  serverURL: serverUrl,
  publicServerURL: serverUrl,
  masterKeyIps: ['0.0.0.0/0', '::/0'],
  allowClientClassCreation: true,
  logLevel: 'error',
};

export const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = new ParseServer(config);
await server.start();
app.use('/app', server.app);

app.get('/', function (req, res) {
  res.status(200).send('superadmin-server is running !!!');
});

app.listen(port, function () {
  console.log('superadmin-server running on port ' + port + '.');
});
