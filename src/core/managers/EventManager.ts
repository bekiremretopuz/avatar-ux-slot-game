import { Ticker } from "pixi.js";
import { MACHINE_EVENTS } from "../../game/components/slot/Machine";

/**
 * Global game event identifiers.
 * Using 'as const' ensures that these are treated as literal strings for type safety.
 */
export const GameEvent = {
    //todo: it should be extendable for the game event from client. (global augmentation ?? idk)
    APP_START: "app:start",
    MACHINE_ANIMATION_STATUS: "game:machine-animation-status",
    FIXED_UPDATE: "game:fixed-update",
} as const;

/** * Type representing the actual string values of GameEvent.
 * e.g., "app:start" | "game:spin-started"
 */
export type GameEventValue = (typeof GameEvent)[keyof typeof GameEvent];

/**
 * Mapping of events to their respective data payloads.
 * If an event has no data, use 'void'.
 */
export interface GameEventPayloads {
    [GameEvent.APP_START]: void;
    [GameEvent.MACHINE_ANIMATION_STATUS]: {
        status: MACHINE_EVENTS;
        column?: number;
    };
    [GameEvent.FIXED_UPDATE]: { delta: Ticker };
}

/**
 * Type helper for event listeners.
 * Automatically decides if the handler function should accept a payload argument based on GameEventPayloads.
 */
export type EventHandler<K extends GameEventValue> =
    GameEventPayloads[K] extends void
        ? () => void
        : (payload: GameEventPayloads[K]) => void;

/**
 * Core event management class.
 * Handles subscription, unsubscription, and dispatching of game events.
 */
export class EventEmitter {
    private listeners: { [key: string]: Set<Function> } = {};

    /**
     * Subscribe to an event.
     * @param event The event name to listen for.
     * @param listener The callback function to execute when the event is emitted.
     */
    on<K extends GameEventValue>(event: K, listener: EventHandler<K>) {
        if (!this.listeners[event]) this.listeners[event] = new Set();
        this.listeners[event]!.add(listener);
    }

    /**
     * Subscribe to an event once. The listener will be removed automatically after the first execution.
     */
    once<K extends GameEventValue>(event: K, listener: EventHandler<K>) {
        const wrapper = (payload: any) => {
            this.off(event, wrapper as any);
            (listener as any)(payload);
        };
        this.on(event, wrapper as any);
    }

    /**
     * Unsubscribe a specific listener from an event.
     */
    off<K extends GameEventValue>(event: K, listener: EventHandler<K>) {
        this.listeners[event]?.delete(listener);
    }

    /**
     * Dispatches an event and executes all registered listeners.
     * @param event The event name.
     * @param payload The data to send (required if specified in GameEventPayloads).
     */
    emit<K extends GameEventValue>(
        event: K,
        ...payload: GameEventPayloads[K] extends void
            ? []
            : [GameEventPayloads[K]]
    ) {
        this.listeners[event]?.forEach((listener) =>
            (listener as any)(payload[0]),
        );
    }

    /**
     * Returns a Promise that resolves when the specified event is triggered.
     * Useful for linearizing asynchronous game flows.
     * @example await events.wait(GameEvent.GAME_SPIN_STARTED);
     */
    wait<K extends GameEventValue>(event: K): Promise<GameEventPayloads[K]> {
        return new Promise((resolve) => {
            this.once(event, ((payload: any) => {
                resolve(payload);
            }) as EventHandler<K>);
        });
    }

    /**
     * Removes all registered listeners for all events.
     */
    clear() {
        this.listeners = {};
    }
}

/**
 * A type-safe wrapper for EventEmitter to be used within game components.
 * Provides easy access to event methods while ensuring correct 'this' context.
 */
export class EventContext {
    public on: EventEmitter["on"];
    public once: EventEmitter["once"];
    public off: EventEmitter["off"];
    public emit: EventEmitter["emit"];
    public wait: EventEmitter["wait"];

    constructor(private emitter: EventEmitter) {
        // Explicitly bind methods to the emitter instance to prevent context loss
        this.on = this.emitter.on.bind(this.emitter);
        this.once = this.emitter.once.bind(this.emitter);
        this.off = this.emitter.off.bind(this.emitter);
        this.emit = this.emitter.emit.bind(this.emitter);
        this.wait = this.emitter.wait.bind(this.emitter);
    }
}
