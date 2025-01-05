import { Command } from "../../Interfaces/index.ts";
import { inspect } from "node:util";
import { EmbedBuilder, SlashCommandBuilder } from "npm:@discordjs/builders";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { exec } from "node:child_process";

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
  run: async (_client, interaction) => {
    const code = (interaction.options.get("code")?.value as string)
      .trim()
      .replaceAll("\\n", "\n");
    if (code === "") return;

    const stdin =
      (interaction.options.get("stdin")?.value as string)?.replaceAll(
        "\\n",
        "\n",
      ) || "";

    const silent = !!interaction.options.get("silent")?.value;

    const button = new ButtonBuilder()
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger)
      .setCustomId(`DELETE-${interaction.user.id}`);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
      button,
    );

    await interaction.deferReply({ ephemeral: silent });
    try {
      exec(
        `echo "${stdin}" | ruby -e '${code}'`,
        async (error, stdout, stderr) => {
          const hasError = !!error;
          const result = stdout || error?.message || stderr || "No output";
          console.log(result);
          console.log(inspect({ stdout, stderr }));

          const embed = new EmbedBuilder()
            .setTitle("Ruby")
            .setDescription(
              `${stdin.length ? `**STDIN**\n\`\`\`\n${stdin}\`\`\`\n` : ""}**Input**\n\`\`\`rb\n${code}\`\`\`\n\n**Output**\`\`\`rb\n${result.trim() || "Empty, just like my heart"}\`\`\``,
            )
            .setFooter({ text: `${code.length} bytes` })
            .setColor(hasError ? 0xff0000 : 0x00ff00)
            .setTimestamp();

          await interaction.editReply({
            embeds: [embed],
            components: silent ? [] : [actionRow],
          });
        },
      );
    } catch (_e) {
      const embed = new EmbedBuilder()
        .setTitle("Ruby")
        .setDescription(
          `**Input**\n\`\`\`rb\n${code}\`\`\`\n**Output**\`\`\`rb\n${"An error occured"}\`\`\``,
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
