import React, { useState, useEffect, useCallback } from "react";
import { GAME_HEIGHT, GAME_WIDTH } from "../managers/DisplayManager";
import { game } from "../../main";
import { GameEvent } from "..";

import { StatGroup } from "./StatGroup";
import { SpinButton } from "./SpinButton";
import { footerBarStyle, getSafeAreaStyle } from "./uiStyles";

// --- EXTERNAL ACCESS ---
// Bu değişkenler SlotMechanism gibi TS dosyalarından import edilip direkt çağrılabilir.
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
    // İstatistik State'leri
    const [currentBalance, setCurrentBalance] = useState(balance);
    const [currentWin, setCurrentWin] = useState(0);
    const [bet, setBet] = useState(fixedBetAmount);

    // Görünürlük ve Ölçeklendirme State'leri
    const [visible, setVisible] = useState(false);
    const [transform, setTransform] = useState({
        scale: 1,
        left: "50%",
        top: "50%",
    });

    // 1. Dışarıdan gelen Prop'ları State ile senkronize et
    useEffect(() => {
        setCurrentBalance(balance);
    }, [balance]);

    useEffect(() => {
        setBet(fixedBetAmount);
    }, [fixedBetAmount]);

    // 2. Dış Dosyalardan Erişilecek Fonksiyonları Bağla
    useEffect(() => {
        // Sadece bakiyeyi güncellemek için (Örn: Spin başında bakiye düşürme)
        updateUIBalance = (newTotal: number) => {
            setCurrentBalance(newTotal);
        };

        // Kazanç geldiğinde hem WIN hanesini güncelle hem de mevcut bakiyeye ekle
        updateUIWin = (winAmount: number) => {
            setCurrentWin(winAmount);

            // Functional update: prev her zaman React'teki en güncel bakiyeyi tutar
            setCurrentBalance((prev) => {
                const finalBalance = prev + winAmount;
                console.log("UI Sync: New Balance after win:", finalBalance);
                return finalBalance;
            });
        };

        updateUIBet = (val: number) => setBet(val);

        return () => {
            // Unmount olduğunda referansları temizle (Memory leak önleyici)
            updateUIBalance = updateUIWin = updateUIBet = () => {};
        };
    }, []);

    // 3. Layout & Responsiveness Logic
    const updateLayout = useCallback(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        // Tasarım boyutlarımıza göre (GAME_WIDTH/HEIGHT) ölçekleme çarpanını bul
        const scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
        setTransform({ scale, left: `${width / 2}px`, top: `${height / 2}px` });
    }, []);

    const showUI = useCallback(() => setVisible(true), []);

    useEffect(() => {
        game.events.on(GameEvent.GAME_SHOW_MAIN_SCREEN, showUI);
        window.addEventListener("resize", updateLayout);

        if ((window as any).isGameReady) setVisible(true);

        updateLayout();

        return () => {
            window.removeEventListener("resize", updateLayout);
            game.events.off(GameEvent.GAME_SHOW_MAIN_SCREEN, showUI);
        };
    }, [updateLayout, showUI]);

    // 4. Spin Başlatma (SpinButton'dan tetiklenir)
    const handleSpinInitiated = () => {
        // Yeni spin başlarken Win hanesini temizle
        setCurrentWin(0);
        // Bakiyeyi bahis kadar düşür
        setCurrentBalance((prev) => prev - bet);
        // Asıl oyunu (Phaser/Pixi) başlat
        onSpin(bet);
    };

    if (!visible) return null;

    return (
        <div style={getSafeAreaStyle(transform)}>
            {/* Main Wrapper */}
            <div
                style={{ position: "relative", width: "100%", height: "100%" }}
            >
                {/* FOOTER BAR */}
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
                        right: "25px",
                        bottom: "145px",
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
