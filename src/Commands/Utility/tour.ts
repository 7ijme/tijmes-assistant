import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../Interfaces";

export const command = new Command({
  category: "utility",
  usage: "<code> [players]",
  data: new SlashCommandBuilder()
    .setName("tour")
    .setDescription("Generate a TOUR ad message")
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("The category of the cat image")
        .setRequired(true),
    )
    .addNumberOption((option) =>
      option.setName("players").setDescription("The number of players"),
    )
    .addStringOption((option) =>
      option
        .setName("region")
        .setDescription("The region of the lobby")
        .setChoices(
          { name: "MNA", value: "MNA" },
          { name: "MEU", value: "MEU" },
          { name: "MAS", value: "MAS" },
          { name: "NA", value: "NA" },
          { name: "EU", value: "EU" },
          { name: "ASIA", value: "ASIA" },
        ),
    )
    .addStringOption((option) =>
      option.setName("map").setDescription("The map of the lobby"),
    )
    .addRoleOption((option) =>
      option.setName("role").setDescription("The role to ping"),
    ),
  run: async (client, interaction) => {
    const code = interaction.options.get("code").value as string;
    const players = (interaction.options.get("players")?.value as number) || 1;
    const region =
      (interaction.options.get("region")?.value as string) || "MNA";
    const map = (interaction.options.get("map")?.value as string) || "Polus";
		const role = interaction.options.get("role")?.value as string;

    const minBtn = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setLabel("-1")
      .setCustomId(`tourmin-${interaction.user.id}`);
    const plusBtn = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setLabel("+1")
      .setCustomId(`tourplus-${interaction.user.id}`);
    const toggleIngameBtn = new ButtonBuilder()
      .setStyle(ButtonStyle.Success)
      .setLabel("Toggle Ingame")
      .setCustomId(`touringame-${interaction.user.id}`);
    const closeBtn = new ButtonBuilder()
      .setStyle(ButtonStyle.Danger)
      .setLabel("Close")
      .setCustomId(`tourclose-${interaction.user.id}`);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      minBtn,
      plusBtn,
      toggleIngameBtn,
      closeBtn,
    );

    interaction.reply({
      content: `\
> # Join Tijme's Lobby\n\
> * Code: **${code.toUpperCase()}**\n\
> * Map${["&", ","].some((c) => map.includes(c)) ? "s" : ""}: **${map}**\n\
> * Region: **${region}**\n\
> * Voice: **[BCL](https://github.com/OhMyGuus/BetterCrewLink/releases)**\n\
> * Players: **${players}**\n\
> * Status: **Open**\n\
> * *Last updated: • <t:${Math.floor(Date.now() / 1000)}:R>*\n\
${role ? `<@&${role}>` : ""}`,
      components: [row],
    });
  },
});
