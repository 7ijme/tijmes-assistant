import Client from "../Client";
import { ClientEvents } from "discord.js";

interface Run {
	(client: Client, ...args: any[]);
}

export class Event {
	name: keyof ClientEvents;
	run: Run;

	constructor({ name, run }: { name: keyof ClientEvents; run: Run }) {
		this.name = name;
		this.run = run;
	}

	public async init(client: Client) {
		client.events.set(this.name, this);
		client.on(this.name, this.run.bind(null, this));
	}
}
