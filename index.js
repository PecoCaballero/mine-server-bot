const discord = require("discord.js");
const { google } = require("googleapis");
const McStatus = require("mcstatus");
const fs = require("fs");
// require('dotenv').config()
const express = require("express");

const port = process.env.PORT || 20;

const server = express();

server.listen(port, () => {
  const keyJson = require("./endless-sol-226009-9df1057b48c1");

  let keyFileContent = JSON.stringify(keyJson);

  keyFileContent = keyFileContent.split("\\\\n").join("\\n");

  fs.writeFileSync(
    "./endless-sol-226009-9df1057b48c1.json",
    keyFileContent,
    (err) => {
      if (err) {
        console.log("Error writing file", err);
      } else {
        console.log("Successfully wrote file");
      }
    }
  );

  const mineServerConfig = {
    host: "35.237.68.187",
    port: 25565,
  };

  const client = new discord.Client();

  client.once("ready", () => {
    console.log("Ready!");
  });

  client.login(process.env.TOKEN);

  client.on("message", async (message) => {
    const mineRegex = new RegExp("^!mine.*");

    const authClient = await google.auth
      .getClient({
        keyFile: "./endless-sol-226009-9df1057b48c1.json",
        scopes: [
          "https://www.googleapis.com/auth/cloud-platform",
          "https://www.googleapis.com/auth/compute",
          "https://www.googleapis.com/auth/compute.readonly",
        ],
      })
      .then((result) => result);
    google.options({ auth: authClient });
    const compute = google.compute("v1");
    if (message.content === "!mine start") {
      await compute.instances
        .start({
          project: "endless-sol-226009",
          auth: authClient,
          zone: "us-east1-b",
          instance: "mine-server-1",
        })
        .then((response) =>
          message.channel.send(
            "Server iniciado!\nDesligue as luzes ao sair com !mine stop"
          )
        );
    } else if (message.content === "!mine status") {
      const computeResponse = await compute.instances.get({
        project: "endless-sol-226009",
        auth: authClient,
        zone: "us-east1-b",
        instance: "mine-server-1",
      });
      if (computeResponse.data.status == "RUNNING") {
        await McStatus.checkStatus(mineServerConfig).then((serverResponse) => {
          message.channel
            .send(`Status do servidor: ${computeResponse.data.status}
Players online: ${serverResponse.players}/${serverResponse.max_players} 
Ping: ${serverResponse.ping} ms
                `);
        });
      } else {
        message.channel.send(`Status do servidor: ${computeResponse.data.status}
${
  computeResponse.data.status == "TERMINATED" ||
  computeResponse.data.status == "STOPPING"
    ? "Para iniciar o servidor basta enviar !mine start"
    : ""
}`);
      }
    } else if (message.content === "!mine stop") {
      const serverStatus = await McStatus.checkStatus(mineServerConfig);
      if (serverStatus.players == 0) {
        const computeResponse = await compute.instances
          .stop({
            project: "endless-sol-226009",
            auth: authClient,
            zone: "us-east1-b",
            instance: "mine-server-1",
          })
          .then((response) => message.channel.send("Server desligado."));
      } else {
        message.channel.send(
          `${serverStatus.players} jogando no momento. Não é possível encerrar o server`
        );
      }
    } else if (message.content === "!mine") {
      await McStatus.checkStatus(mineServerConfig).then((serverResponse) => {
        message.channel.send(`
${serverResponse.motd}
Versão: ${serverResponse.version}

Para ver se o server está ativo basta enviar !mine status
            `);
      });
    } else if (mineRegex.test(message.content)) {
      message.channel.send(
        `
Comando Inválido.
Tente os seguintes comandos:

!mine
!mine status
!mine start
!mine stop`
      );
    }
  });
});
