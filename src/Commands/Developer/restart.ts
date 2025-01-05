import { Command } from "../../Interfaces/index.ts";
import { SlashCommandBuilder } from "npm:@discordjs/builders";

export const command = new Command({
  category: "developer",
  usage: "",
  data: new SlashCommandBuilder()
    .setName("restart")
    .setDescription("Restart the bot"),
  run: async (client, interaction) => {
    await interaction.sendEmbed({
      title: "Restart",
      description: "The bot is restarting...",
      color: 0xffff00,
    });

    Deno.exit();
  },
});
