import {
  MessageActionRowComponentBuilder,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "npm:@discordjs/builders";
import {
  ActionRowBuilder,
  ActionRowData,
  APIMessageTopLevelComponent,
  Attachment,
  CommandInteraction,
  EmbedAuthorOptions,
  EmbedField,
  EmbedFooterOptions,
  EmbedImageData,
  JSONEncodable,
  MessageActionRowComponentData,
  MessageMentionOptions,
  TopLevelComponentData,
} from "npm:discord.js";
import ExtendedClient from "../Client/index.ts";
import Client from "../Client/index.ts";
import { ButtonBuilder } from "npm:discord.js";

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

  public init(client: Client) {
    client.commands.set(this.data.name, this);
  }
}

export interface CommandOptions {
  usage: string;
  category: Category;
  run: Run;
  data: CommandData;
}

export type CommandData =
  | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
  | SlashCommandOptionsOnlyBuilder;

interface Run {
  (client: Client, command: CommandInteraction): void;
}

export type Category = "info" | "developer" | "fun" | "settings" | "utility";

declare module "npm:discord.js" {
  interface CommandInteraction {
    sendEmbed(
      options: CommandReplyEmbedOptions,
      edit?: boolean,
    ): Promise<InteractionResponse | void | Message>;
    options: CommandInteractionOptionResolver;
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
  timestamp?: string | null;
  error?: boolean | null;
  content?: string | null;
  files?: Attachment[];
  mentions?: MessageMentionOptions;
  components?: (
    | JSONEncodable<APIMessageTopLevelComponent>
    | TopLevelComponentData
    | ActionRowData<
        MessageActionRowComponentData | MessageActionRowComponentBuilder
      >
    | APIMessageTopLevelComponent
  )[];
  deleteButton?: boolean;
  ephemeral?: boolean;
}
