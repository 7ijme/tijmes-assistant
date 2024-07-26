import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../Interfaces";
import axios from "axios";
import dotenv from "dotenv";

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
  run: async (_, interaction) => {
    const reminder = interaction.options.get("reminder");
    const time = (interaction.options.get("time")?.value as string) || "1 hour";
    interaction.sendEmbed({
      title: "Reminder",
      description: `I will remind you about \`${reminder.value}\` in ${time}`,
    });


    dotenv.config()
    axios.post(process.env.NTFY_REMINDER, reminder.value, {
      headers: {
        Title: "Reminder",
        At: time,
      },
    });
  },
});
