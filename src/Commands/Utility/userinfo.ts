import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  PermissionsBitField,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../Interfaces/index.ts";

declare module "discord.js" {
  interface APIInteractionDataResolvedGuildMember {
    joined_at: Date;
  }
}

export const command = new Command({
  category: "utility",
  usage: "[user]",
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Get information about a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to get information about")
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option.setName("silent").setDescription("Silently execute"),
    ),
  run: async (client, interaction) => {
    const user = interaction.options.get("user").user || interaction.user;

    const hasMentioned = !!interaction.options.get("user").user;
    const member = hasMentioned
      ? interaction.options.get("user").member
      : interaction.member;

    const silent = !!interaction.options.get("silent");

    const fields = [
      {
        name: "Username",
        value: user.tag,
        inline: true,
      },
      {
        name: "User ID",
        value: user.id,
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: "Created At",
        value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
        inline: true,
      },
    ];

    if (member) {
      fields.push(
        {
          name: "Joined At",
          //@ts-ignore
          value: `<t:${Math.floor(new Date(member.joined_at).getTime() / 1000)}:R>`,
          inline: true,
        },
        {
          name: "\u200B",
          value: "\u200B",
          inline: true,
        },
        {
          name: "Roles",
          value:
            (member.roles as string[])
              .map((role) => `<@&${role}>`)
              .join(", ") || "None",
          inline: false,
        },
        /*  {
          name: "Permissions",
          value: new PermissionsBitField(BigInt(member.permissions as string))
            .toArray()
            .join(", "),
          inline: true,
        }, */
      );
    }

    const button = new ButtonBuilder()
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger)
      .setCustomId(`DELETE-${interaction.user.id}`);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
      button,
    );

    interaction.sendEmbed({
      title: user.globalName,
      fields,
      thumbnail: {
        url: user.displayAvatarURL(),
      },
      ephemeral: silent,
      components: silent ? [] : [actionRow],
    });
  },
});
