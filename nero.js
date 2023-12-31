const fs = require("node:fs");
const path = require("node:path");
const { Webhook } = require("@top-gg/sdk");
const express = require("express");
const app = express();
require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const dbprofile = require("./src/databaseFunctions/dbProfile");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.cooldowns = new Collection();
client.commands = new Collection();
const foldersPath = path.join(__dirname, "src/commands");
const commandFolders = fs.readdirSync(foldersPath);

const wh = new Webhook(process.env.AUTH);

app.post(
  "/dblwebhook",
  wh.listener((vote) => {
    console.log(vote.user);
    dbprofile.addVoteRoll(vote.user, vote.isWeekend);

    console.log(`${vote.user} has voted!`);
  })
);

const { AutoPoster } = require("topgg-autoposter");

AutoPoster(process.env.TOPGGTOKEN, client).on("posted", () => {
  console.log("Posted stats to Top.gg!");
});

app.listen(3000);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const eventsPath = path.join(__dirname, "src/events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(process.env.DISCORD_TOKEN);
