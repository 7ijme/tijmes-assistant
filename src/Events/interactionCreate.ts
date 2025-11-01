import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  Interaction,
} from "discord.js";
import {
  Event,
  Command,
  CommandReplyEmbedOptions,
} from "../Interfaces/index.ts";
import Client from "../Client/index.ts";
import {
  getTeletekstButtons,
  scrapeTeletext,
  toAnsi,
} from "../Commands/Utility/teletekst.ts";
import { ModalBuilder, TextInputBuilder } from "npm:@discordjs/builders";
import { TextInputStyle } from "discord.js";
import { ButtonInteraction } from "discord.js";
import { ModalSubmitInteraction } from "discord.js";

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

        if (interaction.customId.startsWith("tt")) {
          if (interaction.customId.split("-")[1] == "choose") {
            // open a modal to choose page
            const pageInput = new TextInputBuilder()
              .setCustomId("page")
              .setLabel("Teletekst Page Number")
              .setStyle(TextInputStyle.Short)
              .setPlaceholder("Enter a page number between 100 and 899")
              .setRequired(true);

            const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
              pageInput,
            );
            const modal = new ModalBuilder()
              .setCustomId(`tt-choose-${interaction.user.id}`)
              .setTitle("Choose Teletekst Page")
              .addComponents(row);
            await interaction.showModal(modal);

            return;
          }

          const page = parseInt(interaction.customId.split("-")[1]);
          updateTeletekstPage(page, interaction);
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
    if (interaction.isModalSubmit()) {
      if (interaction.customId.includes(interaction.user.id)) {
        if (interaction.customId.startsWith("tt-choose")) {
          const pageInput = interaction.fields.getTextInputValue("page");
          const pageNumber = parseInt(pageInput);
          if (isNaN(pageNumber) || pageNumber < 100 || pageNumber > 899) {
            interaction.reply({
              content: "Please enter a valid page number between 100 and 899.",
              ephemeral: true,
            });
            return;
          }
          updateTeletekstPage(pageNumber, interaction);
        }
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
  edit?: boolean,
) {
  if (!(this as CommandInteraction).isRepliable()) return;

  try {
    const button = new ButtonBuilder()
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger)
      .setCustomId(`DELETE-${this.user.id}`);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
      button,
    );

    if (this.deferred) edit = true;

    return await (this as CommandInteraction)[edit ? "editReply" : "reply"]({
      embeds: [
        new EmbedBuilder({
          title: options.title || "",
          description: options.description || "",
          color:
            (options?.color as number) ??
            parseInt(
              ((this as CommandInteraction).client as Client).config
                .defaultColor,
            ) ??
            0x00ff00,
          author: options.author || {
            name: (this as CommandInteraction).user.username,
            iconURL: (this as CommandInteraction).user.displayAvatarURL({
              forceStatic: false,
            }),
          },
          timestamp: options.timestamp || new Date().toISOString(),
          image: options.image || undefined,
          thumbnail: options.thumbnail || undefined,
          fields: options.fields || [],
          url: options.url || undefined,
          footer: options.footer || undefined,
        }),
      ],
      components:
        options.components ||
        (!options.ephemeral && (options.deleteButton ?? true)
          ? [actionRow]
          : []),
      content: options.content || "",
      files: options.files,
      allowedMentions: options.mentions || { repliedUser: false },
      ephemeral: options.ephemeral || false,
    });
  } catch (e) {
    console.log(e);
    return;
  }
};
async function updateTeletekstPage(
  page: number,
  interaction: ButtonInteraction | ModalSubmitInteraction,
) {
  const text = await scrapeTeletext(page);

  const oldEmbed = interaction.message?.embeds[0];
  const newEmbed = new EmbedBuilder()
    .setDescription(toAnsi(text))
    .setColor(oldEmbed?.color ?? 0x00ff00)
    .setAuthor(oldEmbed?.author ?? { name: "" })
    .setTimestamp(new Date());

  (interaction as ButtonInteraction).update({
    embeds: [newEmbed],
    components: [getTeletekstButtons(page, interaction.user.id)],
  });
}
