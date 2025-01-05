import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../Interfaces/index.ts";

export const command = new Command({
  category: "utility",
  usage: "",
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get help on how to use the bot"),
  run: async (client, interaction) => {
    const fetchedCommands = await client.application?.commands.fetch();

    const grouped = Object.entries(
      client.commands
        .sort((a, b) => a.data.name.localeCompare(b.data.name))
        .reduce<Record<string, Command[]>>((acc, obj) => {
          if (!acc[obj.category]) {
            acc[obj.category] = [];
          }
          acc[obj.category].push(obj);
          return acc;
        }, {}),
    ).sort((a, b) => a[0].localeCompare(b[0]));

    interaction.sendEmbed({
      title: "Help",
      fields: grouped.map(([category, commands]) => ({
        inline: false,
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: commands
          .map((command) => {
            return `- </${command.data.name}:${fetchedCommands?.find((c) => c.name == command.data.name)?.id}> \`${
              command.data.options
                .map((option) => {
                  return option.toJSON().required
                    ? `<${option.toJSON().name}>`
                    : `[${option.toJSON().name}]`;
                })
                .join(" - ") || "No options"
            }\``;
          })
          .join("\n"),
      })),
    });
  },
});
