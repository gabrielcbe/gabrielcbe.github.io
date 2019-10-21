#!/usr/bin/env node

/*
  Interaçao com lampada flydea blueooth gabriel
*/

var noble = require('/home/mindmakers/programs/node_modules/noble/index.js')
const readline = require('readline');

// var ks = require('node-key-sender');
// var inquirer = require('inquirer');

const maclampada1 = 'ff:ff:f0:02:d1:14';
const maclampada2 = 'ff:ff:80:05:5d:90';

/*************************************************************
 * Comandos
 ************************************************************/

//56 RR GG BB 00 f0 aa     ------
//   RR GG BB são valores de 00 a ff de cores mensagem a mandar

var ledColorRed = new Buffer([0x56, 0xff, 0x00, 0x00, 0x00, 0xf0, 0xaa]);
var ledColorGreen = new Buffer([0x56, 0x00, 0xff, 0x00, 0x00, 0xf0, 0xaa]);
var ledColorBlue = new Buffer([0x56, 0x00, 0x00, 0xff, 0x00, 0xf0, 0xaa]);


// 56 00 00 00 WW 0f aa
//             WW é o valor de intensidade de branco a mandar

var ledColorWhite100 = new Buffer([0x56, 0x00, 0x00, 0x00, 0xff, 0x0f, 0xaa]);
var ledColorWhite50 = new Buffer([0x56, 0x00, 0x00, 0x00, 0x7d, 0x0f, 0xaa]);
var ledColorWhite10 = new Buffer([0x56, 0x00, 0x00, 0x00, 0x0a, 0x0f, 0xaa]);
var ledColorWhite0 = new Buffer([0x56, 0x00, 0x00, 0x00, 0x00, 0x0f, 0xaa]);


/*************************************************************
 * Conexão
 ************************************************************/
const serviceUuid = 'ffd5';
const signalCharacteristicUuid = 'ffd9';
const devName = "Triones";

var numeroScans = 0;

procuraLampada();

function procuraLampada() {
  noble.on('stateChange', function(state) {
    if (state == 'poweredOff') {
      console.log('');
      console.error('\x1b[31m', 'O Bluetooth não está ativado! Ative no ícone superior direito em seu computador e tente novamente.');
      console.error('\x1b[0m', '');
      process.exit(1);
    } else if (state == 'poweredOn') {
      console.log('---------------------------------------------------------------');
      console.log('                    Serviço Bluetooth Ativo                    ');
      console.log('---------------------------------------------------------------');
      console.log('Procurando por um mBot a menos de 2m para configurar...');
      noble.startScanning();
    } else {
      console.log('Encerrando procura por dispositivos Bluetooth');
      noble.stopScanning();
    }
  });

  noble.on('discover', function(peripheral) {

    console.log('Investigando dispositivos Bluetooth Low Energy (BLE)...');
    numeroScans++;

    if (peripheral.advertisement.localName &&
      peripheral.advertisement.localName.includes(devName) &&
      peripheral.rssi > -75 &&
      peripheral.address == maclampada2
    ) {

      console.log('\x1b[32m', 'Encontrou Lampada: ' + peripheral.address + ' [Nome: ' + peripheral.advertisement.localName +
        ', Conectável: ' + peripheral.connectable + ', RSSI: ' + peripheral.rssi + ']');
      console.log('');

      noble.stopScanning();

      conectaLampada(peripheral);
    }

    if (numeroScans >= 8) {
      console.error('\x1b[31m', 'Não foi possível encontrar um mBot ligado para registrar.');
      console.error('\x1b[31m', 'Confira se ele está ligado com a placa BLE e luz branca piscando.');
      console.error('\x1b[31m', 'Se tudo estiver ok, tente novamente após desligar e ligar a antena Bluetooth');
      console.error('\x1b[31m', 'do computador, usando o atalho no canto superior direito.');
      console.error('\x1b[0m', '----------------------------------------------------------------------------');
      // Encerra com falha
      noble.stopScanning();
      setTimeout(encerraAposLeitura, 10000);
    }

  });
}

function encerraAposLeitura() {

  process.exit(1)

}

function conectaLampada(peripheral) {

  peripheral.connect(function(error) {
    console.log('connected to peripheral: ' + peripheral.uuid);
    var macaddressConectado = peripheral.uuid;

    peripheral.discoverServices(serviceUuid, function(error, services) {
      var deviceInformationService = services[0];
      console.log('discovered device information service');

      deviceInformationService.discoverCharacteristics(signalCharacteristicUuid, function(error, characteristics) {
        var manufacturerNameCharacteristic = characteristics[0];
        console.log('discovered characteristic');

        servicoWritesData(deviceInformationService, manufacturerNameCharacteristic);
      });

    });

  });

  peripheral.once('disconnect', (error) => {
    console.log('Desconectou ', error);
    //erroConexao(error)
  });

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

}


process.stdin.on('keypress', (str, key) => {

  if (key.ctrl && key.name === 'c') {

    process.exit();

  } else { //if (!modoRegistro) {
    //  console.log(`You pressed the "${str}" key`);
    if (key.name == '0') {
      lampComms.write(ledColorWhite0, true, function(error) {

      });
    }
    if (key.name == '1') {
      lampComms.write(ledColorWhite100, true, function(error) {

      });
    }
    if (key.name == '2') {
      lampComms.write(ledColorWhite50, true, function(error) {

      });
    }
    if (key.name == '3') {
      lampComms.write(ledColorWhite10, true, function(error) {

      });
    }
    if (key.name == 'r') {
      lampComms.write(ledColorRed, true, function(error) {

      });
    }
    if (key.name == 'g') {
      lampComms.write(ledColorGreen, true, function(error) {

      });
    }
    if (key.name == 'b') {
      lampComms.write(ledColorBlue, true, function(error) {

      });
    }

  }
});

function servicoWritesData(services, characteristics) {
  lampComms = characteristics;

  lampComms.write(ledColorRed, true, function(error) {
    console.log('Lampada fica vermelha indicando conexão')
  });

}
