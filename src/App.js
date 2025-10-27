import React, { useState } from "react";
import HorizontalScrollInput from "./HorizontalScrollInput";
import "./index.css";

function App() {
  const [rounds, setRounds] = useState(3);
  const [workTime, setWorkTime] = useState(30);
  const [restTime, setRestTime] = useState(15);

  return (
    <div className="app-container">
      <h1 className="title">Workout Timer</h1>

      <div className="scroll-section">
        <HorizontalScrollInput
          label="Rounds"
          value={rounds}
          min={1}
          max={30}
          increment={1}
          onChange={setRounds}
        />
        <HorizontalScrollInput
          label="Work Time (sec)"
          value={workTime}
          min={5}
          max={120}
          increment={5}
          onChange={setWorkTime}
        />
        <HorizontalScrollInput
          label="Rest Time (sec)"
          value={restTime}
          min={5}
          max={90}
          increment={5}
          onChange={setRestTime}
        />
      </div>
    </div>
  );
}

export default App;
