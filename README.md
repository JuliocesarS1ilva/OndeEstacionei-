# Onde Estacionei?

Aplicativo mobile desenvolvido com React Native e Expo para ajudar motoristas a registrar e encontrar o local onde estacionaram seus veículos.

## 1. Sobre o projeto

O **Onde Estacionei?** é uma solução de estacionamento inteligente que utiliza recursos de geolocalização e sensores do smartphone para facilitar a localização de veículos estacionados.

O aplicativo permite salvar a localização do veículo, consultar informações sobre o estacionamento e visualizar sua posição em um mapa.

## 2. Funcionalidades

- **Salvar estacionamento:** registra a localização atual do veículo utilizando o GPS do smartphone.
- **Visualização no mapa:** exibe a posição do veículo no Google Maps.
- **Localização do veículo:** permite consultar a posição salva e estimar a distância até ela.
- **Cronômetro:** acompanha o tempo de estacionamento.
- **Notificações:** envia um lembrete 10 minutos antes do término do período configurado.
- **Informações do estacionamento:** permite registrar manualmente o andar, setor ou vaga.
- **Sensor barométrico:** utiliza o barômetro do dispositivo, quando disponível, para obter informações de pressão atmosférica que podem auxiliar na identificação de variações de altitude.
- **Navegação:** permite abrir aplicativos externos de mapas para traçar uma rota até o veículo.

## 3. Tecnologias utilizadas

| Tecnologia | Finalidade |
|---|---|
| React Native | Desenvolvimento mobile |
| Expo | Ambiente de desenvolvimento |
| JavaScript | Linguagem de programação |
| Google Maps | Exibição do mapa |
| Expo Location | Geolocalização |
| Expo Notifications | Notificações locais |
| Expo Sensors | Acesso aos sensores |
| AsyncStorage | Armazenamento local de dados |

## 4. Requisitos para execução

Antes de iniciar, instale:

- Node.js (versão LTS recomendada).
- npm.
- Android Studio.
- Android SDK.
- JDK 17.
- Um dispositivo Android com depuração USB ativada ou um emulador Android.

## 5. Instalação

Clone o repositório ou extraia os arquivos do projeto.

Abra o terminal na pasta principal do projeto:

```bash
cd Projeto_4_Onde_Estacionei
```

Instale as dependências:

```bash
npm install
```

## 6. Configuração do Google Maps

Para que o mapa seja exibido corretamente no Android, é necessário configurar uma chave de API do Google Maps.

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um projeto.
3. Ative a API **Maps SDK for Android**.
4. Configure uma conta de faturamento, caso seja solicitada.
5. Acesse a seção de credenciais.
6. Crie uma chave de API.

Abra o arquivo `app.json` e configure a chave:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "SUA_CHAVE_GOOGLE_MAPS"
        }
      }
    }
  }
}
```

Substitua `SUA_CHAVE_GOOGLE_MAPS` pela chave gerada no Google Cloud.

**Importante:** mantenha a chave protegida e configure restrições de uso para o aplicativo Android.

## 7. Executando o projeto

### Preparação do Android

Caso seja a primeira execução ou tenha ocorrido alguma alteração na configuração nativa, execute:

```bash
npx expo prebuild --platform android
```

### Executar no Android

Conecte um smartphone com a depuração USB ativada ou inicie um emulador pelo Android Studio.

Na pasta principal do projeto, execute:

```bash
npx expo run:android
```

Esse comando compila o aplicativo, instala no dispositivo conectado e inicia o ambiente de desenvolvimento.

### Iniciar somente o servidor Expo

Para iniciar o servidor de desenvolvimento:

```bash
npx expo start
```

Para limpar o cache do Metro:

```bash
npx expo start --clear
```

## 8. Estrutura do projeto

```text
Projeto_4_Onde_Estacionei/
│
├── android/
│   └── Arquivos nativos do Android
│
├── node_modules/
│   └── Dependências instaladas
│
├── App.js
│   └── Código principal do aplicativo
│
├── app.json
│   └── Configurações do Expo e Google Maps
│
├── babel.config.js
│   └── Configuração do Babel
│
├── package.json
│   └── Dependências e scripts
│
└── README.md
    └── Documentação do projeto
```

## 9. Armazenamento de dados

O aplicativo utiliza o AsyncStorage para armazenar informações localmente no dispositivo.

Isso permite manter os dados do estacionamento registrados mesmo após fechar e abrir o aplicativo novamente.

O projeto não depende de um servidor ou banco de dados remoto para suas funcionalidades principais.
