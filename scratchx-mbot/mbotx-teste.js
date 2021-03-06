(function(ext) {
	//4.1 led apagou manualmente, tentando pegar o valor do bloco
	var socket = null;
	var connected = false;
	var myStatus = 1; // initially yellow
	var myMsg = 'not_ready';
	
	var clienteConectadoMBOT=false;
	var servidorMBOTConectado=false;
	var reconexaoAutomaticaMBOT=null;
	const PORTA_MBOT="8081";
	var urlConexaoRecenteMBOT="";
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
	
	function enviaComando(com,val) {
		//console.log('entrou enviaComando: '+com);
		
		if (window.socket.readyState !== window.socket.OPEN) {
			alert('O serviço de conexão do mBot não está ativo!');
			return;
		}
		console.log('vai enviar '+com+' val='+val);
		window.socket.send(JSON.stringify({comando:com,valor:val}));
		
	}
	// 0,1,2 ou 3
	var line;
	
	// 0 a 1000
	var light;
	// pressed ou released
	var button;
	// tecla
	var ir;
	
	// 0 a 400 cm
	var ultrasound;
	
	function recebeValor (componente,valor) {
		
		
		//console.log('componente',componente);
		//console.log('valor',valor);
		
		if (componente==LINESENSOR) {
			line=parseInt(valor);
			//document.getElementById(componente).innerHTML=valor;
		} else if (componente==ULTRASOUNDSENSOR) {
			ultrasound=Math.trunc(parseInt(valor));
			//document.getElementById(componente).innerHTML=ultrasound+'';
		} else if (componente==LIGHTSENSOR) {
			light = Math.trunc(parseInt(valor));
			//document.getElementById(componente).innerHTML=light+'';
		} else if (componente==BUTTON) {
			button = valor;
			//document.getElementById(componente).innerHTML=valor;
		} else if (componente==IRSENSOR) {
			ir = valor;
			//document.getElementById(componente).innerHTML=valor;
		}
		
	}
	
	ext.cnct = function (callback) {
		window.socket = new WebSocket("ws://127.0.0.1:8081", 'echo-protocol');
		console.log('WebSocket Client Connected');
		window.socket.onopen = function () {
			var msg = JSON.stringify({
				"command": "ready"
			});
			
			clienteConectadoMBOT=true;
			
			window.socket.send(msg);
			console.log('ext.cnct: '+msg);
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
			//document.getElementById('msg').innerHTML=e.data+'';
			//	odo.setValue(parseInt(e.data));
			
			
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
				//console.log('caiu no else');
				//console.log('caiu no else, recebeu: '+componenteValor);
				
				//olhar se é só chamar ou precisa de parametro
				//precisa mesmo colocar isso aqui.
				
				onMsgApp(message);
				
			}
			clienteConectadoMBOT=true;
			
			//console.log('recebeu '+message.data)
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
		};
	};
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
		//alert('entrou para deregistrar');
		servidorMBOTConectado=false;
	}
	
	
	
	
	
	var poller = null;
	var device = null;
	var status = false;
	var _selectors = {};
	var _buffer = [];
	var _isParseStartIndex = 0;
	var _isParseStart = false;
	var ports = {
		Port1: 1,
		Port2: 2,
		Port3: 3,
		Port4: 4,
		M1: 9,
		M2: 10,
		'on board': 7,
		'led on board': 8
	};
	var slots = {
		Slot1: 1,
		Slot2: 2
	};
	var switchStatus = {
		On: 1,
		Off: 0
	};
	var buttonStatus = {
		pressed: 0,
		released: 1
	}
	var shutterStatus = {
		Press: 0,
		Release: 1,
		'Focus On': 2,
		'Focus Off': 3,
	};
	var axis = {
		'X-Axis': 1,
		'Y-Axis': 2,
		'Z-Axis': 3
	};
	var ircodes = {
		"A": 45,
		"B": 70,
		"C": 71,
		"D": 68,
		"E": 67,
		"F": 13,
		"↑": 64,
		"↓": 25,
		"←": 7,
		"→": 9,
		"R0": 22,
		"R1": 12,
		"R2": 24,
		"R3": 94,
		"R4": 8,
		"R5": 28,
		"R6": 90,
		"R7": 66,
		"R8": 82,
		"R9": 74
	};
	var __irCodes = [];
	for (var key in ircodes) {
		__irCodes.push(ircodes[key]);
	}
	var tones = {
		"B0": 31,
		"C1": 33,
		"D1": 37,
		"E1": 41,
		"F1": 44,
		"G1": 49,
		"A1": 55,
		"B1": 62,
		"C2": 65,
		"D2": 73,
		"E2": 82,
		"F2": 87,
		"G2": 98,
		"A2": 110,
		"B2": 123,
		"C3": 131,
		"D3": 147,
		"E3": 165,
		"F3": 175,
		"G3": 196,
		"A3": 220,
		"B3": 247,
		"C4": 262,
		"D4": 294,
		"E4": 330,
		"F4": 349,
		"G4": 392,
		"A4": 440,
		"B4": 494,
		"C5": 523,
		"D5": 587,
		"E5": 659,
		"F5": 698,
		"G5": 784,
		"A5": 880,
		"B5": 988,
		"C6": 1047,
		"D6": 1175,
		"E6": 1319,
		"F6": 1397,
		"G6": 1568,
		"A6": 1760,
		"B6": 1976,
		"C7": 2093,
		"D7": 2349,
		"E7": 2637,
		"F7": 2794,
		"G7": 3136,
		"A7": 3520,
		"B7": 3951,
		"C8": 4186,
		"D8": 4699
	};
	var beats = {
		"Metade": 500,
		"Quarto": 250,
		"Oitavo": 125,
		"Inteira": 1000,
		"Dupla": 2000,
		"Zero": 0
	};
	
	function onParse(byte) {
		//console.log('onParse(byte): '+byte);
		position = 0
		value = 0
		_buffer.push(byte);
		//console.log('onParse(_buffer): '+_buffer);
		var len = _buffer.length;
		if (len >= 2) {
			if (_buffer[len - 1] == 0x55 && _buffer[len - 2] == 0xff) {
				_isParseStartIndex = len - 2
				_isParseStart = true;
			}
			if (_buffer[len - 1] == 0xa && _buffer[len - 2] == 0xd && _isParseStart == true) {
				_isParseStart = false;
				
				var position = _isParseStartIndex + 2;
				var extId = _buffer[position];
				position += 1;
				var type = _buffer[position];
				position += 1;
				var value = 0;
				// 1 byte 2 float 3 short 4 len+string 5 double
				if (type == 1) {
					value = _buffer[position];
				}
				if (type == 2) {
					value = readFloat(position);
					if (value < -255 || value > 1023) {
						value = 0;
					}
				}
				if (type == 3) {
					value = readShort(position);
				}
				if (type == 4) {
					value = readString(position);
				}
				if (type == 5) {
					value = readDouble(position);
				}
				if (type <= 5) {
					if (value != null) {
						_selectors["value_" + extId] = value;
					}
					_selectors["callback_" + extId](value);
				}
				_buffer = []
			}
		}
	}
	
	function readFloat(position) {
		var buf = new ArrayBuffer(4);
		var intView = new Uint8Array(buf);
		var floatView = new Float32Array(buf);
		for (var i = 0; i < 4; i++) {
			intView[i] = _buffer[position + i];
		}
		return floatView[0];
	}
	
	function readShort(position) {
		var buf = new ArrayBuffer(2);
		var intView = new Uint8Array(buf);
		var shortView = new Int16Array(buf);
		for (var i = 0; i < 2; i++) {
			intView[i] = _buffer[position + i];
		}
		return shortView[0];
	}
	
	function readString(position) {
		var l = _buffer[position]
		position += 1
		s = ""
		for (var i = 0; i < l; i++) {
			s += self.buffer[position + i].charAt(0)
		}
		return s
	}
	
	function readDouble(position) {
		var buf = new ArrayBuffer(8);
		var intView = new Uint8Array(buf);
		var doubleView = new Float64Array(buf);
		for (var i = 0; i < 8; i++) {
			intView[i] = _buffer[position + i];
		}
		return doubleView[0];
	}
	
	function short2array(v) {
		var buf = new ArrayBuffer(2);
		var intView = new Uint8Array(buf);
		var shortView = new Int16Array(buf);
		shortView[0] = v;
		return [intView[0], intView[1]];
	}
	
	function float2array(v) {
		var buf = new ArrayBuffer(4);
		var intView = new Uint8Array(buf);
		var floatView = new Float32Array(buf);
		floatView[0] = v;
		return [intView[0], intView[1], intView[2], intView[3]];
	}
	
	function string2array(v) {
		var arr = v.split("");
		for (var i = 0; i < arr.length; i++) {
			arr[i] = arr[i].charCodeAt(0);
		}
		console.log(arr);
		return arr;
	}
	
	function deviceOpened(dev) {
		console.log('deviceOpened(dev): '+dev);
		// if device fails to open, forget about it
		if (dev == null) device = null;
		
		// otherwise start polling
		poller = setInterval(function() {
			if (device != null) {
				function callback(buffer) {
					var buf = new Uint8Array(buffer);
					var len = buf[0];
					if (buf[0] > 0) {
						for (var i = 0; i < len; i++) {
							onParse(buf[i + 1]);
						}
					}
				}
				device.read(callback, 30);
			}
		}, 20);
		console.log('deviceOpened(poller): '+poller);
	};
	var lastWritten = 0;
	var _buffers = [];
	var _isWaiting = false;
	
	function addPackage(buffer, callback) {
		_buffers.push(buffer);
		//console.log('addPackage(_buffers): '+_buffers);
		var extId = buffer[4];
		setTimeout(function() {
			callback(_selectors["value_" + extId]);
		}, 100);
		//console.log('addPackage(_selectors): '+_selectors);
		writePackage();
	}
	
	function writePackage() {
		if (_buffers.length > 0 && _isWaiting == false) {
			_isWaiting = true;
			var buffer = _buffers[0];
			_buffers.shift();
			var msg = {};
			msg.buffer = buffer;
			console.log('addPackwritePackageage(msg.buffer): '+msg.buffer);
			
			window.socket.send(msg);
			console.log('addPackwritePackageage(msg): '+msg);
			//mConnection.postMessage(msg);
			setTimeout(function() {
				_isWaiting = false;
				writePackage();
			}, 20);
		}
	}
	var arrayBufferFromArray = function(data) {
		console.log('arrayBufferFromArray(data): '+data);
		var result = new Int8Array(data.length);
		for (var i = 0; i < data.length; i++) {
			result[i] = data[i];
		}
		console.log('arrayBufferFromArray(result): '+result);
		return data;
	}
	
	//************* mBot Blocks ***************//
	
	function genNextID(port, slot) {
		var nextID = port * 4 + slot;
		return nextID;
	}
	ext.resetAll = function() {
		var data = [0x5, 0xff, 0x55, 0x02, 0x0, 0x04];
		addPackage(arrayBufferFromArray(data), function() {})
	};
	ext.runBot = function(lSpeed, rSpeed) {
		var deviceId = 5;
		var extId = 0;
		var data = [extId, 0x02, deviceId].concat(short2array(-lSpeed)).concat(short2array(rSpeed));
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		addPackage(arrayBufferFromArray(data), function() {});
	}
	ext.runMotor = function(port, speed) {
		if (typeof port == "string") {
			port = ports[port];
		}
		var deviceId = 10;
		var extId = 0;
		var data = [extId, 0x02, deviceId, port].concat(short2array(speed));
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		addPackage(arrayBufferFromArray(data), function() {});
	}
	ext.runServo = function(port, slot, angle) {
		if (typeof port == "string") {
			port = ports[port];
		}
		if (typeof slot == "string") {
			slot = slots[slot];
		}
		var deviceId = 11;
		var extId = 0;
		var data = [extId, 0x02, deviceId, port, slot, angle];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		addPackage(arrayBufferFromArray(data), function() {});
	}
	ext.runLedOnBoard = function(index, red, green, blue) {
		console.log('runLedOnBoard: vai fazer code e enviar comando');
		
		enviaComando('"+index+"','"+red+","+green+","+blue+"');
		console.log('runLedOnBoard: depois funcao');
		
		//return code;
		//the index here is realy the slot. I leave it because the slot does not have the "all" option
		if (index == "all") {
			index = 0;
		}
		var port = 7; //led on board
		var deviceId = 8;
		var extId = 0;
		var data = [extId, 0x02, deviceId, port, index, red * 1, green * 1, blue * 1];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		addPackage(arrayBufferFromArray(data), function() {});
	}
	ext.runLed = function(port, slot, index, red, green, blue) {
		//this would propably work for a LED strip. I don't own one to give it a try.
		//We should make a new block named Set LedStrip for this function to be used...
		if (typeof port == "string") {
			port = ports[port];
		}
		if (typeof slot == "string") {
			slot = slots[slot];
		}
		if (port == ports["on board"]) {
			slot = 2;
		}
		if (index == "all") {
			index = 0;
		}
		var deviceId = 8;
		var extId = 0;
		var data = [extId, 0x02, deviceId, port, slot, index, red * 1, green * 1, blue * 1];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		console.log('runLed: vai fazer code e enviar comando');
		
		//enviaComando('ledboth',0,0,0);
		//console.log('1');
		//window.socket.send(JSON.stringify({comando:led,valor:'0+","0+","0'}));
		
		//console.log('2');
		//window.socket.send(JSON.stringify({comando:led,valor:'0,0,0'}));
		
		console.log('3');
		window.socket.send(JSON.stringify({comando:'led',valor:'0,0,0'}));
		
		console.log('4');
		window.socket.send(JSON.stringify({comando:LEDBOTH,valor:'0+","0+","0'}));
		
		console.log('5');
		window.socket.send(JSON.stringify({comando:LEDBOTH,valor:'0,0,0'}));
		
		console.log('6');
		window.socket.send(JSON.stringify({comando:'LEDBOTH',valor:'0,0,0'}));
		
		console.log('7');
		window.socket.send(JSON.stringify({comando:'LEDBOTH',valor:+red+","+green+","+blue}));
		
		console.log('runLed: depois');
		addPackage(arrayBufferFromArray(data), function() {});
	}
	ext.runBuzzer = function(tone, beat) {
		if (typeof tone == "string") {
			tone = tones[tone];
		}
		if (typeof beat == "string") {
			beat = beats[beat];
		}
		var deviceId = 34;
		var extId = 0;
		var data = [extId, 0x02, deviceId].concat(short2array(tone)).concat(short2array(beat));
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		addPackage(arrayBufferFromArray(data), function() {});
	};
	ext.stopBuzzer = function() {
		runBuzzer(0, 0);
	};
	ext.showCharacters = function(port, x, y, msg) {
		if (typeof port == "string") {
			port = ports[port];
		}
		var deviceId = 41;
		var extId = 0;
		var brightness = 6;
		var data = [extId, 0x02, deviceId, port, 1, brightness, 3].concat(short2array(x)).concat(short2array(7 + y)).concat([msg.length].concat(string2array(msg)));
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		addPackage(arrayBufferFromArray(data), function() {});
	}
	ext.showTime = function(port, hour, dot, min) {
		if (typeof port == "string") {
			port = ports[port];
		}
		var deviceId = 41;
		var extId = 0;
		var brightness = 6;
		var data = [extId, 0x02, deviceId, port, 3, brightness, dot == ":" ? 1 : 0].concat(short2array(hour)).concat(short2array(min));
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		addPackage(arrayBufferFromArray(data), function() {});
	}
	ext.runSevseg = function(port, num) {
		if (typeof port == "string") {
			port = ports[port];
		}
		var deviceId = 9;
		var extId = 0;
		var data = [extId, 0x02, deviceId, port].concat(float2array(num));
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		addPackage(arrayBufferFromArray(data), function() {});
	}
	ext.runLightSensor = function(port, status) {
		if (typeof port == "string") {
			port = ports[port];
		}
		if (typeof status == "string") {
			status = switchStatus[status];
		}
		var deviceId = 3;
		var extId = 0;
		var data = [extId, 0x02, deviceId, port, status];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		addPackage(arrayBufferFromArray(data), function() {});
	}
	ext.runShutter = function(port, shutter) {
		if (typeof port == "string") {
			port = ports[port];
		}
		if (typeof shutter == "string") {
			shutter = shutterStatus[shutter];
		}
		var deviceId = 20;
		var extId = 0;
		var data = [extId, 0x02, deviceId, port, shutter];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		addPackage(arrayBufferFromArray(data), function() {});
	}
	ext.getButtonOnBoard = function(status, callback) {
		if (typeof status == "string") {
			status = buttonStatus[status];
		}
		var deviceId = 31;
		var port = 7;
		var extId = genNextID(port, 0);
		var data = [extId, 0x01, deviceId, port];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		_selectors["callback_" + extId] = function(v) {
			callback(status == 1 ? v > 500 : v < 500);
		}
		addPackage(arrayBufferFromArray(data), _selectors["callback_" + extId]);
	}
	var _lastTime = 0;
	var _lastButtonStatus = [false, false];
	ext.whenButtonPressed = function(status, callback) {
		if (typeof status == "string") {
			status = buttonStatus[status];
		}
		if (new Date().getTime() - _lastTime > 150) {
			_lastTime = new Date().getTime();
			var deviceId = 31;
			var port = 7;
			var extId = genNextID(port, status);
			var data = [extId, 0x01, deviceId, port];
			data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
			_selectors["callback_" + extId] = function(v) {
				_lastButtonStatus[0] = status == 1 ? v > 500 : v < 500;
				_lastButtonStatus[1] = !_lastButtonStatus[status];
			}
			addPackage(arrayBufferFromArray(data), _selectors["callback_" + extId]);
		}
		return _lastButtonStatus[status];
		
	}
	ext.getLightSensor = function(port, callback) {
		if (typeof port == "string") {
			port = ports[port];
		}
		var deviceId = 3;
		var extId = genNextID(port, 0);
		var data = [extId, 0x01, deviceId, port];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		_selectors["callback_" + extId] = callback;
		addPackage(arrayBufferFromArray(data), _selectors["callback_" + extId]);
	}
	ext.getUltrasonic = function(port, callback) {
		if (typeof port == "string") {
			port = ports[port];
		}
		var deviceId = 1;
		var extId = 0; //genNextID(port,0);
		var data = [extId, 0x01, deviceId, port];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		_selectors["callback_" + extId] = function(v) {
			callback(Math.floor(v * 100.0) / 100.0);
		}
		addPackage(arrayBufferFromArray(data), _selectors["callback_" + extId]);
	}
	ext.getLinefollower = function(port, callback) {
		if (typeof port == "string") {
			port = ports[port];
		}
		var deviceId = 17;
		var extId = genNextID(port, 0);
		var data = [extId, 0x01, deviceId, port];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		_selectors["callback_" + extId] = callback;
		addPackage(arrayBufferFromArray(data), _selectors["callback_" + extId]);
	}
	ext.getJoystick = function(port, ax, callback) {
		if (typeof port == "string") {
			port = ports[port];
		}
		if (typeof ax == "string") {
			ax = axis[ax];
		}
		var deviceId = 5;
		var extId = genNextID(port, ax);
		var data = [extId, 0x01, deviceId, port, ax];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		_selectors["callback_" + extId] = callback;
		addPackage(arrayBufferFromArray(data), _selectors["callback_" + extId]);
	}
	ext.getPotentiometer = function(port, callback) {
		if (typeof port == "string") {
			port = ports[port];
		}
		var deviceId = 4;
		var extId = genNextID(port, 0);
		var data = [extId, 0x01, deviceId, port];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		_selectors["callback_" + extId] = callback;
		addPackage(arrayBufferFromArray(data), _selectors["callback_" + extId]);
	}
	ext.getSoundSensor = function(port, callback) {
		if (typeof port == "string") {
			port = ports[port];
		}
		var deviceId = 7;
		var extId = genNextID(port, 0);
		var data = [extId, 0x01, deviceId, port];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		_selectors["callback_" + extId] = callback;
		addPackage(arrayBufferFromArray(data), _selectors["callback_" + extId]);
	}
	ext.getLimitswitch = function(port, slot, callback) {
		if (typeof port == "string") {
			port = ports[port];
		}
		if (typeof slot == "string") {
			slot = slots[slot];
		}
		var deviceId = 21;
		var extId = genNextID(port, slot);
		var data = [extId, 0x01, deviceId, port, slot];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		_selectors["callback_" + extId] = callback;
		addPackage(arrayBufferFromArray(data), _selectors["callback_" + extId]);
	}
	ext.getTemperature = function(port, callback) {
		if (typeof port == "string") {
			port = ports[port];
		}
		var deviceId = 2;
		var extId = genNextID(port, 0);
		var data = [extId, 0x01, deviceId, port];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		_selectors["callback_" + extId] = function(v) {
			callback(Math.floor(v * 100) / 100);
		}
		addPackage(arrayBufferFromArray(data), _selectors["callback_" + extId]);
	}
	ext.getPirmotion = function(port, callback) {
		if (typeof port == "string") {
			port = ports[port];
		}
		var deviceId = 6;
		var extId = genNextID(port, 0);
		var data = [extId, 0x01, deviceId, port];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		_selectors["callback_" + extId] = callback;
		addPackage(arrayBufferFromArray(data), _selectors["callback_" + extId]);
	}
	ext.getIrRemote = function(code, callback) {
		var deviceId = 14;
		if (typeof code == "string") {
			code = ircodes[code];
		}
		var port = 11;
		var slot = __irCodes.indexOf(code);
		var halfSize = __irCodes.length >> 1;
		if (slot >= halfSize) {
			++port;
			slot -= halfSize;
		}
		var extId = genNextID(port, slot);
		var data = [extId, 0x01, deviceId, 0, code];
		data = [data.length + 3, 0xff, 0x55, data.length].concat(data);
		_selectors["callback_" + extId] = callback;
		addPackage(arrayBufferFromArray(data), _selectors["callback_" + extId]);
	}
	var descriptor = {
		blocks: [
			["w", 'Connect to mbot server.', 'cnct'],
			[" ", "mover esquerdo %d.motorvalue direito %d.motorvalue", "runBot", 100, 100],
			[" ", "estabelecer motor%d.motorPort velocidade %d.motorvalue", "runMotor", "M1", 0],
			[" ", "estabelecer servo %d.port %d.slot ângulo %d.servovalue", "runServo", "Port1", "Slot1", 90],
			[" ", "estabelecer led %d.lport %d.slot %d.index R%d.value G%d.value B%d.value", "runLed", "on board", "Slot1", "all", 0, 0, 0],
			[" ", "tocar tom na nota %d.note batida %d.beats", "runBuzzer", "C4", "Metade"],
			// [" ", "mostrar cara %d.port x:%n y:%n caracteres:%s", "showCharacters", "Port1", 0, 0, "Ola"],
			// [" ", "mostrar tempo %d.port hora:%n %m.points min:%n", "showTime", "Port1", 10, ":", 20],
			// [" ", "mostrar desenho %d.port x:%n y:%n draw:%m.drawFace", "showDraw", "Port1", 0, 0, "    	"],
			["-"],
			// [" ", "estabelecer 7-segmentos display%d.port número %n", "runSevseg", "Port1", 100],
			[" ", "estabelecer sensor de luz %d.aport led como %d.switchStatus", "runLightSensor", "Port3", "Ligado"],
			// [" ", "estabelecer obturador da câmera %d.port como %d.shutter", "runShutter", "Port1", "Pressionar"],
			["-"],
			["h", "quando botão %m.buttonStatus", "whenButtonPressed", "pressionado"],
			["R", "botão %m.buttonStatus", "getButtonOnBoard", "pressionado"],
			["R", "sensor de luz %d.laport", "getLightSensor", "sensor de luz on board"],
			["-"],
			["R", "distância do sensor ultrasom %d.port", "getUltrasonic", "Port1"],
			["R", "segue linha %d.port", "getLinefollower", "Port1"],
			// ["R", "joystick %d.aport %d.Axis", "getJoystick", "Port3", "Eixo-X"],
			["R", "potenciometro %d.aport", "getPotentiometer", "Port3"],
			["R", "sensor de som %d.aport", "getSoundSensor", "Port3"],
			// ["R", "chave limite %d.port %d.slot", "getLimitswitch", "Port1", "Slot1"],
			["R", "temperatura %d.port %d.slot °C", "getTemperature", "Port3", "Slot1"],
			// ["R", "sensor de presença %d.port", "getPirmotion", "Port2"],
			["-"],
			["R", "controle remoto %m.ircodes pressionado", "getIrRemote", "A"],
			["-"],
			// [" ", "enviar mensagem do mBot %s", "runIR", "ola"],
			// ["R", "mensagem recebida", "getIR"],
			// ["-"],
			["R", "cronômetro", "getTimer", "0"],
			[" ", "zerar cronômetro", "resetTimer", "0"]
		],
		menus: {
			motorPort: ["M1", "M2"],
			slot: ["Slot1", "Slot2"],
			index: ["todos", 1, 2],
			Axis: ["Eixo-X", "Eixo-Y"],
			port: ["Port1", "Port2", "Port3", "Port4"],
			aport: ["Port3", "Port4"],
			lport: ["led on board", "Port1", "Port2", "Port3", "Port4"],
			laport: ["sensor de luz on board", "Port3", "Port4"],
			direction: ["andar para a frente", "andar para trás", "virar à direita", "virar à esquerda"],
			points: [":", " "],
			note: ["C2", "D2", "E2", "F2", "G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6", "D6", "E6", "F6", "G6", "A6", "B6", "C7", "D7", "E7", "F7", "G7", "A7", "B7", "C8", "D8"],
			beats: ["Metade", "Quarto", "Oitavo", "Inteira", "Dupla", "Zero"],
			servovalue: [0, 45, 90, 135, 180],
			motorvalue: [255, 100, 75, 50, 0, -50, -75, -100, -255],
			value: [0, 20, 60, 150, 255],
			buttonStatus: ["pressionado", "liberado"],
			shutter: ["Pressionar", "Liberar", "Foco Ligado", "Foco Desligado"],
			switchStatus: ["Desligado", "Ligado"],
			ircode: ["A", "B", "C", "D", "E", "F", "↑", "↓", "←", "→", "Configuração", "R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9"],
		},
		url: 'http://gabrielcbe.github.io/scratchx-mbot/mbotx-teste.js'
	};
	// var mConnection;
	var mStatus = 0;
	
	// function getRequest() {
	// 		var url = location.search;
	// 		var theRequest = new Object();
	// 		if (url.indexOf("?") != -1) {
	// 				var str = url.substr(1);
	// 				if (str.indexOf("&") != -1) {
	// 						strs = str.split("&");
	// 						for (var i = 0; i < strs.length; i++) {
	// 								theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
	// 						}
	// 				} else {
	// 						theRequest[str.split("=")[0]] = unescape(str.split("=")[1]);
	// 				}
	// 		}
	// 		return theRequest;
	// }
	//var makeblockAppID = getRequest().id ? getRequest().id : "clgdmbbhmdlbcgdffocenbbeclodbndh"; //unique app ID for Hummingbird Scratch App
	
	ext._shutdown = function () {
		var msg = JSON.stringify({
			"command": "shutdown"
		});
		window.socket.send(msg);
	};
	
	// Status reporting code
	// Use this to report missing hardware, plugin or unsupported browser
	ext._getStatus = function (status, msg) {
		return {status: myStatus, msg: myMsg};
	};
	// ext._getStatus = function() {
	// 		return {
	// 				status: mStatus,
	// 				msg: mStatus == 2 ? 'Ready' : 'Not Ready'
	// 		};
	// };
	// ext._shutdown = function() {
	// 		if (poller) poller = clearInterval(poller);
	// 		status = false;
	// }
	
	// function getMakeblockAppStatus() {
	// 		chrome.runtime.sendMessage(makeblockAppID, {
	// 						message: "STATUS"
	// 				}, function(response) {
	// 						if (response === undefined) { //Chrome app not found
	// 								console.log("Chrome app not found");
	// 								mStatus = 0;
	// 								setTimeout(getMakeblockAppStatus, 1000);
	// 						} else if (response.status === false) { //Chrome app says not connected
	// 								mStatus = 1;
	// 								setTimeout(getMakeblockAppStatus, 1000);
	// 						} else { // successfully connected
	// 								if (mStatus !== 2) {
	// 										console.log("Connected");
	// 										mConnection = chrome.runtime.connect(makeblockAppID);
	// 										mConnection.onMessage.addListener(onMsgApp);
	// 								}
	// 								mStatus = 2;
	// 								setTimeout(getMakeblockAppStatus, 1000);
	// 						}
	// 				});
	// };
	
	function onMsgApp(msg) {
		//ver o que tem ser passado aqui ou deve tratar que nem no server
		//console.log('onMsgAppMsg.data: '+msg.data);
		
		//console.log('onMsgAppMsg.buffer: '+msg.buffer);
		var buffer = msg.data;
		for (var i = 0; i < buffer.length; i++) {
			onParse(buffer[i]);
		}
	};
	// var hid_info = {type: 'hid', vendor: 0x0416, product: 0xffff};
	
	//getMakeblockAppStatus();
	//ScratchExtensions.register('MindMakers-mBot', descriptor, ext, hid_info);
	ScratchExtensions.register('MindMakers-mBot', descriptor, ext);
})({});
