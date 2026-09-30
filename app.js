import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  update,
  increment,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configurações do Firebase (mantidas exatamente as mesmas)
const firebaseConfig = {
  apiKey: "AIzaSyDaECV1hUPXM8IxkY5dY153eyNcJFmv76Q",
  authDomain: "votacaosite-db29b.firebaseapp.com",
  databaseURL: "https://votacaosite-db29b-default-rtdb.firebaseio.com",
  projectId: "votacaosite-db29b",
  storageBucket: "votacaosite-db29b.firebasestorage.app",
  messagingSenderId: "144073471347",
  appId: "1:144073471347:web:67baf0d6aea77dd76e8106"
};

/* =========================================================================
   DESAFIO 1 (Iniciante): Inicialização do Firebase App
   Instrução: Descomente APENAS A LINHA CORRETA para inicializar o Firebase.
   ========================================================================= */
// const app = initialize(firebaseConfig);
// const app = initializeApp();
// const app = initializeApp(firebaseConfig);

const db = getDatabase(app);
const auth = getAuth(app);

// Elementos da Interface
const logincontainer = document.getElementById('login-container');
const votacaocontainer = document.getElementById('votacao-container');
const loginform = document.getElementById('login-form');
const loginerro = document.getElementById('login-erro');
const btnsair = document.getElementById('btn-sair');
const resultadoContainer = document.getElementById('resultado-container');

document.getElementById('btn-sair-resultado').addEventListener('click', () => signOut(auth));
btnsair.addEventListener('click', () => signOut(auth));

// Formulário de Login do Eleitor
loginform.addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  /* =========================================================================
     DESAFIO 2 (Iniciante): Autenticação do Eleitor
     Instrução: Descomente a chamada CORRETA para autenticar com e-mail e senha.
     ========================================================================= */
  // auth.signIn(email, senha)
  // signInWithEmailAndPassword(auth, email, senha)
  // signInWithEmailAndPassword(email, senha)
    .catch(() => {
      loginerro.textContent = "ERRO: Título de eleitor ou senha incorretos";
    });
});

// Monitoramento de Estado da Sessão do Eleitor
onAuthStateChanged(auth, async (usuario) => {
  if (usuario) {
    /* =========================================================================
       DESAFIO 3 (Intermediário): Leitura da Data de Encerramento da Eleição
       Instrução: Descomente a busca assíncrona CORRETA do nó "configuracao/data_fim".
       ========================================================================= */
    // const configSnapshot = get(db.ref("configuracao/data_fim"));
    // const configSnapshot = await get(ref(db, "configuracao/data_fim"));
    // const configSnapshot = await ref(db, "configuracao/data_fim").val();

    let votacaoEncerrada = false;

    if (configSnapshot && configSnapshot.exists()) {
      const dataFim = new Date(configSnapshot.val());
      const dataAtual = new Date();

      if (dataAtual >= dataFim) {
        votacaoEncerrada = true;
      }
    }

    if (votacaoEncerrada) {
      // Exibe painel de resultados
      logincontainer.style.display = 'none';
      votacaocontainer.style.display = 'none';
      resultadoContainer.style.display = 'flex';

      mostrarResultados();
    } else {
      // Exibe cédula de votação oficial
      logincontainer.style.display = 'none';
      votacaocontainer.style.display = 'block';
      resultadoContainer.style.display = 'none';

      // Carrega o voto prévio do usuário (se houver)
      const snapshot = await get(ref(db, "votos_usuarios/" + usuario.uid));
      if (snapshot.exists()) {
        const idCandidato = snapshot.val();
        document.querySelectorAll('.bolinha-verde').forEach(dot => dot.classList.remove('ativa'));

        const bolinha = document.getElementById(`dot-${idCandidato}`);
        if (bolinha) {
          bolinha.classList.add("ativa");
        }
      }
    }
  } else {
    // Usuário deslogado
    logincontainer.style.display = 'flex';
    votacaocontainer.style.display = 'none';
    resultadoContainer.style.display = 'none';

    loginform.reset();
    document.querySelectorAll('.bolinha-verde').forEach(dot => dot.classList.remove('ativa'));
  }
});

// Envio do Voto à Urna Digital
async function votarCandidato(id) {
  const usuario = auth.currentUser;
  if (!usuario) return;

  const votoUsuarioRef = ref(db, "votos_usuarios/" + usuario.uid);
  const candidatoEspecificoRef = ref(db, "candidatos/" + id);

  try {
    /* =========================================================================
       DESAFIO 4 (Intermediário): Validação se o Eleitor Já Votou
       Instrução: Descomente o comando CORRETO que verifica se o snapshot existe.
       ========================================================================= */
    const javotou = await get(votoUsuarioRef);
    // if (javotou.val() == true) {
    // if (javotou.exists()) {
    // if (javotou.hasChildren) {
      alert("Atenção: Você já exerceu seu voto! Não é permitido votar novamente.");
      return;
    }

    /* =========================================================================
       DESAFIO 5 (Intermediário): Incremento Atômico de Votos no Banco
       Instrução: Descomente a instrução CORRETA que soma 1 voto ao candidato.
       ========================================================================= */
    // await set(candidatoEspecificoRef, { votos: increment(1) });
    // await update(candidatoEspecificoRef, { votos: votos + 1 });
    // await update(candidatoEspecificoRef, { votos: increment(1) });

    await set(votoUsuarioRef, id);

    document.querySelectorAll('.bolinha-verde').forEach(dot => dot.classList.remove('ativa'));
    const bolinha = document.getElementById(`dot-${id}`);
    if (bolinha) {
      bolinha.classList.add("ativa");
    }
    alert("Voto para Prefeito computado com sucesso na urna eletrônica!");

  } catch (error) {
    alert("Ocorreu um erro ao processar o seu voto.");
    console.error("Erro ao votar:", error);
  }
}

// Apuração das Eleições Municipais
async function mostrarResultados() {
  const snapshot = await get(ref(db, "candidatos"));

  if (snapshot.exists()) {
    const candidatos = snapshot.val();

    // candidato_1 = Maria Souza | candidato_2 = Guilherme Dias
    const maria = candidatos.candidato_1 || { votos: 0 };
    const guilherme = candidatos.candidato_2 || { votos: 0 };

    let vencedorNome, vencedorVotos, vencedorFoto;
    let resumoPlacar = "";

    if (maria.votos > guilherme.votos) {
      vencedorNome = "Maria Souza (Eleita)";
      vencedorVotos = maria.votos;
      vencedorFoto = "https://static.vecteezy.com/ti/vetor-gratis/p1/4314066-afro-mulher-pos-graduada-gratis-vetor.jpg";
      resumoPlacar = `Guilherme Dias obteve ${guilherme.votos} voto(s).`;
    } else if (guilherme.votos > maria.votos) {
      vencedorNome = "Guilherme Dias (Eleito)";
      vencedorVotos = guilherme.votos;
      vencedorFoto = "https://static.vecteezy.com/ti/vetor-gratis/t2/18969941-feliz-estudante-de-pos-graduacao-afro-com-um-diploma-em-touca-e-roupao-de-formatura-jovem-que-se-formou-nos-estudos-ilustracaoial-plana-sobre-fundo-branco-vetor.jpg";
      resumoPlacar = `Maria Souza obteve ${maria.votos} voto(s).`;
    } else {
      vencedorNome = "Segundo Turno / Empate!";
      vencedorVotos = maria.votos;
      vencedorFoto = "https://ui-avatars.com/api/?name=Empate&background=1d4ed8&color=fff";
      resumoPlacar = `Ambos os candidatos obtiveram ${maria.votos} voto(s).`;
    }

    document.getElementById('resultado-nome').textContent = vencedorNome;
    document.getElementById('resultado-votos').textContent = vencedorVotos;
    document.getElementById('resultado-foto').src = vencedorFoto;
    document.getElementById('placar-geral').textContent = resumoPlacar;
  }
}

// Configuração dos Botões de Confirmação de Voto
const botoesVotar = document.querySelectorAll('.btn-votar');

botoesVotar.forEach((botao) => {
  botao.addEventListener('click', (evento) => {
    /* =========================================================================
       DESAFIO 6 (Iniciante / DOM): Captura do ID do Candidato Escolhido
       Instrução: Descomente a linha que lê o atributo "data-id" do botão clicado.
       ========================================================================= */
    // const idDoCandidato = evento.target.id;
    // const idDoCandidato = evento.target.getAttribute('data-id');
    // const idDoCandidato = evento.target.value;

    votarCandidato(idDoCandidato);
  });
});