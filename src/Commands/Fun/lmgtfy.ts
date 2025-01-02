import { SlashCommandBuilder } from "npm:discord.js";
import { Command } from "../../Interfaces/index.ts";

export const command = new Command({
  category: "fun",
  usage: "[category]",
  data: new SlashCommandBuilder()
    .setName("lmgtfy")
    .setDescription("Let me google that for you")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("The query to search for")
        .setRequired(true),
    )
    .addBooleanOption((option) =>
      option
        .setName("internet")
        .setDescription("Add internet explainer")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("engine")
        .setDescription("The search engine to use")
        .setChoices([
          { name: "Google", value: "g" },
          { name: "Bing", value: "b" },
          { name: "DuckDuckGo", value: "d" },
          { name: "Yahoo", value: "y" },
          { name: "Ask", value: "k" },
          { name: "AOL", value: "a" },
          { name: "ChatGPT", value: "c" },
        ]),
    ),
  run: async (_client, interaction) => {
    const query = interaction.options.get("query")?.value as string;
	const engine = (interaction.options.get("engine")?.value as string) || "g";
    const link = `https://lmgtfy2.com/?q=${encodeURIComponent(query)}&iie=${interaction.options.get("internet")?.value ? 1 : 0}&s=${engine}`;

	const longEngine = {
	  g: "Google",
	  b: "Bing",
	  d: "DuckDuckGo",
	  y: "Yahoo",
	  k: "Ask",
	  a: "AOL",
	  c: "ChatGPT",
	}[engine];

    await interaction.sendEmbed({
      title: `Let me ${longEngine} that for you`,
      description: `I'll help you use the internet. Click [here](<${link}>).`,
    });
  },
});
