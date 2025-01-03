import { Event } from "../Interfaces/index.ts";

export const event: Event = new Event({
	name: "ready",
	run: async (client) => {
		console.log(`Logged in as ${client.user.username}!`);
	},
});
