import { Command } from "../../Interfaces";
import { inspect } from "util";
import { EmbedBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { exec } from "child_process";

export const command = new Command({
  category: "developer",
  usage: "<code>",
  data: new SlashCommandBuilder()
    .setName("ruby")
    .setDescription("Execute ruby code")
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("The code you want to run")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("stdin").setDescription("The stdinput"),
    )
    .addBooleanOption((option) =>
      option.setName("silent").setDescription("Silently execute"),
    ),
  run: async (client, interaction) => {
    const code = interaction.options.get("code").value as string;
    if (code.trim() === "") return;

    const stdin = (interaction.options.get("stdin")?.value as string) || "";

    const silent = !!interaction.options.get("silent")?.value;
    let result: string = "";

    const button = new ButtonBuilder()
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger)
      .setCustomId(`DELETE-${interaction.user.id}`);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
      button,
    );

    await interaction.deferReply({ ephemeral: silent });

    try {
      exec(`echo ${stdin} | ruby -e '${code}'`, async (error, stdout, stderr) => {
        const hasError = !!error;
        const result = stdout || error.message || stderr || "No output";
        console.log(result);
        console.log(inspect({ stdout, stderr }));

        const embed = new EmbedBuilder()
          .setTitle("Ruby")
          .setDescription(
            `**Input**\n\`\`\`rb\n${code}\`\`\`\n**Output**\`\`\`rb\n${result}\`\`\``,
          )
          .setColor(hasError ? 0xff0000 : 0x00ff00)
          .setTimestamp();

        interaction.editReply({
          embeds: [embed],
          components: silent ? [] : [actionRow],
        });
      });
    } catch (e) {
      const embed = new EmbedBuilder()
        .setTitle("Ruby")
        .setDescription(
          `**Input**\n\`\`\`rb\n${code}\`\`\`\n**Output**\`\`\`rb\n${result}\`\`\``,
        )
        .setColor(0xff0000)
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
        components: silent ? [] : [actionRow],
      });
    }
  },
});
