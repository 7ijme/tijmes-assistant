import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  Interaction,
} from "discord.js";
import { Event, Command, CommandReplyEmbedOptions } from "../Interfaces";
import Client from "../Client";

function createDiscordTimestamp() {
  return `<t:${Math.floor(Date.now() / 1000)}:R>`;
}

export const event: Event = new Event({
  name: "interactionCreate",
  run: async (client, interaction: Interaction) => {
    if (interaction.isButton()) {
      if (interaction.customId.includes(interaction.user.id)) {
        if (interaction.customId.startsWith("DELETE")) {
          await interaction.update({
            content: "‎",
            components: [],
            embeds: [],
          });
          await interaction.deleteReply();
          return;
        }

        if (interaction.customId.startsWith("tourmin")) {
          const players = parseInt(
            interaction.message.content.split("\n")[5].split("**")[1],
          );

          const newMessage = interaction.message.content
            .replace(players.toString(), (players - 1).toString())
            .replace(/<t:\d+:R>/, createDiscordTimestamp());

          interaction.update({
            content: newMessage,
          });
        }

        if (interaction.customId.startsWith("tourplus")) {
          const players = parseInt(
            interaction.message.content.split("\n")[5].split("**")[1],
          );

          const newMessage = interaction.message.content
            .replace(players.toString(), (players + 1).toString())
            .replace(/<t:\d+:R>/, createDiscordTimestamp());

          interaction.update({
            content: newMessage,
          });
        }

        if (interaction.customId.startsWith("tourclose")) {
          // change color to red and remove buttons
          const newMessage = interaction.message.content
            .replace(/Status: \*\*(Open|Ingame)\*\*/, `Status: **Closed**`)
            .replace(/<t:\d+:R>/, createDiscordTimestamp());

          const button = new ButtonBuilder()
            .setLabel("Delete")
            .setStyle(ButtonStyle.Danger)
            .setCustomId(`DELETE-${interaction.user.id}`);

          const actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
            button,
          );
          interaction.update({
            content: newMessage,
            components: [actionRow],
          });
        }

        if (interaction.customId.startsWith("touringame")) {
          // toggle color from green to orange and vice versa
          const open = interaction.message.content.includes("Open");
          const newMessage = interaction.message.content
            .replace(/(Open|Ingame)/, open ? "Ingame" : "Open")
            .replace(/<t:\d+:R>/, createDiscordTimestamp());
          interaction.update({
            content: newMessage,
          });
        }
      } else {
        interaction.reply({
          content: `Only my king, <@${client.config.developers[0]}>, can use this button.`,
          ephemeral: true,
        });
      }
    }
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;
    const command = client.commands.find(
      (cmd) => cmd.data.name.toLowerCase() === commandName.toLowerCase(),
    );

    if (!command) return;

    (command as Command).run(client, interaction);
  },
});

CommandInteraction.prototype.sendEmbed = async function (
  options: CommandReplyEmbedOptions,
) {
  if (!(this as CommandInteraction).isRepliable()) return;

  try {
    await (this as CommandInteraction).reply({
      embeds: [
        new EmbedBuilder({
          title: options.title,
          description: options.description,
          color:
            (options?.color as number) ||
            parseInt(
              ((this as CommandInteraction).client as Client).config
                .defaultColor,
            ) ||
            0x00ff00,
          author: options.author || {
            name: (this as CommandInteraction).user.username,
            iconURL: (this as CommandInteraction).user.displayAvatarURL({
              forceStatic: false,
            }),
          },
          timestamp: options.timestamp || Date.now(),
          image: options.image,
          thumbnail: options.thumbnail,
          fields: options.fields,
          url: options.url,
          footer: options.footer,
        }),
      ],
      components: options.components || [],
      content: options.content,
      files: options.files,
      allowedMentions: options.mentions || { repliedUser: false },
      ephemeral: options.ephemeral || false,
    });
  } catch (e) {
    console.log(e);
    return null;
  }
};
