const discord = require("discord.js");
const { google } = require("googleapis");
const McStatus = require("mcstatus");

const mineServerConfig = {
  host: "34.73.7.104",
  port: 25565,
};

const client = new discord.Client();

client.once("ready", () => {
  console.log("Ready!");
});

client.login("NzcwOTY3NDg2MDYwNjkxNDU3.X5lRbA.Hq4Ovm8GwTIjO-zVOJWKLXARyNI");

client.on("message", async (message) => {
  const authClient = await google.auth
    .getClient({
      keyFile: "./My Project 24258-bdee9607a5bc.json",
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
    const computeResponse = await compute.instances
      .get({
        project: "endless-sol-226009",
        auth: authClient,
        zone: "us-east1-b",
        instance: "mine-server-1",
      })
    if (computeResponse.data.status == "RUNNING") {
      await McStatus.checkStatus(mineServerConfig).then((serverResponse) => {
        message.channel.send(`Status do servidor: ${computeResponse.data.status}
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
Server IP: ${mineServerConfig.host}
Versão: ${serverResponse.version}

Para ver se o server está ativo basta enviar !mine status
            `);
    });
  }
});
