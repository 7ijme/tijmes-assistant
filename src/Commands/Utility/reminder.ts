import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../Interfaces/index.ts";
import axios from "axios";

export const command = new Command({
  category: "utility",
  usage: "<reminder>",
  data: new SlashCommandBuilder()
    .setName("reminder")
    .setDescription("Set a reminder for yourself")
    .addStringOption((option) =>
      option
        .setName("reminder")
        .setDescription("What to remind you about")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription("How long to wait before reminding you")
        .setRequired(false),
    ),
  run: (_, interaction) => {
    const reminder = interaction.options.get("reminder")?.value as string;
    const time = (interaction.options.get("time")?.value as string) || "1 hour";
    interaction.sendEmbed({
      title: "Reminder",
      description: `I will remind you about \`${reminder}\` in ${time}`,
    });

	const ntfyURL = Deno.env.get("NTFY_REMINDER");
    if (!ntfyURL)
      return interaction.sendEmbed({
        description:
          "The bot owner has not set the NTFY_REMINDER environment variable.",
      });

    axios.post(ntfyURL, reminder, {
      headers: {
        Title: "Reminder",
        At: time,
      },
    });
  },
});
