import React from "react";

export const getSafeAreaStyle = (transform: {
    scale: number;
    left: string;
    top: string;
}): React.CSSProperties => ({
    position: "absolute",
    width: 1680, // GAME_WIDTH
    height: 945, // GAME_HEIGHT
    left: 0,
    top: 0,
    transform: `translate(${transform.left}, ${transform.top}) translate(-50%, -50%) scale(${transform.scale})`,
    transformOrigin: "center center",
    pointerEvents: "none",
    boxSizing: "border-box",
    overflow: "hidden",
});

export const footerBarStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: 100,
    background: "rgba(0, 0, 0, 0.9)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 60px",
    borderTop: "2px solid #444",
    pointerEvents: "auto",
    boxSizing: "border-box",
};

export const statGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
};

export const labelStyle: React.CSSProperties = {
    color: "#f39c12",
    fontSize: 32,
    fontWeight: "bold",
};

export const valueStyle: React.CSSProperties = {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
};

export const betGroupStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 15,
};

export const btnActionStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "2px solid #555",
    background: "#222",
    color: "#fff",
    fontSize: 20,
    cursor: "pointer",
};

export const spinBtnStyle: React.CSSProperties = {
    padding: "15px 50px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(#f1c40f, #f39c12)",
    color: "#000",
    fontSize: 40,
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px #d35400",
    width: "250px",
    height: "100px",
    justifyContent: "center",
};
