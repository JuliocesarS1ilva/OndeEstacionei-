# Onde Estacionei? — Projeto 4

Aplicativo Android acadêmico desenvolvido com React Native + Expo. Implementa os requisitos do enunciado: salvar coordenadas do veículo, mapa, rota a pé, temporizador, notificação local 10 minutos antes do vencimento, distância aproximada, leitura do barômetro quando disponível, identificação manual de andar/setor e persistência com AsyncStorage.

## Requisitos

- Node.js LTS e npm
- Android Studio + Android SDK
- Celular Android ou emulador com Google Play Services
- Chave de API do Google Maps com Maps SDK for Android habilitada (para exibir o mapa)

## Instalação

1. Extraia o ZIP.
2. Abra um terminal na pasta do projeto.
3. Execute `npm install`.
4. No arquivo `app.json`, substitua `SUA_CHAVE_GOOGLE_MAPS` pela sua chave de API.
5. Execute `npx expo prebuild --platform android`.
6. Execute `npx expo run:android`.

Para iniciar o servidor de desenvolvimento: `npx expo start`.

> Este projeto usa módulos nativos (mapa, sensores e notificações). Por isso, use um development build/compilação Android; o Expo Go pode não oferecer todos os módulos na configuração necessária.

## Como usar

1. Autorize localização e notificações quando solicitadas.
2. Estacione o veículo.
3. Informe a duração em minutos e, se desejar, andar/setor/vaga.
4. Toque em **Salvar onde estacionei**.
5. O mapa exibirá o marcador do veículo e o temporizador começará.
6. Toque em **Traçar rota a pé até o veículo** para abrir o aplicativo de mapas.
7. A notificação local é agendada para 10 minutos antes do vencimento (quando a duração for superior a 10 minutos).
8. A localização e os dados ficam salvos no armazenamento local, inclusive após fechar o aplicativo.

## Tecnologias utilizadas

| Recurso do enunciado | Implementação |
|---|---|
| Localização e mapas | `expo-location` e `react-native-maps` |
| Notificações | `expo-notifications` |
| Widgets / informações rápidas | Interface inicial com tempo e distância; integração de widget Android pode ser adicionada como extensão nativa |
| Sensores | `expo-sensors` (Barometer) |
| Persistência | `@react-native-async-storage/async-storage` |

## Observações técnicas importantes

- A distância apresentada é uma estimativa em linha reta, não a distância do trajeto pelas ruas.
- A rota a pé é calculada pelo aplicativo de mapas externo, não pelo app.
- O barômetro não identifica sozinho o andar de um prédio. A altitude é aproximada e pode variar com a pressão atmosférica; por isso existe o campo manual de andar/setor.
- Notificações dependem da permissão do Android e das restrições de bateria do aparelho.
- O app pede localização em primeiro plano; não acompanha o usuário continuamente em segundo plano.
- O widget nativo de tela inicial do Android é um requisito adicional que precisa ser conectado a um `AppWidgetProvider`/biblioteca e validado em aparelho. Nesta entrega, o painel dentro do aplicativo mostra as informações equivalentes; não afirmar que já existe um widget externo funcional.

## Estrutura

- `App.js` — tela principal, GPS, mapa, temporizador, notificação, barômetro e armazenamento.
- `app.json` — configuração Expo e permissões Android.
- `package.json` — dependências e comandos.
