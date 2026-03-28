import React from "react";
import { statGroupStyle, labelStyle, valueStyle } from "./uiStyles";
import { formatCurrency } from "../../game/misc/const";

interface StatGroupProps {
    label: string;
    value: number;
}

export const StatGroup: React.FC<StatGroupProps> = ({ label, value }) => (
    <div
        style={{
            ...statGroupStyle,
            display: "flex",
            flexDirection: "row", // Etiket ve değer yan yana
            alignItems: "center",
            gap: "12px",
            minWidth: "fit-content",
        }}
    >
        <div style={{ ...labelStyle, marginBottom: 0, opacity: 0.8 }}>
            {label}:
        </div>
        <div style={valueStyle}>{formatCurrency(value)}</div>
    </div>
);
