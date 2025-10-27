import React, { useRef, useEffect, useState } from "react";

const HorizontalScrollInput = ({ label, value, min, max, increment, onChange }) => {
  const scrollRef = useRef(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const vals = [];
    for (let i = min; i <= max; i += increment) vals.push(i);
    setItems(vals);
  }, [min, max, increment]);

  // Set scroll position to the selected value
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !items.length) return;
    const index = items.indexOf(value);
    const itemWidth = el.scrollWidth / items.length;
    const offset = el.offsetWidth / 2 - itemWidth / 2;
    el.scrollLeft = index * itemWidth - offset;
  }, [value, items]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = el.offsetWidth / 2;
    const itemWidth = el.scrollWidth / items.length;
    const center = el.scrollLeft + offset;
    const index = Math.round(center / itemWidth);
    const newValue = items[Math.min(items.length - 1, Math.max(0, index))];
    if (newValue && newValue !== value) onChange(newValue);
  };

  return (
    <div className="scroll-input">
      <label className="scroll-label">{label}</label>
      <div className="scroll-wheel" ref={scrollRef} onScroll={handleScroll}>
        <div style={{ width: "50%" }}></div>
        {items.map((item, i) => (
          <div
            key={i}
            className={`scroll-item ${item === value ? "active pulse" : ""}`}
          >
            {item}
          </div>
        ))}
        <div style={{ width: "50%" }}></div>
      </div>
    </div>
  );
};

export default HorizontalScrollInput;
