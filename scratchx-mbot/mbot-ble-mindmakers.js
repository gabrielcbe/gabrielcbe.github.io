(function(ext) {
	//5.9 teste retorno de valores das funções
	var socket = null;
	var connected = false;
	var myStatus = 1; // initially yellow
	var myMsg = 'not_ready';
	var clienteConectadoMBOT=false;
	var servidorMBOTConectado=false;
	var sala="1";

	const LINESENSOR='linesensor';
	const ULTRASOUNDSENSOR='ultrasoundsensor';
	const LIGHTSENSOR='lightsensor';
	const BUTTON='button';
	const BUTTON_PRESSED='pressed';
	const BUTTON_RELEASED='released';
	const IRSENSOR='irsensor';
	const BUZZER='buzzer';
	const DCMOTORM1='dcmotorm1';
	const DCMOTORM2='dcmotorm2';
	const DCMOTOR_FORWARD='forward';
	const DCMOTOR_BACK='back';
	const DCMOTORS='dcmotors';
	const DCMOTORS_BACK='dcmotorsBack';
	const DCMOTORS_RIGHT='dcmotorsRight';
	const DCMOTORS_LEFT='dcmotorsLeft';
	const SERVOMOTOR='servomotor';
	const LEDLEFT='ledleft';
	const LEDRIGHT='ledright';
	const LEDBOTH='ledboth';
	const PLAYNOTE='playnote';


	// 0,1,2 ou 3
	var line=0;
	// 0 a 1000
	var light=0;
	// pressed ou released
	var button;
	// tecla
	var ir;
	// 0 a 400 cm
	var ultrasound=0;

	function getLine() {
		return line;
	}
	function getLight() {
		return light;
	}

	var lastline=0;
	var lastultrasound=0;
	var lastlight=0;
	var lastbutton;
	var lastir;

	function recebeValor (componente,valor) {
		//console.log('componente',componente);
		//console.log('valor',valor);
		if (componente==LINESENSOR) {
			line=parseInt(valor);
			if(lastline != line){
				lastline = line;
				console.log('line:',+line);
				console.log('e tem tipo');
				console.log(typeof(line));
			}
		} else if (componente==ULTRASOUNDSENSOR) {
			ultrasound=Math.trunc(parseFloat(valor));
			var x = lastultrasound - ultrasound;
			if(Math.abs(x) > 5 ){
				lastultrasound = ultrasound;
				console.log('ultrasound:',+ultrasound);
				console.log('e tem tipo:',typeof(ultrasound));
			}
		} else if (componente==LIGHTSENSOR) {
			light = Math.trunc(parseFloat(valor));
			var y = lastlight - light;
			if(Math.abs(y) > 5 ){
				lastlight = light;
				console.log('light:',+light);
				console.log('e tem tipo:',typeof(light));
			}
		} else if (componente==BUTTON) {
			button = valor;
			if(lastbutton != button){
				lastbutton = button;
				console.log('button:',+button);
				console.log('e tem tipo:',typeof(button));
			}
		} else if (componente==IRSENSOR) {
			ir = valor;
			if(lastir != ir){
				lastir = ir;
				console.log('ir:',+ir);
				console.log('e tem tipo:',typeof(ir));

			}
		}
	}

	//----Inicia websocket----//

	function statusConnection (callback) {

		window.socket = new WebSocket("ws://127.0.0.1:8081", 'echo-protocol');
		console.log('WebSocket Client Connected');

		window.socket.onopen = function () {
			var msg = JSON.stringify({
				"command": "ready"
			});

			clienteConectadoMBOT=true;

			window.socket.send(msg);
			console.log('statusConnection: '+msg);
			myStatus = 2;

			// change status light from yellow to green
			myMsg = 'ready';
			connected = true;

			// give the connection time establish
			window.setTimeout(function() {
				callback();
			}, 1000);

		};

		window.socket.onmessage = function (message) {
			//var msg = JSON.parse(message.data);

			servidorMBOTConectado=true;
			//alert('recebeu '+message.data);
			//console.log('recebeu '+message.data);

			if (message.data.toLowerCase().indexOf('desconectado')> -1) {

				registraDesconexaoMBOT(message.data);

			} else if (message.data.indexOf('conectado')>-1) {

				setTimeout(function(){ registraConexaoMBOT(message.data); },1000);

			} else if (message.data.indexOf('COMANDO_FINAL')>-1) {

				// Indica finais de execução
				endReturn();

			}
			else {

				var componenteValor = message.data.split(',');
				recebeValor(componenteValor[0],componenteValor[1]);
				//console.log('caiu no else, recebeu: '+componenteValor);


			}
			clienteConectadoMBOT=true;

			//console.log('recebeu '+message.data)
		};

		window.socket.onerror = function() {
			console.log('Erro de conexão');
			registraDesconexaoMBOT();
		};

		window.socket.onclose = function (e) {
			console.log("Connection closed.");
			socket = null;
			connected = false;
			myStatus = 1;
			myMsg = 'not_ready'

			console.log('echo-protocol Client Closed');
			clienteConectadoMBOT=false;
			registraDesconexaoMBOT();

			//tenta reconectar
			setTimeout(statusConnection, 3000);
		};

		if(clienteConectadoMBOT == 'false'){
			setTimeout(statusConnection, 3000);
		}
	};

	//chama a primeira vez
	statusConnection();

	function registraConexaoMBOT(dado) {
		//alert('entrou para registrar');
		// Recebe macaddress da unidade e sala correntemente registrada
		//console.log(dado);
		var msg = dado.split(',');
		var mac = msg[0].substring(10).toUpperCase();
		if (mac.indexOf(':')==-1)
		mac = mac.substring(0,2)+':'+mac.substring(2,4)+':'+mac.substring(4,6)+':'+mac.substring(6,8)+':'+mac.substring(8,10)+':'+mac.substring(10,12);

		if (msg[1]) {
			sala= msg[1].substring(5);
			if (parseInt(msg[2].substring(8))<10 && msg[2].substring(8).indexOf('0')!=0)
			estacaoMBOT= '0'+msg[2].substring(8);
			else
			estacaoMBOT= msg[2].substring(8);
		}
		servidorMBOTConectado=true;
	}
	function registraDesconexaoMBOT(dado) {
		console.log('entrou para deregistrar');
		servidorMBOTConectado=false;
	}

	// function enviaComando(com,val) {
	// 	console.log('entrou enviaComando: ');
	//
	// 	if (window.socket.readyState !== window.socket.OPEN) {
	// 		alert('O serviço de conexão do mBot não está ativo!');
	// 		return;
	// 	}
	// 	console.log('vai enviar '+com+' val='+val);
	// 	window.socket.send(JSON.stringify({comando:com,valor:val}));
	//
	// }

	//----Termina websocket----//


	//************* mBot Blocks ***************//

	ext.runBot = function(speed) {
		//funcionando
		if (speed >= 0) {
			window.socket.send(JSON.stringify({comando:DCMOTORS,valor:speed+",0,0"}));
		} else  {
			speed = -speed;
			console.log('speed else' ,+speed);
			window.socket.send(JSON.stringify({comando:DCMOTORS_BACK,valor:speed+",0,0"}));
		}
	}
	ext.runMotor = function(port, speed) {
		//funcionando
		if (port == "M1") {
			console.log('M1');
			if (speed >= 0) {
				console.log('speed >0');
				window.socket.send(JSON.stringify({comando:DCMOTORM1,valor:DCMOTOR_FORWARD+','+speed}));
			} else  {
				speed = -speed;
				console.log('speed else' ,+speed);
				window.socket.send(JSON.stringify({comando:DCMOTORM1,valor:DCMOTOR_BACK+','+speed}));
			}
		}else if (port == "M2") {
			console.log('M2');
			if (speed >= 0) {
				console.log('speed >0');
				window.socket.send(JSON.stringify({comando:DCMOTORM2,valor:DCMOTOR_FORWARD+','+speed}));
			} else  {
				speed = -speed;
				console.log('speed else' ,+speed);
				window.socket.send(JSON.stringify({comando:DCMOTORM2,valor:DCMOTOR_BACK+','+speed}));
			}
		}else{
			console.log('foi pra nenhuma');
		}
	}
	ext.runServo = function(port, slot, angle) {
		//funcionando
		console.log('servo');
		window.socket.send(JSON.stringify({comando:SERVOMOTOR,valor:port+','+slot+','+angle}));
	}
	ext.runLed = function(index, red, green, blue) {
		//funcionando
		if (index == "1") {
			window.socket.send(JSON.stringify({comando:LEDLEFT,valor:red+","+green+","+blue}));
		}else if (index == "2") {
			window.socket.send(JSON.stringify({comando:LEDRIGHT,valor:red+","+green+","+blue}));
		}else {
			window.socket.send(JSON.stringify({comando:LEDBOTH,valor:red+","+green+","+blue}));
		}
	}
	ext.runBuzzer = function(tone, beat) {
		//funcionando
		if (beat == "Metade") {
			window.socket.send(JSON.stringify({comando:PLAYNOTE,valor:tone+',1/2'}));
		}else if (beat == "Quarto") {
			window.socket.send(JSON.stringify({comando:PLAYNOTE,valor:tone+',1/4'}));
		}else if (beat == "Oitavo") {
			window.socket.send(JSON.stringify({comando:PLAYNOTE,valor:tone+',1/8'}));
		}else if (beat == "Inteira") {
			window.socket.send(JSON.stringify({comando:PLAYNOTE,valor:tone+',1'}));
		}else if (beat == "Dupla") {
			window.socket.send(JSON.stringify({comando:PLAYNOTE,valor:tone+',2'}));
		}else{
			console.log('entrou em nada');
		}
	}
	ext.getButtonOnBoard = function(status, callback) {
		alert('getButtonOnBoard não funciona ainda');
	}
	
	ext.whenButtonPressed = function(status, callback) {
		alert('whenButtonPressed não funciona ainda');
	}
	ext.getLightSensor = function() {
		//console.log('whenButtonPressed não funciona ainda');
		if (connected == false) {
			alert("Server Not Connected");
		}else {
			console.log('vai retornar light: ',+light);
			return light
		}
	}
	ext.getUltrasonic = function(port, callback) {
		//console.log('getUltrasonic', +digital_inputs[parseInt(ultrasound)]);
		if (connected == false) {
			alert("Server Not Connected");
		}else {
			console.log('vai retornar ultrasound: ',+ultrasound);
			var resultado = digital_inputs[parseInt(ultrasound)]
			callback(resultado);
		}
	}
	ext.getLinefollower = function(port, callback) {
		console.log('getLinefollower', +digital_inputs[parseInt(ultrasound)]);
		 if (connected == false) {
		 	alert("Server Not Connected");
		 }else {
			console.log('vai retornar line:',+line);
			return parseInt(line)
		 }
	}
	ext.getIrRemote = function(code, callback) {
		if (connected == false) {
			alert("Server Not Connected");
		}else {
			console.log('vai retornar ir: ',+ir);
			return digital_inputs[parseInt(ir)]
		}
	}
	ext._shutdown = function () {
		console.log('_shutdown ');
		var msg = JSON.stringify({
			"command": "shutdown"
		});
		status = false;
		window.socket.send(msg);

	};
	ext._getStatus = function (status, msg) {
		return {status: myStatus, msg: myMsg};
	};

	var descriptor = {
		blocks: [
			[" ", "mover motores %d.motorvalue"						, "runBot", 100],
			[" ", "estabelecer motor%d.motorPort velocidade %d.motorvalue"			, "runMotor", "M1", 0],
			[" ", "estabelecer servo Porta %d.aport Slot %d.slot ângulo %d.servovalue"	, "runServo", "1", "1", 90],
			[" ", "estabelecer led onBoard %d.index R%d.value G%d.value B%d.value"		, "runLed" , "todos", 0, 0, 0],
			[" ", "tocar tom na nota %d.note batida %d.beats"				, "runBuzzer", "C4", "Metade"],
			["-"],
			["h", "quando botão onBoard %m.buttonStatus"					, "whenButtonPressed", "pressionado"],
			["R", "botão onBoard %m.buttonStatus"						, "getButtonOnBoard", "pressionado"],
			["-"],
			["r", "sensor de luz onBoard"							, "getLightSensor"],
			["r", "distância do sensor ultrasom %d.port"					, "getUltrasonic", "Port1"],
			["r", "segue linha %d.port"							, "getLinefollower", "Port1"],
			["-"],
			["r", "controle remoto %m.ircodes pressionado"					, "getIrRemote", "A"],
			["-"],
			["R", "cronômetro"								, "getTimer", "0"],
			[" ", "zerar cronômetro"							, "resetTimer", "0"]
		],
		menus: {
			motorPort: ["M1", "M2"],
			slot: ["1", "2"],
			index: ["todos", 1, 2],
			port: ["Port1", "Port2", "Port3", "Port4"],
			aport: ["1","2","3","4"],
			direction: ["andar para a frente", "andar para trás",
			"virar à direita", "virar à esquerda"],
			note: ["C2", "D2", "E2", "F2", "G2", "A2", "B2",
			"C3", "D3", "E3", "F3", "G3", "A3", "B3",
			"C4", "D4", "E4", "F4", "G4", "A4", "B4",
			"C5", "D5", "E5", "F5", "G5", "A5", "B5",
			"C6", "D6", "E6", "F6", "G6", "A6", "B6",
			"C7", "D7", "E7", "F7", "G7", "A7", "B7",
			"C8", "D8"],
			beats: ["Metade", "Quarto", "Oitavo", "Inteira", "Dupla"],
			servovalue: [0, 45, 90, 135],
			motorvalue: [255, 100, 75, 50, 0, -50, -75, -100, -255],
			value: [0, 20, 60, 150, 255],
			buttonStatus: ["pressionado", "liberado"],
			ircode: ["A", "B", "C", "D", "E", "F",
			"↑", "↓", "←", "→",
			"Configuração",
			"R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9"],
		},
		url: 'http://gabrielcbe.github.io/scratchx-mbot/mbot-ble-mindmakers.js'
	};

	ScratchExtensions.register('MindMakers-mBot', descriptor, ext);
})({});
