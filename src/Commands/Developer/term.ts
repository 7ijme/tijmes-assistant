import { Command } from "../../Interfaces";
import { inspect } from "util";
import { EmbedBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { exec } from "child_process";

export const command = new Command({
  category: "developer",
  usage: "<code>",
  data: new SlashCommandBuilder()
    .setName("term")
    .setDescription("Execute shell command")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command you want to run")
        .setRequired(true),
    )
    .addBooleanOption((option) =>
      option.setName("silent").setDescription("Silently execute"),
    ),
  run: async (client, interaction) => {
    let code = (interaction.options.get("command").value as string)
      .replace(/^((\`\`\`){1}(sh|bash)?)\n?/gi, "")
      .replace(/\n?(\`\`\`)$/gi, "");
    if (code.trim() === "") return;

    console.log(code);

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
      exec(code, async (error, stdout, stderr) => {
        const hasError = !!error;
        const result = stdout || error.message || stderr || "No output";

        const embed = new EmbedBuilder()
          .setTitle("Term")
          .setDescription(
            `**Input**\n\`\`\`sh\n${code}\`\`\`\n**Output**\`\`\`sh\n${result}\`\`\``,
          )
          .setColor(hasError ? 0xff0000 : 0x00ff00)
          .setTimestamp();

        interaction.editReply({
          embeds: [embed],
          components: silent ? [] : [actionRow],
        });
      });

      console.log("then", result);
    } catch (e) {
      const embed = new EmbedBuilder()
        .setTitle("Term")
        .setDescription(
          `**Input**\n\`\`\`sh\n${code}\`\`\`\n**Output**\`\`\`sh\n${result}\`\`\``,
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
