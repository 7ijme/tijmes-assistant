import {
  ApplicationCommandType,
  ChatInputCommandInteraction,
  Client,
  CommandInteraction,
  GatewayInteractionCreateDispatchData,
  MessageContextMenuCommandInteraction,
  SnowflakeUtil,
  UserContextMenuCommandInteraction,
} from "npm:discord.js";
import { Event } from "../Interfaces/index.ts";

export const event: Event = new Event({
  name: "clientReady",
  run: async (client) => {
    console.log(`Logged in as ${client.user?.username}!`);

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
            constructor(
              client: Client<true>,
              data: GatewayInteractionCreateDispatchData,
            ) {
              super(client, data);
              this.replied = true;
            }
          }

          const interaction = new Interaction(client as Client<true>, data);

          if (
            SnowflakeUtil.deconstruct(interaction.id).timestamp -
              BigInt(+new Date()) >
            -(15 * 60 * 1000)
          ) {
            // interaction too old to edit
            await interaction.sendEmbed(
              {
                title: "Restart",
                description: "The bot has succesfully restarted",
              },
              true,
            );
          }
        }
      }
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        console.error(err);
      }
    }
  },
});
