import React from 'react';

const LapList = ({ laps, editingLapId, onEditLap, onUpdateLapName, onBlurLap }) => {
    if (laps.length === 0) return null;

    return (
        <div className="current-laps-section">
            <h3>Current Laps</h3>
            <ul className="current-laps-list">
                {laps.map((lap, index) => (
                    <li key={lap.id} className="current-lap-item">
                        {editingLapId === lap.id ? (
                            <input
                                type="text"
                                value={lap.name}
                                onChange={(e) => onUpdateLapName(index, e.target.value)}
                                onBlur={onBlurLap}
                                autoFocus
                            />
                        ) : (
                            <span onDoubleClick={() => onEditLap(lap.id)}>
                                {lap.name} : {lap.formattedTime}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default LapList;
