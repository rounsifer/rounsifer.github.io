import { useState } from "react";

export const CustomCursor = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);

    // Update cursor position on mouse move
    const updateCursorPosition = (e: React.MouseEvent) => {
        setPosition({ x: e.pageX - 50, y: e.pageY - 50 });
    };

    if (typeof window !== 'undefined') {

        document.body.addEventListener("mouseout", () => { setIsVisible(false) });
        document.body.addEventListener("mouseover", () => { setIsVisible(true) });

    }

    return (
        <div className={`custom-cursor-container`} onMouseMove={updateCursorPosition}>
            <div className={`custom-cursor drop-shadow-glow absolute bg-zinc-300 w-[100px] h-[100px] rounded-full mix-blend-difference ${isVisible ? "opacity-100" : "opacity-0"}`} style={{ left: `${position.x}px`, top: `${position.y}px` }}></div>
            {children}
        </div>
    );
};
