import React, { useState, useEffect, useCallback } from "react";
import { GAME_HEIGHT, GAME_WIDTH } from "../managers/DisplayManager";
import { game } from "../../main";
import { GameEvent } from "..";

import { StatGroup } from "./StatGroup";
import { SpinButton } from "./SpinButton";
import { footerBarStyle, getSafeAreaStyle } from "./uiStyles";

// --- EXTERNAL ACCESS ---
// These variables can be imported and called directly from TS files like SlotMechanism or Machine.
export let updateUIBalance: (val: number) => void = () => {};
export let updateUIWin: (val: number) => void = () => {};
export let updateUIBet: (val: number) => void = () => {};

interface GameUIProps {
    onSpin: (currentBet: number) => void;
    balance: number;
    fixedBetAmount: number;
}

export const GameUI: React.FC<GameUIProps> = ({
    onSpin,
    fixedBetAmount,
    balance,
}) => {
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

    // 2. Bind Functions for External Access
    useEffect(() => {
        // Direct balance override (e.g., deducting bet at the beginning of a spin)
        updateUIBalance = (newTotal: number) => {
            setCurrentBalance(newTotal);
        };

        // Handles win updates: updates both the WIN box and adds to the current balance
        updateUIWin = (winAmount: number) => {
            setCurrentWin(winAmount);

            // Functional update: 'prev' always guarantees we modify the most recent React state value
            setCurrentBalance((prev) => {
                const finalBalance = prev + winAmount;
                console.log("UI Sync: New Balance after win:", finalBalance);
                return finalBalance;
            });
        };

        updateUIBet = (val: number) => setBet(val);

        return () => {
            // Cleanup references on unmount to prevent memory leaks
            updateUIBalance = updateUIWin = updateUIBet = () => {};
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

        // Directly show the UI if the game scene is already fully loaded
        if ((window as any).isGameReady) setVisible(true);

        updateLayout();

        return () => {
            window.removeEventListener("resize", updateLayout);
            game.events.off(GameEvent.GAME_SHOW_MAIN_SCREEN, showUI);
        };
    }, [updateLayout, showUI]);

    // 4. Spin Initiation Trigger (Triggered when child SpinButton handles click)
    const handleSpinInitiated = () => {
        // Reset the win field on every new spin
        setCurrentWin(0);
        // Instantly deduct the bet amount from visual balance
        setCurrentBalance((prev) => prev - bet);
        // Execute the actual game scene spin logic
        onSpin(bet);
    };

    if (!visible) return null;

    return (
        <div style={getSafeAreaStyle(transform)}>
            {/* Main Relative Wrapper */}
            <div
                style={{ position: "relative", width: "100%", height: "100%" }}
            >
                {/* FOOTER OVERLAY BAR */}
                <div
                    style={{
                        ...footerBarStyle,
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        padding: "0 50px",
                        boxSizing: "border-box",
                        position: "absolute",
                        bottom: 0,
                        zIndex: 1,
                    }}
                >
                    {/* STATS GROUP */}
                    <div
                        style={{
                            display: "flex",
                            flex: 1,
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <StatGroup label="BALANCE" value={currentBalance} />
                        <StatGroup label="WIN" value={currentWin} />
                        <StatGroup label="BET" value={bet} />
                    </div>
                </div>

                {/* SPIN BUTTON CONTAINER */}
                <div
                    style={{
                        position: "absolute",
                        right: "26px",
                        bottom: "139px",
                        zIndex: 10,
                        filter: "drop-shadow(0px 4px 10px rgba(0,0,0,0.5))",
                        pointerEvents: "auto",
                    }}
                >
                    <SpinButton
                        onSpinRequest={handleSpinInitiated}
                        balance={currentBalance}
                        bet={bet}
                    />
                </div>
            </div>
        </div>
    );
};
