import { Client } from "..";
import { RawGameEvents } from "../data/consts";

/**
 * This module generates a module function that will log certain events.
 */
export default (events: (keyof RawGameEvents)[]) => {
    return (client: Client) => {
        for (const event_name of events)
            client.raw.on(event_name, (e: any) => console.debug(event_name, ...e))
        return client
    }
}
