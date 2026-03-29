import React, { useState, useEffect, useCallback } from "react";
import { GAME_HEIGHT, GAME_WIDTH } from "../managers/DisplayManager";
import { game } from "../../main";
import { GameEvent, GameEventPayloads } from "..";

import { StatGroup } from "./StatGroup";
import { SpinButton } from "./SpinButton";
import "./GameUI.css";
import { getSafeAreaStyle } from "../../game/misc/const";

interface GameUIProps {
    balance: number;
    fixedBetAmount: number;
}

export const GameUI: React.FC<GameUIProps> = ({ fixedBetAmount, balance }) => {
    // Stat States
    const [currentBalance, setCurrentBalance] = useState(balance);
    const [currentWin, setCurrentWin] = useState(0);
    const [bet, setBet] = useState(fixedBetAmount);

    // Visibility and Scaling States
    const [visible, setVisible] = useState(false);
    const [transform, setTransform] = useState({
        scale: 1,
        left: "50%",
        top: "50%",
    });

    // 1. Sync Props with React States
    useEffect(() => {
        setCurrentBalance(balance);
    }, [balance]);

    useEffect(() => {
        setBet(fixedBetAmount);
    }, [fixedBetAmount]);

    // 2. Bind game event listeners for UI updates
    useEffect(() => {
        const handleSpinStart = (
            payload: GameEventPayloads[typeof GameEvent.UI_START_MACHINE],
        ) => {
            setCurrentWin(0);
            setCurrentBalance((prev) => prev - payload.betAmount);
        };

        const handlePlayerWin = (
            payload: GameEventPayloads[typeof GameEvent.UI_WIN_UPDATE],
        ) => {
            setCurrentWin(payload.amount);
            setCurrentBalance((prev) => prev + payload.amount);
        };

        game.events.on(GameEvent.UI_START_MACHINE, handleSpinStart);
        game.events.on(GameEvent.UI_WIN_UPDATE, handlePlayerWin);

        return () => {
            game.events.off(GameEvent.UI_START_MACHINE, handleSpinStart);
            game.events.off(GameEvent.UI_WIN_UPDATE, handlePlayerWin);
        };
    }, []);

    // 3. Layout & Responsiveness Logic
    const updateLayout = useCallback(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        // Find the scale multiplier based on the default canvas design size
        const scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
        setTransform({ scale, left: `${width / 2}px`, top: `${height / 2}px` });
    }, []);

    const showUI = useCallback(() => setVisible(true), []);

    useEffect(() => {
        game.events.on(GameEvent.GAME_SHOW_MAIN_SCREEN, showUI);
        window.addEventListener("resize", updateLayout);

        updateLayout();

        return () => {
            window.removeEventListener("resize", updateLayout);
            game.events.off(GameEvent.GAME_SHOW_MAIN_SCREEN, showUI);
        };
    }, [updateLayout, showUI]);

    if (!visible) return null;

    return (
        <div className="game-ui-safe-area" style={getSafeAreaStyle(transform)}>
            <div className="game-ui-inner">
                <div className="game-ui-footer">
                    <div className="game-ui-stats">
                        <StatGroup label="BALANCE" value={currentBalance} />
                        <StatGroup label="WIN" value={currentWin} />
                        <StatGroup label="BET" value={bet} />
                    </div>
                </div>
                <div className="game-ui-spin-button-wrapper">
                    <SpinButton balance={currentBalance} bet={bet} />
                </div>
            </div>
        </div>
    );
};
