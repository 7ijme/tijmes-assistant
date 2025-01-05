import { ActivityType, Client, Collection, REST, Routes, ApplicationCommandType, ChatInputCommandInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction, GatewayInteractionCreateDispatchData, SnowflakeUtil, CommandInteraction } from "npm:discord.js";
import { Command, Config, Event } from "../Interfaces/index.ts";
import ConfigJson from "../config.json" with { type: "json" };
import path from "node:path";
import "jsr:@std/dotenv/load";

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

    const token = Deno.env.get("TOKEN");
    if (!token) throw new Error("No token provided");

    const clientId = Deno.env.get("CLIENT_ID");
    if (!clientId) throw new Error("No client ID provided");

    try {
      const rest = new REST({ version: "10" }).setToken(token);
      await rest.put(Routes.applicationCommands(clientId), {
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

    /* Proxy InteractionCreate handler */
    if (Object.getOwnPropertyDescriptor(this, 'actions')?.value.InteractionCreate !== undefined) {
      const b = Object.getOwnPropertyDescriptor(this, 'actions')?.value.InteractionCreate;
      const ohandle = b.handle;
      const a = new Proxy(ohandle, {
        apply(target, thisArg, argArray) {
          if (argArray[0].data.name == "restart") {
            Deno.writeTextFileSync("/tmp/tijmes-assistant.json", JSON.stringify(argArray));
          }

          return Reflect.apply(target, thisArg, argArray);
        }
      });
      b.handle = a;
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

    // Edit restart embed
    try {
      await Deno.lstat("/tmp/tijmes-assistant.json");
      const data_j = Deno.readTextFileSync("/tmp/tijmes-assistant.json");
      Deno.removeSync("/tmp/tijmes-assistant.json");

      let InteractionClass;
      if (data_j) {
        const data = JSON.parse(data_j)[0];

        switch (data.data.type) {
          case ApplicationCommandType.ChatInput:
            InteractionClass = ChatInputCommandInteraction;
            break;
          case ApplicationCommandType.User:
            InteractionClass = UserContextMenuCommandInteraction;
            break;
          case ApplicationCommandType.Message:
            InteractionClass = MessageContextMenuCommandInteraction;
            break;
          default:
            throw new Error("Invalid interaction");
        }

        if (InteractionClass !== undefined) {
          class Interaction extends CommandInteraction {
            constructor(client: Client<true>, data: GatewayInteractionCreateDispatchData) {
              super(client, data);
              this.replied = true;
            }
          }

          const interaction = new Interaction(this as Client<true>, data);

          if (SnowflakeUtil.deconstruct(interaction.id).timestamp - BigInt(+new Date()) > -(15 * 1000)) { // interaction too old to edit
            await interaction.sendEmbed({
              title: "Restarted!",
              description: "The bot has succesfully restarted.",
              ephemeral: true,
            }, true);
          }
        }
      }
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        console.error(err);
      }
    }


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
