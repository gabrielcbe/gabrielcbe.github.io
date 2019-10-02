(function(ext) {
  //MindMakers ScratchX extension for mBot working via own BLE server and WebSocket
  //v2.6 not so simple subscription
  var myStatus = 1; // initially yellow
  var myMsg = 'not_ready';
  var clienteConectadoMBOT = false;
  var sala = "1";

  const SUBSCRICAO = 'subscricao';
  var subscrito = false;
  var sensores = ["true", "true", "true"];
  var sensoresold = ["", "", ""];

  const LINESENSOR = 'linesensor';
  const ULTRASOUNDSENSOR = 'ultrasoundsensor';
  const LIGHTSENSOR = 'lightsensor';
  const BUTTON = 'button';
  const BUTTON_PRESSED = 'pressed';
  const BUTTON_RELEASED = 'released';
  const IRSENSOR = 'irsensor';
  const BUZZER = 'buzzer';
  const DCMOTORM1 = 'dcmotorm1';
  const DCMOTORM2 = 'dcmotorm2';
  const DCMOTOR_FORWARD = 'forward';
  const DCMOTOR_BACK = 'back';
  const DCMOTORS = 'dcmotors';
  const DCMOTORS_BACK = 'dcmotorsBack';
  const DCMOTORS_RIGMetadeHT = 'dcmotorsRight';
  const DCMOTORS_LEFT = 'dcmotorsLeft';
  const SERVOMOTOR = 'servomotor';
  const LEDLEFT = 'ledleft';
  const LEDRIGHT = 'ledright';
  const LEDBOTH = 'ledboth';
  const PLAYNOTE = 'playnote';

  var ultimoComandoValorMap = new Map();
  var ultimoComandoDateMap = new Map();

  // 0,1,2 ou 3
  var line = 0;
  // 0 a 1000
  var light = 0;
  // 0 a 400 cm
  var ultrasound = 0;

  // pressed ou released
  var button;
  var lastbutton;

  // tecla
  var ir;
  var lastir;
  var lastmsg = +new Date();

  function recebeValor(componente, valor) {
    //console.log('componente',componente);
    //console.log('valor',valor);
    if (componente == LINESENSOR) {
      line = parseInt(valor);
    } else if (componente == ULTRASOUNDSENSOR) {
      ultrasound = Math.trunc(parseFloat(valor));
    } else if (componente == LIGHTSENSOR) {
      light = Math.trunc(parseFloat(valor));
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
    }
  }

  //----Inicia websocket----//

  function statusConnection() {

    window.socket = new WebSocket("ws://127.0.0.1:8081", 'echo-protocol');
    console.log('WebSocket Client Trying to Connect');

    window.socket.onopen = function() {
      var msg = JSON.stringify({
        "command": "ready"
      });

      clienteConectadoMBOT = true;
      myStatus = 2;
      myMsg = 'ready';

      window.socket.send(msg);
      console.log('WebSocket Client Connected');

      var vsensores = "'" + sensores[0] + ',' + sensores[1] + ',' + sensores[2] + '"';
      console.log("vsensores "+vsensores)
      sendMessagemBot(SUBSCRICAO, vsensores); //not simple subscription
      //sendMessagemBot(SUBSCRICAO, "true,true,true"); //simple subscription

    };

    window.socket.onmessage = function(message) {

      if (message.data.toLowerCase().indexOf('desconectado') > -1) {
        registraDesconexaoMBOT(message.data);
      } else if (message.data.indexOf('conectado') > -1) {
        setTimeout(function() {
          registraConexaoMBOT(message.data);
        }, 1000);
      } else if (message.data.indexOf('COMANDO_FINAL') > -1) {
        // Indica finais de execução
        endReturn();
      } else {
        var componenteValor = message.data.split(',');
        //console.log('caiu no else, recebeu: '+componenteValor);
        recebeValor(componenteValor[0], componenteValor[1]);
      }
      clienteConectadoMBOT = true;

    };

    window.socket.onerror = function() {
      console.log('Erro de conexão');
      registraDesconexaoMBOT();
    };

    window.socket.onclose = function(e) {
      myStatus = 1;
      myMsg = 'not_ready'

      console.log('echo-protocol Client Closed');
      registraDesconexaoMBOT();

      //tenta reconectar 10 segundos depois de fechar a conexão
      setTimeout(statusConnection, 10000);
    };

    if (clienteConectadoMBOT == 'false') {
      setTimeout(statusConnection, 10000);
    }
  };

  //1st time calling function
  statusConnection();

  function registraConexaoMBOT(dado) {
    var msg = dado.split(',');
    var mac = msg[0].substring(10).toUpperCase();
    if (mac.indexOf(':') == -1)
      mac = mac.substring(0, 2) + ':' + mac.substring(2, 4) + ':' + mac.substring(4, 6) + ':' + mac.substring(6, 8) + ':' + mac.substring(8, 10) + ':' + mac.substring(10, 12);

    if (msg[1]) {
      sala = msg[1].substring(5);
      if (parseInt(msg[2].substring(8)) < 10 && msg[2].substring(8).indexOf('0') != 0)
        estacaoMBOT = '0' + msg[2].substring(8);
      else
        estacaoMBOT = msg[2].substring(8);

    }
    clienteConectadoMBOT = true;

  }

  function registraDesconexaoMBOT(dado) {
    console.log('entrou para deregistrar');
    clienteConectadoMBOT = false;
    window.socket.close();

  }

  function sendMessagemBot(comando, valor) {
    //alert(comando + ',' + valor)
    // if(sensoresold[0] != sensores[0] || sensoresold[1] != sensores[1] || sensoresold[2] != sensores[2])
    //   subscrito = false;
    //
    // if (!subscrito) {
    //   console.log("entrou pra subscrever " + vsensores)
    //   var vsensores = sensores[0] + ',' + sensores[1] + ',' + sensores[2];
    //   console.log("entrou pra subscrever " + vsensores)
    //   subscrito = true;
    //   sendMessagemBot(SUBSCRICAO, vsensores)
    // }

    var dif = 0;

    try {
      dif = new Date() - ultimoComandoDateMap.get(comando);
    } catch (e) {}

    if (comando == BUZZER && ultimoComandoValorMap.get(BUZZER)) {
      var tmin = ultimoComandoValorMap.get(comando)
      tmin = math.eval(tmin);
      console.log('tmin ' + tmin);
    }

    if ((comando == BUZZER && dif < 200) || (comando != BUZZER && (ultimoComandoValorMap.get(comando) == valor && dif < 500)))
      return

    ultimoComandoValorMap.set(comando, valor);
    ultimoComandoDateMap.set(comando, new Date());

    waitForSocketConnection(window.socket, function() {
      window.socket.send(JSON.stringify({
        comando: comando,
        valor: valor
      }));

      waitForSocketConnection(window.socket, function() {
        if (comando == SUBSCRICAO)
          subscrito = true;

        console.log('mBot comando: ' + comando + ' valor: ' + valor);
      });

    });
  };

  function waitForSocketConnection(socket, callback) { //Valida que ws está aberta antes de mandar msg
    setTimeout(
      function() {
        if (socket.readyState === 1) {
          if (callback !== undefined) {
            callback();
          }
          return;
        } else {
          waitForSocketConnection(socket, callback);
        }
      }, 5);
  };

  //----Termina websocket----//


  //-----mBot Blocks----//

  ext.runBot = function(speed) {
    if (!lastmsg) {
      var lastmsg = -1
    }

    if (speed != lastmsg) { //tentativa de tratar mensagens duplicadas
      lastmsg = speed;

      if (speed > 255) { //validação de speed máxima
        speed = 255;
      } else if (speed < -255) {
        speed = -255;
      }

      if (speed >= 0) {

        let comando = DCMOTORM1;
        let valor = DCMOTOR_FORWARD + ',' + speed;
        sendMessagemBot(comando, valor); //manda o valor
      } else {
        speed = -speed;

        let comando = DCMOTORM1;
        let valor = DCMOTOR_BACK + ',' + speed;
        sendMessagemBot(comando, valor); //manda o valor
      }

      if (speed >= 0) {
        let comando = DCMOTORM2;
        let valor = DCMOTOR_FORWARD + ',' + speed;
        sendMessagemBot(comando, valor); //manda o valor
      } else {
        speed = -speed;

        let comando = DCMOTORM2;
        let valor = DCMOTOR_BACK + ',' + speed;
        sendMessagemBot(comando, valor); //manda o valor
      }

    }
  }
  ext.runMotor = function(motor, speed) {
    if (speed > 255) {
      speed = 255;
    }
    if (speed < -255) {
      speed = -255;
    }

    if (motor == "M1") {

      if (speed >= 0) {

        let comando = DCMOTORM1;
        let valor = DCMOTOR_FORWARD + ',' + speed;
        sendMessagemBot(comando, valor); //manda o valor

      } else {
        speed = -speed;

        let comando = DCMOTORM1;
        let valor = DCMOTOR_BACK + ',' + speed;
        sendMessagemBot(comando, valor); //manda o valor

      }

    } else if (motor == "M2") {

      if (speed >= 0) {

        let comando = DCMOTORM2;
        let valor = DCMOTOR_FORWARD + ',' + speed;
        sendMessagemBot(comando, valor); //manda o valor

      } else {
        speed = -speed;

        let comando = DCMOTORM2;
        let valor = DCMOTOR_BACK + ',' + speed;
        sendMessagemBot(comando, valor); //manda o valor

      }

    } else {
      //Ambos or Both
      if (speed >= 0) { //validação de frente ou ré

        let comando = DCMOTORS;
        let valor = speed + ",0,0";
        sendMessagemBot(comando, valor); //manda o valor

      } else {
        speed = -speed;

        let comando = DCMOTORS_BACK;
        let valor = speed + ",0,0";
        sendMessagemBot(comando, valor);

      }

    }
  }
  ext.runServo = function(connector, slot, angle) {
    var now = +new Date();
    if (now - lastmsg > 1000) { // 1 s
      lastmsg = now;
      if (angle > 150) {
        angle = 150;
      }

      let comando = SERVOMOTOR;
      let valor = connector + ',' + slot + ',' + angle;
      sendMessagemBot(comando, valor); //manda o valor

    }
  }
  ext.runLed = function(index, red, green, blue) {
    var now = +new Date();
    if (now - lastmsg > 1000) { // 1s
      lastmsg = now;
      if (red > 255) {
        red = 255;
      }
      if (green > 255) {
        green = 255;
      }
      if (blue > 255) {
        blue = 255;
      }

      if (index == "1") {

        let comando = LEDLEFT;
        let valor = red + "," + green + "," + blue;
        sendMessagemBot(comando, valor);

      } else if (index == "2") {

        let comando = LEDRIGHT;
        let valor = red + "," + green + "," + blue;
        sendMessagemBot(comando, valor);

      } else {

        let comando = LEDBOTH;
        let valor = red + "," + green + "," + blue;
        sendMessagemBot(comando, valor);

      }

    }
  }
  ext.runBuzzer = function(tone, beat) {
    var now = +new Date();
    if (now - lastmsg > 500) { // 500ms
      lastmsg = now;

      let comando = PLAYNOTE;
      let valor = tone + ',' + beat;
      sendMessagemBot(comando, valor);

    } else {

      console.log('too fast');

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
    //funcionando
    sensores[1] = "true";
    if (clienteConectadoMBOT == false) {
      alert("Server Not Connected");
    } else {
      //console.log('vai retornar light: ',+light);
      return light
    }
  }
  ext.getUltrasonic = function() {
    //funcionando
    sensores[2] = "true";
    if (clienteConectadoMBOT == false) {
      alert("Server Not Connected");
    } else {
      //console.log('vai retornar ultrasound: ',+ultrasound);
      return ultrasound
    }
  }
  ext.getLinefollower = function() {
    sensores[0] = "true";
    //funcionando, talvez pode ser melhorado a frequência de captura
    if (clienteConectadoMBOT == false) {
      alert("Server Not Connected");
    } else {
      //console.log('vai retornar line:',+line);
      return line
    }
  }
  ext.getIrRemote = function(code, callback) {
    //TODO
    alert('whenButtonPressed doesnt work yet');

  }

  ext._shutdown = function() {
    console.log('_shutdown ');
    var msg = JSON.stringify({
      "command": "shutdown"
    });
    status = false;
    window.socket.send(msg);
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
      index: ["todos", 1, 2],
      port: ["Port1", "Port2", "Port3", "Port4"],
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
