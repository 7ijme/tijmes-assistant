import { Command } from "../../Interfaces";
import { inspect } from "util";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const command = new Command({
  category: "developer",
  usage: "<code>",
  data: new SlashCommandBuilder()
    .setName("eval")
    .setDescription("Evaluate code")
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("The code you want to run")
        .setRequired(true),
    )
    .addBooleanOption((option) =>
      option.setName("silent").setDescription("Silently execute"),
    ),
  run: async (client, interaction) => {
    if (!interaction.isCommand()) return;

    if (!interaction.options.get("code")?.value) return;

		let color;
    let code = (interaction.options.get("code").value as string)
      .replace(/^((\`\`\`){1}(js|javascript)?)\n?/gi, "")
      .replace(/\n?(\`\`\`)$/gi, "");

    const silent = !!interaction.options.get("silent")?.value;

    if (code.trim() === "") return;

    const results = [];

    const button = new ButtonBuilder()
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger)
      .setCustomId(`DELETE-${interaction.user.id}`);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
      button,
    );

    try {
      if (code.includes("await")) {
        results.push(
          await eval(`(async () => {
                    ${code.replace("console.log", "results.push")}
                })()`),
        );
      } else {
        results.push(eval(code.replace("console.log", "results.push")));
      }

      await interaction.sendEmbed({
        title: "Eval",
        description: `**Input**\n\`\`\`js\n${code}\`\`\`\n**Output**\`\`\`js\n${results
          .map((e) => `${inspect(e, { compact: false, depth: 2 })}`)
          .join("\n")}\`\`\``,
        components: silent ? [] : [actionRow],
        client,
				color,
        ephemeral: silent,
      });
    } catch (e) {
      await interaction.sendEmbed({
        client,
        title: "Eval",
        description: `An error occured: \`\`\`js\n${e.name}: ${
          e.message
        }\nLine: ${
          e.stack.match(/<anonymous>:\d:\d/)?.[0].match(/\d:\d/)?.[0]
        }\`\`\``,
        color: 0xff0000,
        components: silent ? [] : [actionRow],
        ephemeral: silent,
      });
    }
  },
});
