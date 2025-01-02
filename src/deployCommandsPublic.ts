// add integration_types to type CommandData
declare module "discord.js" {
  interface RESTPostAPIChatInputApplicationCommandsJSONBody {
    integration_types: number[];
    contexts: number[];
  }
}
import { REST } from "discord.js";
import { readdirSync } from "node:fs";
import path from "node:path";
import { API, RESTPutAPIApplicationCommandsJSONBody } from "discord.js";
import { Command } from "./Interfaces/index.ts";
import dotenv from "dotenv";
import { CommandData } from "./Interfaces/Command.ts";

export async function main() {
  dotenv.config();
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN!);

  /* Commands */
  const commands: CommandData[] = [];
  const commandPath = path.join(__dirname, ".", "Commands");
  for (const dir of readdirSync(commandPath)) {
    const commandFiles = readdirSync(`${commandPath}/${dir}`).some((file) =>
      file.endsWith(".js"),
    )
      ? readdirSync(`${commandPath}/${dir}`).filter((file) =>
          file.endsWith(".js"),
        )
      : readdirSync(`${commandPath}/${dir}`).filter((file) =>
          file.endsWith(".ts"),
        );

    for (const file of commandFiles) {
      const command: Command = (await import(`${commandPath}/${dir}/${file}`))
        ?.command;
      if (!command) continue;
      commands.push(command.data);
    }
  }

  const commandsData = commands.map((command) => command.toJSON());
  // remove typescript check
  commandsData.forEach((command) => {
    command.integration_types = [1];
    command.contexts = [0, 1, 2];
  });

  console.log(commandsData);

  const api = new API(rest);
  const result = await api.applicationCommands.bulkOverwriteGlobalCommands(
    clientID,
    commandsData as RESTPutAPIApplicationCommandsJSONBody,
  );

  console.log(`Successfully registered application commands. ${result.length}`);
}
main();
