import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../Interfaces/index.ts";
import axios from "axios";
import {
EmbedBuilder,
  SelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "npm:@discordjs/builders";

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
    const { text, pageData, error } = await scrapeTeletext(page, 1);

    // Create buttons for next and previous page

    interaction.reply({
      embeds: [new EmbedBuilder().setDescription(toAnsi(text))],
      components: getTeletekstButtons(
        error ? 100 : page,
        1,
        pageData,
        interaction.user.id,
      ),
    });
  },
});

type ScrapeResult = {
  text: string;
  pageData: PageData;
  error?: boolean;
};
export async function scrapeTeletext(
  page: number,
  subPage: number,
): Promise<ScrapeResult> {
  const url = `https://teletekst-data.nos.nl/json?p=${page}-${subPage}`;

  try {
    const response = await axios.get(url, {
      headers: { "User-Agent": "TeletextScraper/1.0" },
    });

    const data = response.data;

    const pageData: PageData = {
      prevPage: data.prevPage,
      nextPage: data.nextPage,
      prevSubPage: data.prevSubPage,
      nextSubPage: data.nextSubPage,
      fastTextLinks: data.fastTextLinks,
    };

    const text: string = data.content;
    return { text, pageData };
  } catch {
    return { ...(await scrapeTeletext(100, 1)), error: true };
  }
}

// helper → find nearest ANSI color
export function toAnsi(text: string) {
  type Color = keyof ColorMap;
  type ColorMap = {
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    magenta: string;
    cyan: string;
    white: string;
    // null: string;
    "bg-blue": string;
    "bg-white": string;
    "bg-red": string;
    "bg-black": string;
    "bg-green": string;
    "bg-yellow": string;
    "bg-magenta": string;
    "bg-cyan": string;
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
    // null: "\u001b[0m",
    "bg-blue": "\x1b[45m",
    "bg-white": "\x1b[47m",
    "bg-red": "\x1b[41m",
    "bg-black": "\x1b[40m",
    "bg-green": "\x1b[42m",
    "bg-yellow": "\x1b[43m",
    "bg-magenta": "\x1b[45m",
    "bg-cyan": "\x1b[46m",
  };
  const ansi: string = text
    // Replace each span or <a> opening tag with color
    .replace(/<(?:span|a)[^>]*class="([^"]+)"[^>]*>/g, (_, classes) => {
      const appliedColors = classes
        .split(/\s+/)
        .map((c: Color) => colorMap[c] || "")
        .join("");
      return appliedColors;
    })
    // Replace closing tags with reset
    .replace(/<\/(?:span|a)>/g, "\x1b[0m")
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities like &iuml;
    // Normalize weird unicode spacing
    .replace(/&#x.{4};/g, " ")
    .normalize("NFC");
  // Clean up whitespace
  return "```ansi\n" + ansi + "\n```";
}

type PageData = {
  prevPage: string;
  nextPage: string;
  prevSubPage: string;
  nextSubPage: string;
  fastTextLinks: {
    title: string;
    page: string;
  }[];
};

export function getTeletekstButtons(
  page: number,
  subPage: number,
  data: PageData,
  userId: string,
) {
  const firstRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tt-${page - 1}-1-${userId}`)
      .setEmoji("⏪")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(data.prevPage == ""),
    new ButtonBuilder()
      .setCustomId(`tt-${page}-${subPage - 1}-${userId}`)
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(data.prevSubPage == ""),
    new ButtonBuilder()
      .setCustomId(`tt-${page}-${subPage + 1}-${userId}`)
      .setEmoji("▶️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(data.nextSubPage == ""),
    new ButtonBuilder()
      .setCustomId(`tt-${page + 1}-1-${userId}`)
      .setEmoji("⏩")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page >= 899),
    new ButtonBuilder()
      .setCustomId(`tt-choose-1-${userId}`)
      .setLabel("Choose")
      .setStyle(ButtonStyle.Secondary),
  ) as ActionRowBuilder<ButtonBuilder>;

  const secondRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`tt-fastlinks-${userId}`)
      .setPlaceholder("Fast links")
      .addOptions(
        ...data.fastTextLinks.map((link, i) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(link.title)
            .setValue(link.page)
            .setEmoji({ name: ["🔴", "🟢", "🟡", "🔵"][i % 4] })
            .setDescription(`Go to page ${link.page}`),
        ),
      ),
  );

  return [firstRow, secondRow] as ActionRowBuilder<
    ButtonBuilder | SelectMenuBuilder
  >[];
}
