import ExtendedClient from "../Client/index.ts";
import Client from "../Client/index.ts";
import { ClientEvents } from "npm:discord.js";

interface Run {
  (client: Client, ...args: any[]): any;
}

export class Event {
  name: keyof ClientEvents;
  run: Run;

  constructor({ name, run }: { name: keyof ClientEvents; run: Run }) {
    this.name = name;
    this.run = run;
  }

  public async init(client: ExtendedClient) {
    client.events.set(this.name, this);
    client.on(this.name, this.run.bind(null, client));
  }
}
