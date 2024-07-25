import { ActivityType, Client, Collection } from "discord.js";
import { Command, Config, Event } from "../Interfaces";
import ConfigJson from "../config.json";
import dotenv from "dotenv";
import { readdirSync } from "fs";
import path from "path";

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
    /* Commands */
    const commandPath = path.join(__dirname, "..", "Commands");
    for (const dir of readdirSync(commandPath)) {
      const commands = readdirSync(`${commandPath}/${dir}`).some((file) =>
        file.endsWith(".js"),
      )
        ? readdirSync(`${commandPath}/${dir}`).filter((file) =>
            file.endsWith(".js"),
          )
        : readdirSync(`${commandPath}/${dir}`).filter((file) =>
            file.endsWith(".ts"),
          );

      for (const file of commands) {
        const command: Command = (await import(`${commandPath}/${dir}/${file}`))
          ?.command;
        if (!command) continue;
        command.init(this);
      }
    }

    /* Events */
    const eventPath = path.join(__dirname, "..", "Events");
    const events = readdirSync(eventPath).some((file) => file.endsWith(".js"))
      ? readdirSync(eventPath).filter((file) => file.endsWith(".js"))
      : readdirSync(eventPath).filter((file) => file.endsWith(".ts"));

    for (const file of events) {
      const event: Event = (await import(`${eventPath}/${file}`))?.event;
      this.events.set(event.name, event);
      this.on(event.name, event.run.bind(null, this));
    }

		console.log("Commands and events loaded!");

    // Public commands
		dotenv.config();
    await this.login(process.env.TOKEN);
		console.log("Bot is online!");

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
