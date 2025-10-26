import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';

// --- CONFIGURATION CONSTANTS ---
const MAX_ROUNDS = 15;
const MAX_TIME = 120;
const WORK_INCREMENT = 15;
const REST_INCREMENT = 5;
const PREP_TIME = 5;

// --- WORKOUT STATE ENUM ---
const WORKOUT_STATES = {
    SETUP: 'SETUP',
    PREP: 'PREP',
    WORK: 'WORK',
    REST: 'REST',
    COMPLETE: 'COMPLETE'
};

// --- HELPER FUNCTIONS ---

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const playHighPitchedNoise = () => {
    try {
        // IMPORTANT: Ensure 'chime.mp3' exists in your public folder!
        const audio = new Audio('/chime.mp3'); 
        audio.volume = 0.8;
        audio.play().catch(e => console.error("Audio playback error:", e));
    } catch (e) {
        console.error("Browser audio API issue:", e);
    }
};

// --- HORIZONTAL SCROLL INPUT COMPONENT (Revised Logic) ---
const HorizontalScrollInput = React.memo(({ label, value, max, increment, min, onChange }) => {
    const wheelRef = useRef(null);
    const itemWidth = 80; // Must match CSS
    const maxIndex = Math.floor((max - min) / increment);
    
    // Generate all possible values for the wheel
    const items = Array.from({ length: maxIndex + 1 }, (_, i) => min + i * increment);
    
    const currentIndex = Math.floor((value - min) / increment);

    // Effect to set the initial scroll position correctly on load/value change
    useEffect(() => {
        if (wheelRef.current) {
            const offset = (wheelRef.current.offsetWidth / 2) - (itemWidth / 2);
            // Scroll to the index position, compensating for the centering offset
            wheelRef.current.scrollLeft = (currentIndex * itemWidth) - offset;
        }
    }, [currentIndex, min, increment]);

    // Debounce function to prevent excessive state updates during scrolling
    const debounceRef = useRef(null);
    
    // FIX: Simplified scroll handler relies on the scroll-snap stopping near the center
    const handleScroll = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            const element = wheelRef.current;
            if (!element) return;

            const scrollLeft = element.scrollLeft;
            
            // Calculate the index of the item snapped closest to the start of the scroll view
            // The addition of half itemWidth helps center the calculation for scroll-snap: center
            const rawIndex = Math.round((scrollLeft + itemWidth / 2) / itemWidth);
            
            let newIndex = Math.max(0, Math.min(maxIndex, rawIndex));
            
            const newValue = min + newIndex * increment;

            if (newValue !== value) {
                onChange(newValue);
            }
        }, 150); // 150ms debounce time after user stops scrolling
    };

    return (
        <div className="input-group">
            <label className="input-label">{label}</label>
            <div className="scroll-container">
                <div 
                    ref={wheelRef} 
                    className="scroll-wheel-horizontal"
                    onScroll={handleScroll}
                >
                    {/* Padding ensures the first and last values can snap to the center */}
                    <div className="scroll-padding-start" style={{ width: `calc(50% - ${itemWidth / 2}px)` }}></div>
                    
                    {items.map((item, index) => (
                        <div 
                            key={index} 
                            className={`scroll-item-h ${item === value ? 'active' : ''}`}
                            style={{ width: itemWidth }}
                        >
                            {item}
                        </div>
                    ))}

                    <div className="scroll-padding-end" style={{ width: `calc(50% - ${itemWidth / 2}px)` }}></div>
                </div>
            </div>
            {/* Display value is no longer needed below, as it's active in the scroll area */}
        </div>
    );
});


// --- MAIN APP COMPONENT (Integrating the new scroll input) ---

function App() {
    const [settings, setSettings] = useState({ rounds: 5, workTime: 60, restTime: 30 });
    const [timerState, setTimerState] = useState(WORKOUT_STATES.SETUP);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const intervalRef = useRef(null);

    // Logic to handle state transitions (Same as before)
    const handleNextState = useCallback(() => {
        if (timerState === WORKOUT_STATES.PREP) {
            setTimerState(WORKOUT_STATES.WORK);
            setTimeRemaining(settings.workTime);

        } else if (timerState === WORKOUT_STATES.WORK) {
            if (currentRound < settings.rounds) {
                setTimerState(WORKOUT_STATES.REST);
                setTimeRemaining(settings.restTime);
            } else {
                setTimerState(WORKOUT_STATES.COMPLETE);
            }

        } else if (timerState === WORKOUT_STATES.REST) {
            const nextRound = currentRound + 1;
            setCurrentRound(nextRound);

            if (nextRound <= settings.rounds) {
                setTimerState(WORKOUT_STATES.WORK);
                setTimeRemaining(settings.workTime);
            } else {
                setTimerState(WORKOUT_STATES.COMPLETE);
            }
        }
    }, [timerState, settings, currentRound]);

    // The main timer loop (Same as before)
    useEffect(() => {
        if (timerState === WORKOUT_STATES.SETUP || timerState === WORKOUT_STATES.COMPLETE) {
            return () => clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            setTimeRemaining(prevTime => {
                const newTime = prevTime - 1;

                if (newTime >= 0 && newTime <= 3) {
                    playHighPitchedNoise();
                }

                if (newTime < 0) {
                    clearInterval(intervalRef.current);
                    handleNextState();
                    return 0;
                }

                return newTime;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [timerState, settings, currentRound, handleNextState]);

    const startWorkout = () => {
        clearInterval(intervalRef.current);
        if (settings.rounds > 0 && settings.workTime > 0) {
            setTimerState(WORKOUT_STATES.PREP);
            setTimeRemaining(PREP_TIME);
            setCurrentRound(1);
        }
    };

    const resetWorkout = () => {
        clearInterval(intervalRef.current);
        setTimerState(WORKOUT_STATES.SETUP);
        setTimeRemaining(0);
        setCurrentRound(1);
    };
    
    const createSettingsSetter = useCallback((key) => {
        return (newVal) => {
            // The ScrollInput directly passes the final value, so we use the non-function update path
            if (typeof newVal === 'function') {
                setSettings(prev => ({...prev, [key]: newVal(prev[key])}));
            } else {
                setSettings(prev => ({...prev, [key]: newVal}));
            }
        };
    }, []);

    // --- RENDER LOGIC ---
    if (timerState === WORKOUT_STATES.SETUP) {
        return (
            <div className="app setup-view">
                <h1 className="title">Interval Timer Setup</h1>
                
                {/* Using the scroll input component */}
                <HorizontalScrollInput 
                    label="Rounds (Scroll Left/Right)"
                    value={settings.rounds}
                    min={1} 
                    max={MAX_ROUNDS}
                    increment={1}
                    onChange={createSettingsSetter('rounds')}
                />
                <HorizontalScrollInput 
                    label={`Work Time (Intervals of ${WORK_INCREMENT}s)`}
                    value={settings.workTime}
                    min={WORK_INCREMENT} 
                    max={MAX_TIME}
                    increment={WORK_INCREMENT}
                    onChange={createSettingsSetter('workTime')}
                />
                <HorizontalScrollInput 
                    label={`Rest Time (Intervals of ${REST_INCREMENT}s)`}
                    value={settings.restTime}
                    min={REST_INCREMENT} 
                    max={MAX_TIME}
                    increment={REST_INCREMENT}
                    onChange={createSettingsSetter('restTime')}
                />
                
                <button 
                    onClick={startWorkout} 
                    className="btn-start"
                    disabled={settings.rounds < 1 || settings.workTime < WORK_INCREMENT}
                >
                    Start Workout
                </button>
            </div>
        );
    }

    // Active Timer View (Same as before)
    const phaseLabel = {
        [WORKOUT_STATES.PREP]: 'GET READY',
        [WORKOUT_STATES.WORK]: 'WORK',
        [WORKOUT_STATES.REST]: 'REST',
        [WORKOUT_STATES.COMPLETE]: 'COMPLETE'
    }[timerState];

    const isComplete = timerState === WORKOUT_STATES.COMPLETE;
    const isPrep = timerState === WORKOUT_STATES.PREP;
    const isWorking = timerState === WORKOUT_STATES.WORK;

    return (
        <div className={`app timer-view ${isWorking ? 'work-phase' : ''} ${timerState === WORKOUT_STATES.REST ? 'rest-phase' : ''} ${isComplete ? 'complete-phase' : ''} ${isPrep ? 'prep-phase' : ''}`}>
            
            {!isComplete && (
                <div className="round-tracker">
                    {isPrep ? 'PREP' : `ROUND ${currentRound} OF ${settings.rounds}`}
                </div>
            )}

            <div className="phase-label">{phaseLabel}</div>

            <div className="main-timer">
                {isPrep ? timeRemaining : formatTime(timeRemaining)}
            </div>
            
            {isComplete && (
                <div className="complete-message">
                    WORKOUT COMPLETE! 💪
                </div>
            )}

            <button onClick={resetWorkout} className="btn-reset">
                {isComplete ? 'New Workout' : 'Stop / Reset'}
            </button>
        </div>
    );
}

export default App;
