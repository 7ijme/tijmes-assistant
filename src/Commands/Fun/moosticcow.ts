import { exec, execSync } from "node:child_process";
import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../Interfaces/index.ts";

export const command = new Command({
  category: "fun",
  usage: "",
  data: new SlashCommandBuilder()
    .setName("moosticcow")
    .setDescription("Get a some fortune from the moostic cow!"),

  run: async (client, interaction) => {
    const message = exec("fortune | cowsay", { encoding: "utf-8" });

    await interaction.sendEmbed({
      title: `Moostic Cow`,
      description: `\`\`\`${message}\`\`\``,
    });
  },
});
