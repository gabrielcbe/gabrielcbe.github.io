/*
  Teste IoT sala 4.0
  Copyright(c) Mind Makers Editora Educacional Ltda. Todos os direitos reservados
*/

const request = require('request');
var inquirer = require('inquirer');
var fs = require('fs');

// Comandos
const DESLIGA = 'off';
const DESLIGA_MONITOR = 'monitoroff';
const LIGA_MONITOR = 'monitoron';
const OBTEM_INFO = 'oi';
const EXIBE_IMAGEM = 'img';
// const EXECUTA_URL = 'url';
// const COMANDOS_VALIDOS = [OBTEM_INFO,DESLIGA,DESLIGA_MONITOR,LIGA_MONITOR,EXIBE_IMAGEM,EXECUTA_URL];
const COMANDOS_VALIDOS = [OBTEM_INFO, DESLIGA, DESLIGA_MONITOR, LIGA_MONITOR, EXIBE_IMAGEM];

// Macros
const DEMO1 = 'demo1';
const DEMO2 = 'demo2';
const DEMO3 = 'demo3';
const TESTE = 'teste';
const MACROS_VALIDAS = [DEMO1, DEMO2, DEMO3, TESTE];

var questions = [{
    type: 'confirm',
    name: 'opcao',
    message: "Deseja testar sala IoT?"
  },
  {
    type: 'input',
    name: 'login',
    message: "Informe seu usuário Mind Makers:",
    when: function(answers) {
      return answers.opcao;
    }
  },
  {
    type: 'password',
    name: 'senha',
    message: "Informe sua senha:",
    when: function(answers) {
      return answers.opcao;
    }
  }
];

var questions2 = [{
  type: 'list',
  name: 'escola',
  message: "Selecione a escola",
  choices: function(answers) {
    return lista_escolas;
  }
}];

var questions3 = [{
    type: 'list',
    name: 'opcao',
    message: "Selecione a opção de teste",
    choices: [DEMO1, DEMO2, DEMO3, TESTE, 'Comando para Sala', 'Comando para Estação', 'Sair']
  },
  {
    type: 'number',
    name: 'salaId',
    message: "Identifique a sala (no teste, de 1 ou 2)",
    default: 1,
    when: function(answers) {
      return answers.opcao != 'Sair';
    },
    validate: function(valor) {
      return Number.isInteger(valor) && parseInt(valor) >= 1 && parseInt(valor) <= 2;
    },
  },
  {
    type: 'list',
    name: 'comando',
    message: "Selecione um comando",
    //choices: [DESLIGA_MONITOR, LIGA_MONITOR, DESLIGA, EXIBE_IMAGEM, EXECUTA_URL],
    choices: [DESLIGA_MONITOR, LIGA_MONITOR, DESLIGA, EXIBE_IMAGEM],
    when: function(answers) {
      return answers.opcao == 'Comando para Sala' || answers.opcao == 'Comando para Estação';
    },
  },
  {
    type: 'input',
    name: 'complemento',
    message: "Informe o nome da imagem sem sufixo ou URL",
    when: function(answers) {
      //return answers.comando == EXIBE_IMAGEM || answers.comando == EXECUTA_URL;
      return answers.comando == EXIBE_IMAGEM;
    }
  },
  {
    type: 'number',
    name: 'estacaoId',
    message: "Informe o número da estação (no teste, de 1 a 21)",
    default: 1,
    when: function(answers) {
      return answers.opcao == 'Comando para Estação';
    },
    validate: function(valor) {
      return Number.isInteger(valor) && parseInt(valor) >= 1 && parseInt(valor) <= 21;
    },
  }
];

//1st call
testarIoT()

function testarIoT()
 {

  inquirer.prompt(questions).then(answers => {

    if (answers.opcao) {
      idescola_informado = answers.idescola;
      recuperaCodigoNomeEscola(answers);

    }
  });

}

function recuperaCodigoNomeEscola(resposta) {
  // console.log('vai recuperar escola:'+resposta.idescola);
  request({
      url: 'https://mindmakers.cc/api/Escolas/listaEscolas/publico',
      method: 'POST',
      form: {
        'username': resposta.login,
        'password': resposta.senha
      }
    },
    function(error, response, body) {
      bodyJ = JSON.parse(body);
      if (!bodyJ.success) {
        console.log('Erro ao recuperar escola: ' + bodyJ.err);
        console.log('');
        console.log('Reconfira seu usuário/senha e sua conexão. Caso o problema persista contate o suporte da Mind Makers em suporte@mindmakers.cc para obter apoio');
        process.exit(1);
      } else {

        adaptaListaEscolas(bodyJ.listaEscolas);

        inquirer.prompt(questions2).then(answers => {

          configuraEscola(answers.escola);

          selecionaSalaComando(answers);

        });

      }
    }
  );
}

function selecionaSalaComando(answers) {

  inquirer.prompt(questions3).then(answers => {

    if (answers.opcao == 'Sair')
      return

    var macro;
    var comando;

    if (answers.opcao == DEMO1 || answers.opcao == DEMO2 || answers.opcao == DEMO3 || answers.opcao == TESTE) {

      console.log(answers);
      testaMacros(answers.escola, answers.salaId + '', answers.opcao);

    } else {

      estacaoIdStr = answers.estacaoId
      if (estacaoIdStr != null)
        estacaoIdStr = estacaoIdStr + ''

      console.log(answers);

      testaComando(answers.login, answers.senha, answers.comando, answers.escola, answers.salaId + '', estacaoIdStr, answers.complemento, false);

    }

  });

}

function adaptaListaEscolas(listaEscolasRecuperada) {

  lista_escolas = [];

  for (i = 0; i < listaEscolasRecuperada.length; i++) {

    lista_escolas.push({
      'name': listaEscolasRecuperada[i].nome,
      'value': listaEscolasRecuperada[i].id,
      'short': listaEscolasRecuperada[i].nome
    });

  }

  lista_escolas.sort(compare);

}

function configuraEscola(idEscola) {

  console.log(idEscola)
  idescola_informado = idEscola;

  escolanome_recuperado = ''

  for (i = 0; i < lista_escolas.length; i++) {

    if (lista_escolas[i].value == idEscola) {
      escolanome_recuperado = lista_escolas[i].name;
      console.log(escolanome_recuperado);
      return
    }

  }

}

function compare(a, b) {
  // Use toUpperCase() to ignore character casing
  const nameA = a.name.toUpperCase();
  const nameB = b.name.toUpperCase();

  let comparison = 0;
  if (nameA > nameB) {
    comparison = 1;
  } else if (nameA < nameB) {
    comparison = -1;
  }
  return comparison;
}


function testaMacros(escolaId, salaId, macro) {

  console.log('entrou para executar macro');

  request({
      url: 'https://mindmakers.cc/iot/sala/macro',
      method: 'POST',
      json: {
        'login': 'fulano',
        'senha': 'senha1',
        'escola': escolaId,
        'sala': salaId,
        'macro': macro
      }
    },
    function(error, response, body) {
      console.log('body1: ' + JSON.stringify(body));
      console.log('response1: ' + JSON.stringify(response));
      console.log('error1: ' + JSON.stringify(error));
      /*
      if (error) {
        console.log('Erro tentar executar macro: ' + error);
      } else {
        console.log('Macro executada com sucesso! ');
        console.log(body);
      }
      */
    }
  );

}


function testaComando(login, pwd, comando, escola, sala, estacao, complemento, incluiInstrutor) {

  console.log('entrou para executar comando');

  request({
      url: 'https://mindmakers.cc/iot/sala/comando',
      method: 'POST',
      json: {
        'login': login,
        'senha': pwd,
        'comando': comando,
        'escola': escola,
        'sala': sala,
        'estacao': estacao,
        'complemento': complemento,
        'incluiInstrutor': incluiInstrutor
      }
    },
    function(error, response, body) {
      console.log('body1: ' + JSON.stringify(body));
      console.log('response1: ' + JSON.stringify(response));
      console.log('error1: ' + JSON.stringify(error));
      /*
      if (!body.success || error) {
          if (!body.success)
            console.log('Erro ao atualizar versÃ£o da estaÃ§Ã£o na plataforma: '+JSON.stringify(body.err));
          else
            console.log('Erro ao atualizar versÃ£o da estaÃ§Ã£o na plataforma: '+error);
      } else {
          console.log('Sucesso! ');
          console.log('Erro: ' + erro);
          console.log('response! ' + response);
          console.log('body: ' + body);
      }*/

    }
  );

}
