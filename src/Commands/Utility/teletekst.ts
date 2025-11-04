import {
  ActionRowBuilder,
  AnySelectMenuInteraction,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  MessageFlags,
  ModalSubmitInteraction,
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
import { decode } from "npm:html-entities";
import { argv0 } from "node:process";

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
    )
    .addBooleanOption((option) =>
      option
        .setName("silent")
        .setDescription("Whether the bot should respond silently")
        .setRequired(false),
    ),
  run: async (_, interaction) => {
    const page = (interaction.options.get("page")?.value as number) ?? 100;
    const { text, pageData, error } = await scrapeTeletext(page, 1);

    // Create buttons for next and previous page

    const converter = new HTMLToANSIConverter();

    const { output, links } = converter.convert(
      decode(convertTeletextToBraille(text)),
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setDescription("```ansi\n" + output + "\n```"),
      ],
      components: getTeletekstButtons(
        error ? 100 : page,
        1,
        pageData,
        links,
        interaction.user.id,
      ),
      flags:
        (interaction.options.get("silent")?.value ?? (false as boolean))
          ? [MessageFlags.Ephemeral]
          : [],
    });

    if (error) {
      interaction.followUp({
        content: `Page ${page} not found, showing page 100 instead.`,
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
});

export function convertTeletextToBraille(input: string): string {
  // Map of Teletekst mosaic codes (0xF020–0xF07F) to Braille patterns (0x2800+)
  const BRAILLE_MAP: number[] = [
    0x2800, 0x2844, 0x28a0, 0x28e4, 0x28a4, 0x28e0, 0x28e8, 0x28a8, 0x2840,
    0x28c0, 0x28c4, 0x28c8, 0x28cc, 0x28d0, 0x28d4, 0x28d8, 0x28dc, 0x2841,
    0x2845, 0x2849, 0x284d, 0x2851, 0x2855, 0x2859, 0x285d, 0x2861, 0x2865,
    0x2869, 0x286d, 0x2871, 0x2875, 0x2879, 0x287d, 0x2881, 0x2885, 0x2889,
    0x288d, 0x2891, 0x2895, 0x2899, 0x289d, 0x28a1, 0x28a5, 0x28a9, 0x28ad,
    0x28b1, 0x28b5, 0x28b9, 0x28bd, 0x28c1, 0x28c5, 0x28c9, 0x28cd, 0x28d1,
    0x28d5, 0x28d9, 0x28dd, 0x28e1, 0x28e5, 0x28e9, 0x28ed, 0x28f1, 0x28f5,
    0x28f9, 0x28fd, 0x2850, 0x2854, 0x2858, 0x285c, 0x2860, 0x2864, 0x2868,
    0x286c, 0x2870, 0x2874, 0x2878, 0x287c, 0x2880, 0x2884, 0x2888, 0x288c,
    0x2890, 0x2894, 0x2898, 0x289c, 0x28a0, 0x28a4, 0x28a8, 0x28ac, 0x28b0,
    0x28b4, 0x28b8, 0x28bc, 0x28c0, 0x28c4, 0x28c8,
  ];

  return input.replace(/&#x(f0[2-7][0-9a-f]);/gi, (_, hex) => {
    const code = parseInt(hex, 16);
    if (code >= 0xf020 && code <= 0xf07f) {
      const braille = BRAILLE_MAP[code - 0xf020];
      return String.fromCharCode(braille);
    }
    return _;
  });
}

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
type TeleLink = { page: string; description: string };
export class HTMLToANSIConverter {
  private ansiMap: ColorMap & { [key: string]: string };
  private resetCode = "\u001b[0m";

  constructor() {
    // Start with the color map and add any additional styles
    this.ansiMap = {
      ...colorMap,
      // You can add non-color styles here if needed
      // bold: "\x1b[1m",
      // underline: "\x1b[4m",
    };
  }
  convert(html: string): { output: string; links: TeleLink[] } {
    const stack: string[] = [];
    let output = "";
    let i = 0;
    const links: TeleLink[] = [];

    while (i < html.length) {
      if (html[i] === "<" && html[i + 1] !== "/") {
        // Opening span tag
        const tagEnd = html.indexOf(">", i);
        if (tagEnd === -1) break;

        const tagContent = html.substring(i + 1, tagEnd);

        if (tagContent.startsWith("span") || tagContent.startsWith("a")) {
          const classes = this.extractClasses(tagContent);
          const ansiCodes = this.classesToANSI(classes);

          if (tagContent.startsWith("a")) {
            const hrefMatch = tagContent.match(/href="([^"]*)"/);
            if (hrefMatch) {
              let description = html
                .substring(html.substring(0, i).lastIndexOf(">") + 1, i)
                .trim();

              if (description.length === 0) {
                // look one tag further back
                const prevTagEnd = html
                  .substring(0, html.substring(0, i).lastIndexOf(">"))
                  .lastIndexOf(">");
                description = html
                  .substring(
                    html.substring(0, prevTagEnd - 1).lastIndexOf(">") + 1,
                    html.substring(0, prevTagEnd - 1).lastIndexOf("<"),
                  )
                  .trim();
                console.log("Found empty description, using:", description);
              }

              links.push({
                page: hrefMatch[1].replace(/^#/, ""),
                description: description.length > 1 ? description : "",
              });
            }
          }

          stack.push(ansiCodes);
          output += ansiCodes;
        }

        i = tagEnd + 1;
      } else if (html[i] === "<" && html[i + 1] === "/") {
        // Closing span tag
        const tagEnd = html.indexOf(">", i);
        if (tagEnd === -1) break;

        if (stack.length > 0) {
          output += this.resetCode;
          stack.pop();
          // Reapply previous styles from stack
          if (stack.length > 0) {
            output += stack[stack.length - 1];
          }
        }
        i = tagEnd + 1;
      } else {
        // Text content
        const textEnd = html.indexOf("<", i);
        if (textEnd === -1) {
          output += html.substring(i);
          break;
        }
        output += html.substring(i, textEnd);
        i = textEnd;
      }
    }

    // Ensure we reset at the end if there are any remaining styles
    if (stack.length > 0) {
      output += this.resetCode;
    }

    return { output, links };
  }

  private extractClasses(tagContent: string): string[] {
    const classMatch = tagContent.match(/class="([^"]*)"/);
    return classMatch
      ? classMatch[1].split(" ").filter((cls: string) => cls.trim())
      : [];
  }

  private classesToANSI(classes: string[]): string {
    return classes
      .map((cls) => this.ansiMap[cls as Color])
      .filter(Boolean)
      .join("");
  }
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
  links: TeleLink[],
  userId: string,
) {
  const firstRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tt-${data.prevPage}-1-${userId}`)
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
      .setCustomId(`tt-${data.nextPage}-1-${userId}`)
      .setEmoji("⏩")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(data.nextPage == ""),
    new ButtonBuilder()
      .setCustomId(`tt-choose-1-${userId}`)
      .setLabel("Choose")
      .setStyle(ButtonStyle.Secondary),
  ) as ActionRowBuilder<ButtonBuilder>;

  console.log(links);
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
        ...links

          .filter(
            (link) =>
              !data.fastTextLinks.some((ftl) => ftl.page === link.page) &&
              page != parseInt(link.page) &&
              link.description.length > 1,
          )
          .reduce((acc, link) => {
            if (!acc.some((l) => l.page == link.page)) acc.push(link);
            return acc;
          }, [] as TeleLink[])
          .map((link, _) =>
            // remove # at start of link
            new StringSelectMenuOptionBuilder()
              .setLabel(link.page)
              .setValue(link.page)
              .setDescription(
                link.description.length > 50
                  ? link.description.slice(0, 47) + "..."
                  : link.description,
              ),
          ),
      ),
  );

  return [firstRow, secondRow] as ActionRowBuilder<
    ButtonBuilder | SelectMenuBuilder
  >[];
}

export async function updateTeletekstPage(
  page: number,
  subPage: number,
  interaction:
    | ButtonInteraction
    | ModalSubmitInteraction
    | AnySelectMenuInteraction,
) {
  const { text, pageData, error } = await scrapeTeletext(page, subPage);

  if (error) {
    interaction.reply({
      content: `Page ${page} not found. `,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const converter = new HTMLToANSIConverter();

  const { output, links } = converter.convert(
    decode(convertTeletextToBraille(text)),
  );

  const newEmbed = new EmbedBuilder().setDescription(
    "```ansi\n" + output + "\n```",
  );

  const userId = interaction.customId?.split("-").pop() ?? interaction.user.id;

  (interaction as ButtonInteraction).update({
    embeds: [newEmbed],
    components: getTeletekstButtons(
      error ? 100 : page,
      error ? 1 : subPage,
      pageData,
      links,
      userId,
    ),
  });
}
