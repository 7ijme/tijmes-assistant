import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../Interfaces/index.ts";
import axios from "axios";
import * as cheerio from "npm:cheerio";
import { ButtonInteraction } from "discord.js";

export const command = new Command({
  category: "utility",
  usage: "[page]",
  data: new SlashCommandBuilder()
    .setName("teletekst")
    .setDescription("Get news from Teletekst")
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("The page number to fetch")
        .setMinValue(100)
        .setMaxValue(899)
        .setRequired(false),
    ),
  run: async (_, interaction) => {
    const page = (interaction.options.get("page")?.value as number) ?? 100;
    const text = await scrapeTeletext(page);

    // Create buttons for next and previous page

    interaction.sendEmbed({
      description:
        // "```" +
        // (text.length > 4096 - 6 ? text.slice(0, 4093 - 6) + "..." : text) +
        // "```",
        toAnsi(text),
      components: [getTeletekstButtons(page, interaction.user.id)],
    });
  },
});
export async function scrapeTeletext(pageNumber: number) {
  const url = `https://teletekst-data.nos.nl/webtekst?p=${pageNumber}`;

  const response = await axios.get(url, {
    headers: { "User-Agent": "TeletextScraper/1.0" },
  });

  const html = response.data;
  const $ = cheerio.load(html);

  // De teleteksttekst staat in <pre>
  const content = $("pre").text();

  return content.trim();
}

// helper → find nearest ANSI color
export function toAnsi(text: string) {
  type ColorMap = {
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    reset: string;
  };
  const colorMap: ColorMap = {
    black: "\u001b[30m", // black
    red: "\u001b[31m", // red
    green: "\u001b[32m", // green
    yellow: "\u001b[33m", // yellow
    blue: "\u001b[34m", // blue
    magenta: "\u001b[35m", // magenta
    cyan: "\u001b[36m", // cyan
    white: "\u001b[37m", // white
    reset: "\u001b[0m",
  };

  const colors = [
    colorMap["red"],
    colorMap["green"],
    colorMap["yellow"],
    colorMap["blue"],
  ];
  let splitText = text.split("\n");
  const lastLine = splitText.pop() || "";
  const regex = /\w+\s?\w+/g;
  const matches = lastLine?.matchAll(regex).toArray() || [];

  let modified = "";
  let lastIndex = 0;

  for (const match of matches) {
    const index = match.index;
    const word = match[0];

    // Append everything before this match + the inserted text + the match itself
    modified +=
      lastLine.slice(lastIndex, index) + colors[matches.indexOf(match)] + word;

    // Update for next iteration
    lastIndex = index + word.length;
  }

  splitText.push(modified || "");

  splitText = splitText.map((line, i) => {
    if (i == 0) return colorMap["yellow"] + line + colorMap["reset"];

    return line;
  });

  return "```ansi\n" + splitText.join("\n") + "```";
}

export function getTeletekstButtons(page: number, userId: string) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tt-${page - 1}-${userId}`)
      .setLabel("Previous")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page <= 100),
    new ButtonBuilder()
      .setCustomId(`tt-${page + 1}-${userId}`)
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page >= 899),
  ) as ActionRowBuilder<ButtonBuilder>;
  if (page !== 100 && page !== 101)
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`tt-100-${userId}`)
        .setEmoji("🏠")
        .setStyle(ButtonStyle.Secondary),
    );
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`tt-choose-${userId}`)
      .setLabel("Choose")
      .setStyle(ButtonStyle.Secondary),
  );
  return row;
}
