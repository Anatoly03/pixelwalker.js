import EventEmitter from "events";
import WebSocket from "ws";
import ReceiveEvents from "./events/incoming";

import { GameClient } from ".";

export function registerEventListeners(ext: Map<number, (...arg: any[]) => void>) {


    receiver.on("PlayerInit", () => {
        console.log("Game initialized");
    });
}
