import { Client } from "..";
import { RawGameEvents } from "../data/consts";

/**
 * This module generates a function 
 */
export default (events: (keyof RawGameEvents)[]) => {
    return (client: Client) => {
        for (const event_name of events)
            client.raw.on(event_name, console.log)
    }
}
