(function(ext) {
  //MindMakers ScratchX extension for mBot working via own BLE server and WebSocket
  //v3.3 validando desconexão
  var myStatus = 1,
    myMsg = 'not_ready',
    clienteConectadoMBOT = false,
    clientMBOT = null;

  const SUBSCRICAO = 'subscricao',
    LINESENSOR = 'linesensor',
    ULTRASOUNDSENSOR = 'ultrasoundsensor',
    LIGHTSENSOR = 'lightsensor',
    BUTTON = 'button',
    BUTTON_PRESSED = 'pressed',
    BUTTON_RELEASED = 'released',
    IRSENSOR = 'irsensor',
    BUZZER = 'buzzer',
    DCMOTORM1 = 'dcmotorm1',
    DCMOTORM2 = 'dcmotorm2',
    DCMOTOR_FORWARD = 'forward',
    DCMOTOR_BACK = 'back',
    DCMOTORS = 'dcmotors',
    DCMOTORS_BACK = 'dcmotorsBack',
    DCMOTORS_RIGMetadeHT = 'dcmotorsRight',
    DCMOTORS_LEFT = 'dcmotorsLeft',
    SERVOMOTOR = 'servomotor',
    LEDLEFT = 'ledleft',
    LEDRIGHT = 'ledright',
    LEDBOTH = 'ledboth',
    PLAYNOTE = 'playnote';

  var ultimoComandoValorMap = new Map();
  var ultimoComandoDateMap = new Map();


  var line = 0;
  var light = 0;
  var ultrasound = 0;

  // pressed ou released
  var button, lastbutton;

  // tecla
  var ir, lastir;

  var lastmsg = +new Date();

  function recebeValor(componente, valor) {
    console.log('componente', componente);
    console.log('valor', valor);

    clienteConectadoMBOT = true;

    if (componente == LINESENSOR) {
      line = parseInt(valor);
      console.log('recebeu: ' + componente + ',' + valor + ',line: ' + line);

    } else if (componente == ULTRASOUNDSENSOR) {
      ultrasound = Math.trunc(parseFloat(valor));
      console.log('recebeu: ' + componente + ',' + valor + ',ultrasound: ' + ultrasound);

    } else if (componente == LIGHTSENSOR) {
      light = Math.trunc(parseFloat(valor));
      console.log('recebeu: ' + componente + ',' + valor + ',light: ' + light);

    } else if (componente == BUTTON) {
      button = valor;
      if (lastbutton != button) {
        lastbutton = button;
        console.log('button:', +button);
        console.log('e tem tipo:', typeof(button));
      }

    } else if (componente == IRSENSOR) {
      ir = valor;
      if (lastir != ir) {
        lastir = ir;
        console.log('ir:', +ir);
        console.log('e tem tipo:', typeof(ir));
      }

    } else {
      console.log('caiu no else do recebeValor. Componente,valor:' + componente + ',' + valor);

    }
  }

  //----Inicia websocket----//

  function statusConnection() {

    if (clienteConectadoMBOT) {

      //alert('WS client already connected ' + JSON.stringify(clientMBOT));
      return;

    } else {

      clientMBOT = new WebSocket("ws://127.0.0.1:8081", 'echo-protocol');
      //console.log('WebSocket Client Trying to Connect');

      clientMBOT.onopen = function() {

        var msg = JSON.stringify({
          "command": "ready"
        });

        clienteConectadoMBOT = true;
        myStatus = 2;
        myMsg = 'ready';

        clientMBOT.send(msg);
        console.log('WebSocket Client Connected');

        sendMessagemBot(SUBSCRICAO, "true,true,true"); //simple subscription

      };

      clientMBOT.onmessage = function(message) {

        clienteConectadoMBOT = true;
        myStatus = 2;
        myMsg = 'ready';

        var componenteValor = message.data.split(',');
        //console.log('componenteValor[0]: ' + componenteValor[0] + ' componenteValor[1]: ' + componenteValor[1]);

        if (componenteValor[0] && componenteValor[1])
          recebeValor(componenteValor[0], componenteValor[1]);

      };

      clientMBOT.onerror = function() {
        myStatus = 1;
        myMsg = 'not_ready'

        console.log('Erro de conexão');
        registraDesconexaoMBOT();
      };

      clientMBOT.onclose = function(e) {
        myStatus = 1;
        myMsg = 'not_ready'

        console.log('echo-protocol Client Closed');
        registraDesconexaoMBOT();

        //tenta reconectar 10 segundos depois de fechar a conexão
        // setTimeout(statusConnection, 10000);
      };

      // if (clienteConectadoMBOT == 'false') {
      //   setTimeout(statusConnection, 10000);
      // }
    }
  };

  //1st time calling function
  statusConnection();

  function registraDesconexaoMBOT(dado) {
    console.log('entrou para deregistrar');
    clienteConectadoMBOT = false;

    if (clientMBOT || clientMBOT !== undefined) {
      clientMBOT.close();
      console.log('Connection closed');
    }

    var clientMBOT = null;

  }

  function sendMessagemBot(comando, valor, cb) {
    if (clienteConectadoMBOT == false) {
      statusConnection();
    }

    var dif = 0;

    try {
      dif = new Date() - ultimoComandoDateMap.get(comando);
    } catch (e) {}

    if (comando == BUZZER && ultimoComandoValorMap.get(BUZZER)) {
      var tmin = ultimoComandoValorMap.get(comando)
      tmin = eval(beat) * 1000;
      console.log('tmin ' + tmin);
    }

    if ((comando == BUZZER && dif < 200) || (comando != BUZZER && (ultimoComandoValorMap.get(comando) == valor && dif < 500))) {
      console.log('return para evitar travamento mbot')
      return
    }


    ultimoComandoValorMap.set(comando, valor);
    ultimoComandoDateMap.set(comando, new Date());


    waitForSocketConnectionMBOT(clientMBOT, function() {
      //alert(comandoMBOT + ',' + valorMBOT)
      clientMBOT.send(JSON.stringify({
        comando: comando,
        valor: valor
      }));

      waitForSocketConnectionMBOT(clientMBOT, function() {
        //console.log('mBot comando: ' + comandoMBOT + ' valor: ' + valorMBOT);
        if (cb !== undefined) {
          cb(comando, valor);
        }
      });

    });
  };

  function waitForSocketConnectionMBOT(socket, callback) { //Valida que ws está aberta antes de mandar msg
    setTimeout(
      function() {
        if (socket.readyState === socket.OPEN) {
          if (callback !== undefined) {
            callback();
          }
          return;
        } else {
          waitForSocketConnectionMBOT(socket, callback);
        }
      }, 5);
  };

  //----Termina websocket----//


  //-----mBot Blocks----//

  ext.runBot = function(speed) {
    if (clienteConectadoMBOT == false) {
      statusConnection();
    } else {
      speed = parseInt(speed, 10);

      if (!lastmsg) {
        var lastmsg = -1
      }

      if (speed != lastmsg) {
        //tentativa de tratar mensagens duplicadas
        lastmsg = speed;

        if (speed == undefined || speed == '') {
          speed = 0;
        } else if (speed > 255) {
          speed = 255;
        } else if (speed < -255) {
          speed = -255;
        }

        if (speed >= 0) {

          let comando = DCMOTORM1;
          let valor = DCMOTOR_FORWARD + ',' + speed;
          sendMessagemBot(comando, valor, (c, v) => {
            console.log('fez: ' + c + ' ,' + v);
          });

        } else {
          speed = -speed;

          let comando = DCMOTORM1;
          let valor = DCMOTOR_BACK + ',' + speed;
          sendMessagemBot(comando, valor, (c, v) => {
            console.log('fez: ' + c + ' ,' + v);
          });

        }

        if (speed >= 0) {
          let comando = DCMOTORM2;
          let valor = DCMOTOR_FORWARD + ',' + speed;
          sendMessagemBot(comando, valor, (c, v) => {
            console.log('fez: ' + c + ' ,' + v);
          });

        } else {
          speed = -speed;

          let comando = DCMOTORM2;
          let valor = DCMOTOR_BACK + ',' + speed;
          sendMessagemBot(comando, valor, (c, v) => {
            console.log('fez: ' + c + ' ,' + v);
          });

        }

      }
    }
  }
  ext.runMotor = function(motor, speed) {
    if (clienteConectadoMBOT == false) {
      statusConnection();
    } else {
      speed = parseInt(speed, 10);

      if (speed == undefined || speed == '') {
        speed = 0;
      } else if (speed > 255) {
        speed = 255;
      } else if (speed < -255) {
        speed = -255;
      }

      if (motor == "M1") {

        if (speed >= 0) {

          let comando = DCMOTORM1;
          let valor = DCMOTOR_FORWARD + ',' + speed;
          sendMessagemBot(comando, valor, (c, v) => {
            console.log('fez: ' + c + ' ,' + v);
          });

        } else {
          speed = -speed;

          let comando = DCMOTORM1;
          let valor = DCMOTOR_BACK + ',' + speed;
          sendMessagemBot(comando, valor, (c, v) => {
            console.log('fez: ' + c + ' ,' + v);
          });

        }

      } else if (motor == "M2") {

        if (speed >= 0) {

          let comando = DCMOTORM2;
          let valor = DCMOTOR_FORWARD + ',' + speed;
          sendMessagemBot(comando, valor, (c, v) => {
            console.log('fez: ' + c + ' ,' + v);
          });

        } else {
          speed = -speed;

          let comando = DCMOTORM2;
          let valor = DCMOTOR_BACK + ',' + speed;
          sendMessagemBot(comando, valor, (c, v) => {
            console.log('fez: ' + c + ' ,' + v);
          });

        }

      } else {
        //Ambos or Both
        if (speed >= 0) {

          let comando = DCMOTORS;
          let valor = speed + ",0,0";
          sendMessagemBot(comando, valor, (c, v) => {
            console.log('fez: ' + c + ' ,' + v);
          });

        } else {
          speed = -speed;

          let comando = DCMOTORS_BACK;
          let valor = speed + ",0,0";
          sendMessagemBot(comando, valor, (c, v) => {
            console.log('fez: ' + c + ' ,' + v);
          });

        }

      }

    }
  }
  ext.runServo = function(connector, slot, angle) {
    if (clienteConectadoMBOT == false) {
      statusConnection();
    } else {
      slot = parseInt(slot, 10);
      angle = parseInt(angle, 10);

      var now = +new Date();
      if (now - lastmsg > 1000) {
        // 1 s
        lastmsg = now;
        if (angle > 150) {
          angle = 150;
        } else if (angle < 5 || angle == undefined || angle == '') {
          angle = 5;
        }

        let comando = SERVOMOTOR;
        let valor = connector + ',' + slot + ',' + angle;
        sendMessagemBot(comando, valor, (c, v) => {
          console.log('fez: ' + c + ' ,' + v);
        });

      }
    }
  }
  ext.runLed = function(index, red, green, blue) {
    if (clienteConectadoMBOT == false) {
      statusConnection();
    } else {
      red = parseInt(red, 10);
      green = parseInt(green, 10);
      blue = parseInt(blue, 10);

      var now = +new Date();
      if (now - lastmsg > 1000) { // 1s
        lastmsg = now;
        if (red > 255) {
          red = 255;
        } else if (red < 0 || red == undefined || red == '') {
          red = 0;
        }
        if (green > 255) {
          green = 255;
        } else if (green < 0 || green == undefined || green == '') {
          green = 0;
        }
        if (blue > 255) {
          blue = 255;
        } else if (blue < 0 || blue == undefined || blue == '') {
          blue = 0;
        }

        if (index == "1") {

          let comando = LEDLEFT;
          let valor = red + "," + green + "," + blue;
          sendMessagemBot(comando, valor, (c, v) => {
            console.log('fez: ' + c + ' ,' + v);
          });

        } else if (index == "2") {

          let comando = LEDRIGHT;
          let valor = red + "," + green + "," + blue;
          sendMessagemBot(comando, valor, (c, v) => {
            console.log('fez: ' + c + ' ,' + v);
          });

        } else {

          let comando = LEDBOTH;
          let valor = red + "," + green + "," + blue;
          sendMessagemBot(comando, valor, (c, v) => {
            console.log('fez: ' + c + ' ,' + v);
          });

        }
      }
    }
  }

  ext.runBuzzer = function(tone, beat) {
    if (clienteConectadoMBOT == false) {
      statusConnection();
    } else {
      if (min < 125)
        min = 125;
      else
        min = eval(beat) * 1000;


      var now = +new Date();
      if (now - lastmsg > min) { // 500ms
        lastmsg = now;

        let comando = PLAYNOTE;
        let valor = tone + ',' + beat;
        sendMessagemBot(comando, valor, (c, v) => {
          console.log('fez: ' + c + ' ,' + v);
        });

      } else {

        console.log('too fast');

      }
    }
  }

  ext.getButtonOnBoard = function(status, callback) {
    //TODO
    alert('getButtonOnBoard doesnt work yet');
  }
  ext.whenButtonPressed = function(status, callback) {
    //TODO
    alert('whenButtonPressed doesnt work yet');
  }

  ext.getLightSensor = function() {
    if (clienteConectadoMBOT == false) {
      //alert("Server Not Connected");
      statusConnection();
    }
    return light;

  }
  ext.getUltrasonic = function() {
    if (clienteConectadoMBOT == false) {
      //alert("Server Not Connected");
      statusConnection();
    }
    return ultrasound;

  }
  ext.getLinefollower = function() {
    if (clienteConectadoMBOT == false) {
      //alert("Server Not Connected");
      statusConnection();
    }
    return line;

  }

  ext.getIrRemote = function(code, callback) {
    //TODO
    alert('whenButtonPressed doesnt work yet');
  }

  ext._shutdown = function() {
    console.log('_shutdown ');
    // var msg = JSON.stringify({
    //   "command": "shutdown"
    // });
    //status = false;

    myStatus = 1;
    myMsg = 'not_ready'

    //clientMBOT.send(msg);
  };
  ext._getStatus = function(status, msg) {
    return {
      status: myStatus,
      msg: myMsg
    };
  };

  var descriptor = {
    blocks: [
      [" ", "move motors %d.motorvalue", "runBot", 100],
      [" ", "set motor%d.motorPort speed %d.motorvalue", "runMotor", "M1", 0],
      [" ", "set servo Port %d.aport Slot %d.slot angle %d.servovalue", "runServo", "1", "1", 90],
      [" ", "set LED onBoard %d.index R%d.value G%d.value B%d.value", "runLed", "all", 0, 0, 0],
      [" ", "play note %d.note beat %d.beats", "runBuzzer", "C4", "1/4"],
      //["-"],
      //["h", "quando botão onBoard %m.buttonStatus"					, "whenButtonPressed", "pressionado"],
      //["R", "botão onBoard %m.buttonStatus"						, "getButtonOnBoard", "pressionado"],
      ["-"],
      ["r", "light sensor onBoard", "getLightSensor"],
      ["r", "ultrasound sensor port 3", "getUltrasonic"],
      ["r", "line-follower port 2", "getLinefollower"],
      //["-"],
      //["r", "controle remoto %m.ircodes pressionado"					, "getIrRemote", "A"],
      ["-"],
      ["R", "timer", "getTimer", "0"],
      [" ", "reset timer", "resetTimer", "0"]
    ],
    menus: {
      motorPort: ["M1", "M2"],
      slot: ["1", "2"],
      index: ["all", 1, 2],
      aport: ["1", "2", "3", "4"],
      direction: ["forward", "reverse",
        "turn right", "turn left"
      ],
      note: ["C2", "D2", "E2", "F2", "G2", "A2", "B2",
        "C3", "D3", "E3", "F3", "G3", "A3", "B3",
        "C4", "D4", "E4", "F4", "G4", "A4", "B4",
        "C5", "D5", "E5", "F5", "G5", "A5", "B5",
        "C6", "D6", "E6", "F6", "G6", "A6", "B6",
        "C7", "D7", "E7", "F7", "G7", "A7", "B7",
        "C8", "D8"
      ],
      beats: ["1/2", "1/4", "1/8", "1", "2"],
      servovalue: [0, 45, 90, 135],
      motorvalue: [255, 100, 75, 50, 0, -50, -75, -100, -255],
      value: [0, 20, 60, 150, 255],
      buttonStatus: ["pressed", "released"],
      ircode: ["A", "B", "C", "D", "E", "F",
        "↑", "↓", "←", "→",
        "settings",
        "R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9"
      ],
    },
    url: 'http://gabrielcbe.github.io/scratchx-mbot/mbot-ble-mindmakers.js'
  };

  ScratchExtensions.register('MindMakers-mBot', descriptor, ext);
})({});
