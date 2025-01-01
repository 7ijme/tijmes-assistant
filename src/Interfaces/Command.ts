import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "@discordjs/builders";
import {
  ActionRowBuilder,
  Attachment,
  CommandInteraction,
  EmbedAuthorOptions,
  EmbedField,
  EmbedFooterOptions,
  EmbedImageData,
  MessageMentionOptions,
} from "discord.js";
import ExtendedClient from "../Client/index";
import Client from "../Client/index";
import { ButtonBuilder } from "discord.js";

export class Command {
  usage: string;
  category: Category;
  run: Run;
  data: CommandData;

  constructor(options: CommandOptions) {
    this.usage = options.usage;
    this.category = options.category;
    this.run = options.run;
    this.data = options.data;
  }

  public async init(client: Client) {
    client.commands.set(this.data.name, this);
  }
}

export interface CommandOptions {
  usage: string;
  category: Category;
  run: Run;
  data: CommandData;
}

export type CommandData = Omit<
  SlashCommandBuilder,
  "addSubcommand" | "addSubcommandGroup"
> | SlashCommandOptionsOnlyBuilder;

interface Run {
  (client?: Client, command?: CommandInteraction): void;
}

export type Category = "info" | "developer" | "fun" | "settings" | "utility";

declare module "discord.js" {
  interface CommandInteraction {
    sendEmbed(options: CommandReplyEmbedOptions): Promise<void>;
  }
}

export interface CommandReplyEmbedOptions {
  client?: ExtendedClient;
  title?: string | null;
  description?: string | null;
  color?: number | null;
  author?: EmbedAuthorOptions | null;
  footer?: EmbedFooterOptions | null;
  image?: EmbedImageData | null;
  thumbnail?: EmbedImageData | null;
  fields?: EmbedField[] | null;
  url?: string | null;
  timestamp?: number | null;
  error?: boolean | null;
  content?: string | null;
  files?: Attachment[];
  mentions?: MessageMentionOptions;
  components?: ActionRowBuilder<ButtonBuilder>[];
  ephemeral?: boolean;
}
