const WebSocket = require('ws');
const Server = new WebSocket.Server({ port: 8080 });
const fs = require('fs');

console.log('Starting Edge-o-Matic Mock Server at ws://localhost:8080');

var mockConfig = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'));
var mockInfo = JSON.parse(fs.readFileSync('./config/info.json', 'utf8'));
var mockMode = 'manual';

// Send sin wave data because why not
let sin_params = {
  pressure: {
    min: 0,
    max: 4096,
    amplitude: 2048,
    frequency: 30,
  },
  pavg: {
    min: 0,
    max: 5000,
    amplitude: 2500,
    frequency: 30,
  },
  motor: {
    min: 0,
    max: 255,
    amplitude: 127,
    frequency: 30,
  },
  arousal: {
    min: 0,
    max: 255,
    amplitude: 127,
    frequency: 100,
  },
};
var sin_state = {
  pressure: 0,
  pavg: 0,
  motor: 0,
  arousal: 0,
};

let calcuate_sin = (params, state, variable) => {
  let sin_value =
    (params[variable].max - params[variable].min) / 2 +
    Math.sin(state[variable] / params[variable].frequency) *
      params[variable].amplitude;
  state[variable] += 1;
  return sin_value;
};

Server.on('connection', (ws) => {
  console.log('Remote connected.');

  ws.on('message', (message) => {
    console.log(`Got: ${message}`);
    var commands = JSON.parse(message.toString('utf8'));
    var resp = {};

    for (var command in commands) {
      switch (command) {
        case 'info':
          resp['info'] = mockInfo;
          break;
        case 'configSet':
          if (commands['configSet']['motor_max_speed']) {
            mockConfig['motor_max_speed'] =
              commands['configSet']['motor_max_speed'];
          }

          if (commands['configSet']['wifi_on']) {
            mockConfig['wifi_on'] = commands['configSet']['wifi_on'];
          }

          if (commands['configSet']['update_frequency_hz']) {
            mockConfig['update_frequency_hz'] =
              commands['configSet']['update_frequency_hz'];
          }

          if (commands['configSet']['sensitivity_threshold']) {
            mockConfig['sensitivity_threshold'] =
              commands['configSet']['sensitivity_threshold'];
          }

          if (commands['configSet']['sensor_sensitivity']) {
            mockConfig['sensor_sensitivity'] =
              commands['configSet']['sensor_sensitivity'];
          }

        // break;
        case 'configList':
          resp['configList'] = mockConfig;
          if (commands['configList'] && 'nonce' in commands['configList']) {
            resp['configList']['nonce'] = commands['configList']['nonce'];
          }
          break;
        case 'serialCmd':
          resp['serialCmd'] = {
            text: `Enabled external bus\nOK\n`,
          };
          if (commands['serialCmd'] && 'nonce' in commands['serialCmd']) {
            resp['serialCmd']['nonce'] = commands['serialCmd']['nonce'];
          }
          break;
        case 'getWiFiStatus':
          if (mockConfig['wifi_on']) {
            resp['wifiStatus'] = {
              rssi: -56,
              ssid: 'FBI Spy-Fi',
              ip: '10.0.102.192',
            };
          } else {
            resp['wifiStatus'] = null;
          }
          break;
        case 'getSDStatus':
          resp['sdStatus'] = {
            size: 127,
            type: 'MMC',
          };
          break;
        case 'setMode':
          if (
            commands['setMode'] === 'manual' ||
            commands['setMode'] === 'automatic'
          ) {
            mockMode = commands['setMode'];
          }
          resp['mode'] = { text: mockMode };
          break;
      }
    }

    console.log(`Sending: ${JSON.stringify(resp)}`);
    ws.send(JSON.stringify(resp));
  });

  setInterval(() => {
    var readings = {
      readings: {
        pressure: calcuate_sin(sin_params, sin_state, 'pressure'),
        pavg: calcuate_sin(sin_params, sin_state, 'pavg'),
        motor: calcuate_sin(sin_params, sin_state, 'motor'),
        arousal: calcuate_sin(sin_params, sin_state, 'arousal'),
        millis: Date.now(),
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
