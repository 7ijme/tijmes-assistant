import { ActivityType, Client, Collection, REST, Routes } from "npm:discord.js";
import { Command, Config, Event } from "../Interfaces/index.ts";
import ConfigJson from "../config.json" with { type: "json" };
import path from "node:path";
import dotenv from "npm:dotenv";

export default class ExtendedClient extends Client {
  public commands: Collection<string, Command> = new Collection();
  public events: Collection<string, Event> = new Collection();
  public config: Config = ConfigJson;

  constructor() {
    super({
      intents: [],
    });
  }

  public async init() {
    console.log("Bot is starting...");

    console.log("Loading commands and events...");
    dotenv.config();
    /* Commands */
    const dirname = import.meta.dirname || ".";
    const commandPath = path.join(dirname, "..", "Commands");
    for (const dir of Deno.readDirSync(commandPath)) {
      const commands = Deno.readDirSync(`${commandPath}/${dir.name}`);
      for (const file of commands) {
        console.log(file.name);
        if (!file.name.endsWith(".ts")) continue;
        const command: Command = (
          await import(`${commandPath}/${dir.name}/${file.name}`)
        )?.command;
        if (!command) continue;
        command.init(this);
      }
    }

    const token = process.env.TOKEN as string;

    try {
      const rest = new REST({ version: "10" }).setToken(token);
      await rest.put(Routes.applicationCommands(ConfigJson.clientID), {
        body: this.commands.map((v) => {
          const commandBuilder = v.data.toJSON();
          commandBuilder.integration_types = [1];
          commandBuilder.contexts = [0, 1, 2];
          return commandBuilder;
        }),
      });
    } catch (e) {
      console.error(JSON.stringify(e));
    }

    /* Events */
    const eventPath = path.join(dirname, "..", "Events");
    const events = Deno.readDirSync(eventPath);

    for (const file of events) {
      if (!file.name.endsWith(".ts")) continue;
      console.log(file.name);
      const event: Event = (await import(`${eventPath}/${file.name}`))?.event;
      this.events.set(event.name, event);
      this.on(event.name, event.run.bind(null, this));
    }

    console.log("Commands and events loaded!");

    // Public commands
    await this.login(token);
    console.log("Bot is online!");

    if (!this.user) return;
    this.user.setPresence({
      status: "online",
      activities: [
        {
          name: `to my master's commands`,
          type: ActivityType.Listening,
        },
      ],
    });
  }
}
