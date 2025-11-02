import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../Interfaces/index.ts";

declare module "discord.js" {
  interface APIInteractionDataResolvedGuildMember {
    joined_at: Date;
  }
}

export const command = new Command({
  category: "utility",
  usage: "<prompt>",
  data: new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Get the avator of a user")
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("The prompt to generate an avatar for")
        .setRequired(true),
    )
    .addBooleanOption((option) =>
      option.setName("silent").setDescription("Silently execute"),
    ),
  run: async (_client, interaction) => {
    const prompt =
      interaction.options.getString("prompt") || "No prompt provided";

    const silent = !!interaction.options.get("silent");

    interaction.deferReply({ ephemeral: silent });

    try {
      const response = (
        (await (
          await fetch("https://ai.hackclub.com/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: `{
		  "messages": [{"role": "user", "content": "${prompt}"}]
		}`,
          })
        ).json()) as any
      )?.choices?.[0]?.message?.content;

      interaction.sendEmbed({
        title: "AI",
        description: `Prompt: \`${prompt}\`\n\n${response}`,
        ephemeral: silent,
        deleteButton: !silent,
      });
    } catch {
      interaction.followUp({
        content: `sadly, the site is down so i cant process your request :(`,
      });
    }
  },
});
