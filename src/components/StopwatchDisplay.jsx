import React from 'react';
import { formatTime } from '../utils/timeUtils';

const StopwatchDisplay = ({ displayTime }) => {
    return (
        <h2>{formatTime(displayTime)}</h2>
    );
};

export default StopwatchDisplay;
