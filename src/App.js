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
        const audio = new Audio('/chime.mp3'); 
        audio.volume = 0.8;
        audio.play().catch(e => console.error("Audio playback error:", e));
    } catch (e) {
        console.error("Browser audio API issue:", e);
    }
};

// --- HORIZONTAL SCROLL INPUT COMPONENT ---
const HorizontalScrollInput = React.memo(({ label, value, max, increment, min, onChange }) => {
    const wheelRef = useRef(null);
    const itemWidth = 80; // Must match CSS -- this is the size of each number block
    const maxIndex = Math.floor((max - min) / increment);
    
    // Generate all possible values for the wheel
    const items = Array.from({ length: maxIndex + 1 }, (_, i) => min + i * increment);
    
    // Calculate the index corresponding to the current value
    const currentIndex = Math.floor((value - min) / increment);

    // Effect to set the initial scroll position correctly on load/value change
    useEffect(() => {
        if (wheelRef.current) {
            // Set scrollLeft to center the current value. We offset by half the viewport width 
            // to make sure the centered item is selected.
            const scrollCenter = (currentIndex * itemWidth) - (wheelRef.current.offsetWidth / 2) + (itemWidth / 2);
            wheelRef.current.scrollLeft = scrollCenter;
        }
    }, [currentIndex, items.length, min, increment]);

    // Debounce function to prevent excessive state updates during scrolling
    const debounceRef = useRef(null);
    const handleScroll = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            const element = wheelRef.current;
            if (!element) return;

            // Calculate which item is closest to the center of the viewport
            // Total scroll + half viewport - half item width
            const scrollCenter = element.scrollLeft + (element.offsetWidth / 2);
            const nearestIndex = Math.round(scrollCenter / itemWidth) - 1; // -1 to account for padding/alignment

            let newIndex = Math.max(0, Math.min(maxIndex, nearestIndex));
            
            // Calculate the actual value
            const newValue = min + newIndex * increment;

            if (newValue !== value) {
                onChange(newValue);
            }
        }, 100); // 100ms debounce
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
                    {/* Add invisible padding items for centering the first and last values */}
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
            <div className="value-display">{value}</div>
        </div>
    );
});


// --- MAIN APP COMPONENT ---

function App() {
    const [settings, setSettings] = useState({ rounds: 5, workTime: 60, restTime: 30 });
    const [timerState, setTimerState] = useState(WORKOUT_STATES.SETUP);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const intervalRef = useRef(null);

    // Logic to handle state transitions
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

    // The main timer loop
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
            if (typeof newVal === 'function') {
                // This path is no longer needed with ScrollInput but kept as safeguard
                setSettings(prev => ({...prev, [key]: newVal(prev[key])}));
            } else {
                // The ScrollInput directly passes the final value, so we use this path
                setSettings(prev => ({...prev, [key]: newVal}));
            }
        };
    }, []);

    // --- RENDER LOGIC ---
    if (timerState === WORKOUT_STATES.SETUP) {
        return (
            <div className="app setup-view">
                <h1 className="title">Interval Timer Setup</h1>
                
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
