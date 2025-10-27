import React, { useState, useEffect, useRef } from "react";
import HorizontalScrollInput from "./HorizontalScrollInput";
import "./index.css";

function App() {
  const [rounds, setRounds] = useState(1);
  const [workTime, setWorkTime] = useState(10);
  const [restTime, setRestTime] = useState(5);
  const [started, setStarted] = useState(false);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(workTime);
  const timerRef = useRef(null);

  // --- BEEP SOUND UTILITY ---
  const playBeep = (frequency = 440, duration = 150, repeat = 1, gap = 100) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < repeat; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(
        frequency,
        ctx.currentTime + i * (duration + gap) / 1000
      );
      osc.start(ctx.currentTime + i * (duration + gap) / 1000);
      osc.stop(ctx.currentTime + i * (duration + gap + duration) / 1000);
    }
  };

  const handleStart = () => {
    setStarted(true);
    setIsWorkPhase(true);
    setCurrentRound(1);
    setTimeLeft(workTime);
    playBeep(880, 200, 2, 100);
  };

  const handleReset = () => {
    clearInterval(timerRef.current);
    setStarted(false);
    setTimeLeft(workTime);
  };

  // --- TIMER LOOP ---
  useEffect(() => {
    if (!started) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (isWorkPhase) {
            setIsWorkPhase(false);
            playBeep(440, 200, 1);
            return restTime;
          } else {
            if (currentRound >= rounds) {
              clearInterval(timerRef.current);
              playBeep(880, 150, 3, 100);
              setStarted(false);
              return workTime;
            } else {
              setIsWorkPhase(true);
              setCurrentRound((r) => r + 1);
              playBeep(880, 150, 2, 100);
              return workTime;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [started, isWorkPhase, currentRound, rounds, workTime, restTime]);

  // --- SETUP VIEW ---
  if (!started) {
    return (
      <div className="app-container">
        <h1 className="title">Workout Timer Setup</h1>

        <div className="scroll-section">
          <HorizontalScrollInput
            label="Rounds"
            value={rounds}
            min={1}
            max={10}
            increment={1}
            onChange={setRounds}
          />
          <HorizontalScrollInput
            label="Work Time (sec)"
            value={workTime}
            min={10}
            max={120}
            increment={5}
            onChange={setWorkTime}
          />
          <HorizontalScrollInput
            label="Rest Time (sec)"
            value={restTime}
            min={5}
            max={120}
            increment={5}
            onChange={setRestTime}
          />
        </div>

        <button className="btn-start" onClick={handleStart}>
          Start Workout
        </button>
      </div>
    );
  }

  // --- ACTIVE WORKOUT VIEW ---
  return (
    <div className="app-container workout-view">
      <div className={`countdown-phase ${isWorkPhase ? "phase-work" : "phase-rest"}`}>
        <h2 className="phase-title">{isWorkPhase ? "WORK" : "REST"}</h2>
        <div className="timer-number pulse">{timeLeft}</div>
        <div className="round-info">
          Round {currentRound}/{rounds}
        </div>
        <button className="btn-reset" onClick={handleReset}>
          Stop / Reset
        </button>
      </div>
    </div>
  );
}

export default App;
