import React from "react";
import { formatCurrency } from "../../game/misc/const";

interface StatGroupProps {
    label: string;
    value: number;
}

export const StatGroup: React.FC<StatGroupProps> = ({ label, value }) => (
    <div className="stat-group">
        <div className="stat-group_label">{label}:</div>
        <div className="stat-group_value">{formatCurrency(value)}</div>
    </div>
);
