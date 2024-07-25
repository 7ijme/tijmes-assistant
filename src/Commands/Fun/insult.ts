import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../Interfaces";

export const command = new Command({
  category: "fun",
  usage: "",
  data: new SlashCommandBuilder()
    .setName("insult")
    .setDescription("Insult someone!")
    .addStringOption((option) =>
      option.setName("who").setDescription("Who to insult?").setRequired(false),
    ),

  run: async (client, interaction) => {
    const who = interaction.options.get("who")?.value as string;

    const insult = await (await fetch(
      `https://insult.mattbas.org/api/insult${who ? `?who=${who}` : ""}`,
    )).text();

    await interaction.sendEmbed({
      title: `Insult`,
      description: insult,
    });
  },
});
