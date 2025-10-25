import React, { useMemo } from 'react';

const NUM_DOTS = 100;

export const PixelBlastBackground: React.FC = () => {
    const dots = useMemo(() => {
        return Array.from({ length: NUM_DOTS }).map((_, i) => {
            const style = {
                '--size': `${Math.random() * 2 + 1}px`, // 1px to 3px
                '--x-start': `${Math.random() * 100}vw`,
                '--y-start': `${Math.random() * 100}vh`,
                '--x-travel': `${(Math.random() - 0.5) * 200}px`, // travel -100px to 100px
                '--y-travel': `${(Math.random() - 0.5) * 200}px`,
                animationDuration: `${Math.random() * 10 + 8}s`, // 8 to 18 seconds
                animationDelay: `-${Math.random() * 18}s`,
            };
            return <div key={i} className="pixel-blast-dot" style={style as React.CSSProperties} />;
        });
    }, []);

    return (
        <div className="pixel-blast-container" aria-hidden="true">
            {dots}
        </div>
    );
};
