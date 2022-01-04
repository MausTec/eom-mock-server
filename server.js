const WebSocket = require('ws');
const Server = new WebSocket.Server({ port: 8080 });

console.log('Starting Edge-o-Matic Mock Server at ws://localhost:8080');

var mockConfig = {
  motor_max_speed: 255,
  wifi_on: true,
  update_frequency_hz: 50,
};
var mockMode = 'manual';

Server.on('connection', (ws) => {
  console.log('Remote connected.');

  ws.on('message', (message) => {
    console.log(`Got: ${message}`);
    var resp = {};

    for (var command in message) {
      switch (command) {
        case 'configSet':
          if (message['configSet']['motor_max_speed']) {
            mockConfig['motor_max_speed'] =
              message['configSet']['motor_max_speed'];
          }

          if (message['configSet']['wifi_on']) {
            mockConfig['wifi_on'] = message['configSet']['wifi_on'];
          }

          if (message['configSet']['update_frequency_hz']) {
            mockConfig['update_frequency_hz'] =
              message['configSet']['update_frequency_hz'];
          }

          break;
        case 'configList':
          resp['configList'] = {};
          resp['configList']['config'] = mockConfig;
          if (message['configList']['nonce']) {
            resp['configList']['nonce'] = message['configList']['nonce'];
          }
          break;
        case 'serialCmd':
          resp['serialCmd'] = {
            text: `Enabled external bus\nOK\n`,
          };
          if (message['serialCmd']['nonce']) {
            resp['serialCmd']['nonce'] = message['serialCmd']['nonce'];
          }
          break;
        case 'getWiFiStatus':
          if (mockConfig['wifi_on']) {
            resp['getWiFiStatus'] = {
              rssi: -56,
              ssid: 'FBI Spy-Fi',
              ip: '10.0.102.192',
            };
          } else {
            resp['getWiFiStatus'] = null;
          }
          break;
        case 'getSDStatus':
          resp['getSDStatus'] = {
            size: 127,
            type: 'MMC',
          };
          break;
        case 'setMode':
          if (
            message['setMode'] === 'manual' ||
            message['setMode'] === 'automatic'
          ) {
            mockMode = message['setMode'];
          }
          resp['setMode'] = mockMode;
          break;
      }
    }

    ws.send(JSON.stringify(resp));
  });

  setInterval(() => {
    var readings = {
      readings: {
        pressure: 1029,
        pavg: 1028,
        motor: 255,
        arousal: 10,
        millis: 198452,
      },
    };
    ws.send(JSON.stringify(readings));
  }, 1000 / mockConfig['update_frequency_hz']);
});

process.on('SIGTERM', () => {
  Server.close(() => {
    process.exit(0);
  });
});
