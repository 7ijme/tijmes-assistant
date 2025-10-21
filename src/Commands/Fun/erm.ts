import { SlashCommandBuilder } from "npm:discord.js";
import { Command } from "../../Interfaces/index.ts";
import { parse } from "jsr:@std/yaml";

type YAMLData = {
  [key: string]: string[];
};
const data = parse(
  new TextDecoder("utf-8").decode(Deno.readFileSync("./src/erm.yml")),
) as YAMLData;

export const command = new Command({
  category: "fun",
  usage: "[category]",
  data: new SlashCommandBuilder()
    .setName("erm")
    .setDescription("Erm actually...")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The type of mistake to correct")
        .setRequired(true)
        .setChoices(
          Object.keys(data).map((key) => ({ name: key, value: key })),
        ),
    )
    .addStringOption((option) =>
      option.setName("result").setDescription("The result to correct"),
    ),
  run: async (_client, interaction) => {
    const typeOption = interaction.options.get("type")?.value as string;
    const resultOption = interaction.options.get("result")?.value as
      | string
      | undefined;

    const strings = data[typeOption].map(
      (v, i, a) => (a.length - 1 == i ? "" : `Stap ${i + 1}: `) + v,
    );

    if (resultOption == undefined)
      strings.filter((v) => !v.includes("{result}"));

    const message = strings
      .map((phrase) => phrase.replace("{result}", resultOption ?? ""))
      .join("\n");

    interaction.reply(message);
  },
});
