import { execSync } from "child_process";
import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../Interfaces";

export const command = new Command({
  category: "fun",
  usage: "",
  data: new SlashCommandBuilder()
    .setName("moosticcow")
    .setDescription("Get a some fortune from the moostic cow!"),

  run: async (client, interaction) => {
    const message = execSync("fortune | cowsay", { encoding: "utf-8" });

    await interaction.sendEmbed({
      title: `Moostic Cow`,
      description: `\`\`\`${message}\`\`\``,
    });
  },
});
