import React, { useState, useEffect } from "react";
import { game } from "../../main";
import { GameEvent } from "..";
import { MACHINE_EVENTS } from "../../game/components/slot/Machine";
import { spinBtnStyle } from "./uiStyles";

interface SpinButtonProps {
    onSpinRequest: () => void; // Parent'a spin başlama isteği gönderir
    balance: number;
    bet: number;
}

export const SpinButton: React.FC<SpinButtonProps> = ({
    onSpinRequest,
    balance,
    bet,
}) => {
    const [label, setLabel] = useState<"SPIN" | "STOP" | "WAIT">("SPIN");

    useEffect(() => {
        const handler = (s: any) => {
            if (s.status === MACHINE_EVENTS.COMPLETE) {
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
            onSpinRequest();
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
