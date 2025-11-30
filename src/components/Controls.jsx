import React from 'react';

const Controls = ({ isRunning, time, onStart, onPause, onStop, onLap, onResume }) => {
    return (
        <div className="buttons-container">
            {!isRunning && time === 0 && (
                <button className="start-btn" onClick={onStart}>
                    Start
                </button>
            )}
            {isRunning && (
                <>
                    <button className="lap-btn" onClick={onLap}>
                        Lap
                    </button>
                    <button className="pause-btn" onClick={onPause}>
                        Pause
                    </button>
                    <button className="stop-btn" onClick={onStop}>
                        Stop
                    </button>
                </>
            )}
            {!isRunning && time !== 0 && (
                <button className="start-btn" onClick={onResume}>
                    Resume
                </button>
            )}
        </div>
    );
};

export default Controls;
