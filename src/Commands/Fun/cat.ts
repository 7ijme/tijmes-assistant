import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../Interfaces";
import { Category, TheCatAPI } from "@thatapicompany/thecatapi";
import dotenv from "dotenv";

export const command = new Command({
  category: "fun",
  usage: "[category]",
  data: new SlashCommandBuilder()
    .setName("cat")
    .setDescription("Get a random cat image")
    .addNumberOption((option) =>
      option
        .setName("category")
        .setDescription("The category of the cat image")
        .setChoices(
          { name: "Hats", value: Category.HATS.valueOf() },
          { name: "Space", value: Category.SPACE.valueOf() },
          {
            name: "Sunglasses",
            value: Category.SUNGLASSES.valueOf(),
          },
          { name: "Boxes", value: Category.BOXES.valueOf() },
          { name: "Ties", value: Category.TIES.valueOf() },
          { name: "Sinks", value: Category.SINKS.valueOf() },
          { name: "Clothes", value: Category.CLOTHES.valueOf() }
        )
        .setRequired(false)
    ),
  // HATS = 1,
  // SPACE = 2,
  // SUNGLASSES = 4,
  // BOXES = 5,
  // TIES = 7,
  // SINKS = 14,
  // CLOTHES = 15

  run: async (client, interaction) => {
    dotenv.config();
    const theCatAPI = new TheCatAPI(process.env.CAT_API);

    const category =
      (interaction.options.get("category")?.value as number) ||
      [
        Category.HATS,
        Category.SPACE,
        Category.SUNGLASSES,
        Category.BOXES,
        Category.TIES,
        Category.SINKS,
        Category.CLOTHES,
      ][Math.floor(Math.random() * 7)];

    const image = await theCatAPI.images.getRandomImage({
      categories: category ? [category] : undefined,
    });

    await interaction.sendEmbed({
      title: `Cat ${category ? `(${Category[category].toLowerCase()})` : ""}`,
      description: "Enjoy this image of a cat, sir.",
      image: { url: image.url },
    });
  },
});
