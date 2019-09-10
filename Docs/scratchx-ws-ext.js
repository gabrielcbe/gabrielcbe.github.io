/*
V2.0
Teste IoT sala 4.0
Copyright(c) Mind Makers Editora Educacional Ltda. Todos os direitos reservados
*/

const request = require('request');
var inquirer = require('inquirer');
var fs = require('fs');

var URL_BASE = 'https://mindmakers.cc/iot/sala';
//var URL_BASE = 'http://localhost/api/sala';

// Comandos
const DESLIGA = 'off';
const DESLIGA_MONITOR = 'monitoroff';
const LIGA_MONITOR = 'monitoron';
const OBTEM_INFO = 'oi';
const EXIBE_IMAGEM = 'img';
const NUMERO = 'N';
const ROBOGODE = 'G';
const ROBOLADY = 'L';
const MINDMAKERS = ['m', 'i', 'n', 'd', 'm', 'a', 'k', 'e', 'r', 's'];
// const EXECUTA_URL = 'url';
// const COMANDOS_VALIDOS = [OBTEM_INFO,DESLIGA,DESLIGA_MONITOR,LIGA_MONITOR,EXIBE_IMAGEM,EXECUTA_URL];
const COMANDOS_VALIDOS = [OBTEM_INFO, DESLIGA, DESLIGA_MONITOR, LIGA_MONITOR, EXIBE_IMAGEM];

// Macros
const DEMO1 = 'demo1';
const DEMO2 = 'demo2';
const DEMO3 = 'demo3';
const TESTE = 'teste';
const NODERED = 'nodered';
const MACROS_VALIDAS = [DEMO1, DEMO2, DEMO3, TESTE, NODERED];

var login;
var pwd;
var comando;
var escola;
var sala;
var estacao;
var complemento;
var incluiInstrutor;
var acao;
var quantiEstacao;

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
    choices: [DEMO1, DEMO2, DEMO3, TESTE, NODERED, 'Comando para Sala', 'Comando para Estação', 'Sair']
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
    choices: [OBTEM_INFO, DESLIGA_MONITOR, LIGA_MONITOR, DESLIGA, EXIBE_IMAGEM],
    when: function(answers) {
      return answers.opcao == 'Comando para Sala' || answers.opcao == 'Comando para Estação';
    },
  },
  {
    type: 'list',
    name: 'acao',
    message: "Selecione uma acao",
    choices: [NUMERO, ROBOGODE, ROBOLADY],
    when: function(answers) {
      return answers.opcao == NODERED;
    },
  },
  {
    type: 'number',
    name: 'estacaoQt',
    message: "Informe quantas estações há na sala (no teste, de 1 a 21)",
    default: 16,
    when: function(answers) {
      return answers.opcao == NODERED;
    },
    validate: function(valor) {
      return Number.isInteger(valor) && parseInt(valor) >= 1 && parseInt(valor) <= 21;
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

function testarIoT() {

  inquirer.prompt(questions).then(answers => {

    //console.log(answers);

    login = answers.login;
    pwd = answers.senha;

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

          //console.log('antes: ' + JSON.stringify(answers));
          configuraEscola(answers.escola);

          selecionaSalaComando(answers);

        });

      }
    }
  );
}

function selecionaSalaComando(answers) {

  inquirer.prompt(questions3).then(answers => {

    //console.log(answers);

    var comando = answers.comando;
    var sala = answers.salaId;
    var estacaoIdStr = answers.estacaoId;
    var complemento = answers.complemento;
    var macro = answers.opcao;
    var incluiInstrutor = false;
    var acao = answers.acao;
    var quantiEstacao = parseInt(answers.estacaoQt);

    if (answers.opcao == 'Sair')
      return

    if (answers.opcao == DEMO1 || answers.opcao == DEMO2) {

      console.log('answersDEMO ' + JSON.stringify(answers));
      console.log('login ' + login);
      console.log('pwd ' + pwd);
      console.log('escola ' + escola);
      console.log('sala ' + sala);
      console.log('macro ' + macro);

      testaMacros(login, pwd, escola, sala, macro);

    } else if (answers.opcao == DEMO3) {

      for (let j = 0; j < MINDMAKERS.length; j++) {
        console.log(MINDMAKERS[j]);
        testaComando(login, pwd, 'img', escola, sala, j, MINDMAKERS[j], incluiInstrutor); //ou j-1 em MINDMAKERS
      }

    } else if (answers.opcao == TESTE) {

      for (let j = 0; j < quantiEstacao; j++) {
        testaComando(login, pwd, 'img', escola, sala, j, j, incluiInstrutor);
      }

    } else if (answers.opcao == NODERED) {

      console.log('answersDEMO ' + JSON.stringify(answers));
      console.log('acao ' + acao);
      console.log('escola ' + escola);
      console.log('sala ' + sala);
      console.log('numero ' + quantiEstacao);
      console.log('estacao ' + estacao);

      for (let j = 0; j < 12; j++) {
        testaNodeRED(acao, escola, sala, j, j);
      }

      //testaNodeRED(acao, escola, sala, numero, estacao);


    } else {

      // estacaoIdStr = answers.estacaoId
      // if (estacaoIdStr != null)
      //   estacaoIdStr = estacaoIdStr + ''

      console.log('answersRESTO ' + JSON.stringify(answers));
      console.log('login ' + login);
      console.log('pwd ' + pwd);
      console.log('comando ' + comando);
      console.log('escola ' + escola);
      console.log('sala ' + sala);
      console.log('estacao ' + estacaoIdStr);
      console.log('complemento ' + complemento);
      console.log('incluiInstrutor ' + incluiInstrutor);

      testaComando(login, pwd, comando, escola, sala, estacaoIdStr, complemento, incluiInstrutor);

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
  escola = idEscola;
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


function testaMacros(login, pwd, escolaId, salaId, macro) {

  console.log('entrou para executar macro');

  request({
      url: URL_BASE + '/macro',
      method: 'POST',
      json: {
        'login': login,
        'senha': pwd,
        'escola': escolaId,
        'idescola': escolaId,
        'estacoes': estacao,
        'estacao': estacao,
        'sala': salaId,
        'nomemacro': macro,
        'macro': macro
      }
    },
    function(error, response, body) {
      console.log('body1: ' + JSON.stringify(body));
      console.log('response1: ' + JSON.stringify(response));
      console.log('error1: ' + JSON.stringify(error));

      // if (error) {
      //   console.log('Erro tentar executar macro: ' + error);
      // } else {
      //   console.log('Macro executada com sucesso! ');
      //   console.log(body);
      // }

    }
  );

}


function testaComando(login, pwd, comando, escola, sala, estacao, complemento, incluiInstrutor) {

  console.log('entrou para executar comando');

  request({
      url: URL_BASE + '/comando',
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

      // if (!body.success || error) {
      //   if (!body.success)
      //     console.log('Erro ao atualizar versão da estção na plataforma: ' + JSON.stringify(body.err));
      //   else
      //     console.log('Erro ao atualizar versão da estação na plataforma: ' + error);
      // } else {
      //   console.log('Sucesso! ');
      //   console.log('Erro: ' + erro);
      //   console.log('response! ' + response);
      //   console.log('body: ' + body);
      // }

    }
  );

}


async function testaNodeRED(acao, id1, id2, numero, estacao) {

  console.log('entrou para executar NodeRED');

  request({
      url: URL_BASE + '/code',
      method: 'POST',
      json: {
        'acao': acao,
        'id1': id1,
        'id2': id2,
        'numero': numero,
        'estacao': estacao
      }
    },
    function(error, response, body) {

      if (!body.success || error) {
        if (!body.success)
          console.log('Erro ao executar código: ' + JSON.stringify(body.err));
        else
          console.log('Erro ao executar código: ' + error);
      } else {
        console.log('Via NodeRED executado com Sucesso! ');
        console.log('body: ' + JSON.stringify(body));
        //   console.log('Macro executada com sucesso! ');
        //   console.log(body);

      }

    }
  );

}
