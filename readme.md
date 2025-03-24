# 🧠 Assistente de Apresentação com Voz (ChatGPT + ElevenLabs + Flask + React)

Um assistente inteligente para apresentações com capacidade de narrar slides e interagir por voz com o apresentador ou a audiência.

## ✨ Funcionalidades

- **Narração automática de slides**: analisa e narra o conteúdo de cada slide de forma natural
- **Comandos de voz**: controle a apresentação com comandos como "só um minuto, GPT" e "pode continuar, GPT"
- **Perguntas e respostas**: faça perguntas ao assistente durante a apresentação
- **Interface amigável**: upload de PDF, controles de slides e visualização do texto
- **Integração com IA**: utiliza OpenAI ChatGPT e ElevenLabs para processamento de linguagem natural e síntese de voz

## 🔧 Pré-requisitos

- Docker e Docker Compose instalados
- Um VPS com Ubuntu (recomendado)
- Domínio configurado para apontar para seu servidor
- Chaves de API: OpenAI e ElevenLabs

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/assistente-apresentacao.git
cd assistente-apresentacao
```

### 2. Configure as variáveis de ambiente

Edite o arquivo `.env` com suas configurações:

```bash
# Configure o domínio e as chaves de API
nano .env
```

### 3. Instale e inicie os serviços com Docker Compose

```bash
docker-compose up -d
```

### 4. Acesse o aplicativo

Abra seu navegador e acesse `https://seudominio.com`

## 🔍 Estrutura do Projeto

```
meu-projeto/
├── backend/               # Backend Flask com OpenAI e ElevenLabs
│   ├── app.py             # API principal
│   ├── Dockerfile         # Configuração do container
│   ├── requirements.txt   # Dependências Python
│   └── .env               # Variáveis de ambiente (não versionado)
├── frontend/              # Frontend React
│   ├── public/            # Arquivos estáticos
│   ├── src/               # Código fonte React
│   │   ├── App.js         # Componente principal
│   │   └── App.css        # Estilos
│   ├── Dockerfile         # Configuração do container
│   ├── nginx.conf         # Configuração do Nginx
│   └── package.json       # Dependências npm
├── docker-compose.yml     # Orquestração dos serviços
└── .env                   # Variáveis de ambiente (não versionado)
```

## 📝 Uso

1. Acesse a aplicação no navegador
2. Faça upload de um arquivo PDF com sua apresentação
3. Clique no botão "Iniciar Microfone" para ativar o reconhecimento de voz
4. Use os botões para navegar entre os slides ou peça ao assistente para narrar o slide atual
5. Faça perguntas ou dê comandos por voz durante a apresentação

### Comandos de voz

- **"Só um minuto, GPT"**: pausa a narração
- **"Pode continuar, GPT"**: retoma a apresentação
- **Perguntas livres**: o assistente irá responder usando o contexto do slide atual

## 🛠️ Desenvolvimento local

Para desenvolvimento local sem Docker:

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## 📄 Licença

Este projeto está licenciado sob os termos da licença MIT.

## 👨‍💻 Autor

Desenvolvido para uso em apresentações dinâmicas com interação por voz.