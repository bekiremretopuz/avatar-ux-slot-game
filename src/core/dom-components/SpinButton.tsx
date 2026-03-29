import React, { useState, useEffect } from "react";
import { game } from "../../main";
import { GameEvent, GameEventPayloads } from "..";
import { MACHINE_EVENTS } from "../../game/components/slot/Machine";
import { spinBtnStyle } from "./uiStyles";

interface SpinButtonProps {
    balance: number;
    bet: number;
}

export const SpinButton: React.FC<SpinButtonProps> = ({
    balance,
    bet,
}) => {
    const [label, setLabel] = useState<"SPIN" | "STOP" | "WAIT">("SPIN");

    useEffect(() => {
        const handler = (
            status: GameEventPayloads[typeof GameEvent.GAME_MACHINE_ANIMATION_STATUS],
        ) => {
            if (status.status === MACHINE_EVENTS.COMPLETE) {
                setLabel("SPIN");
            }
        };

        game.events.on(GameEvent.GAME_MACHINE_ANIMATION_STATUS, handler);
        return () => {
            game.events.off(GameEvent.GAME_MACHINE_ANIMATION_STATUS, handler);
        };
    }, []);

    const handleClick = () => {
        if (label === "SPIN") {
            if (balance < bet) return;
            setLabel("STOP");
            game.events.emit(GameEvent.UI_START_MACHINE, {
                betAmount: bet,
            });
        } else if (label === "STOP") {
            setLabel("WAIT");
            game.events.emit(GameEvent.UI_STOP_MACHINE);
        }
    };

    const isDisabled = label === "WAIT" || (label === "SPIN" && balance < bet);

    return (
        <button
            onClick={handleClick}
            disabled={isDisabled}
            style={{
                ...spinBtnStyle,
                opacity: isDisabled ? 0.6 : 1,
                filter: isDisabled ? "grayscale(0.5)" : "none",
                cursor: isDisabled ? "not-allowed" : "pointer",
                pointerEvents: "auto",
            }}
        >
            {label}
        </button>
    );
};
