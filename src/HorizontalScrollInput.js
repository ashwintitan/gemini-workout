import React, { useEffect, useRef, useState } from "react";

const HorizontalScrollInput = ({ label, value, min, max, increment, onChange }) => {
  const containerRef = useRef(null);
  const [items, setItems] = useState([]);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Generate value range
  useEffect(() => {
    const vals = [];
    for (let i = min; i <= max; i += increment) vals.push(i);
    setItems(vals);
  }, [min, max, increment]);

  // Duplicate array for infinite effect
  const circularItems = [...items, ...items, ...items];
  const middleIndex = items.length;

  // Scroll to center copy once on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !items.length) return;
    const itemWidth = container.scrollWidth / circularItems.length;
    container.scrollLeft = itemWidth * middleIndex;
  }, [items]);

  // Track user scroll, debounce detection
  useEffect(() => {
    if (!isUserScrolling) return;
    const timeout = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const totalWidth = container.scrollWidth;
      const sectionWidth = totalWidth / 3;

      // Adjust scroll to keep user inside middle section for infinite feel
      if (container.scrollLeft < sectionWidth / 2) {
        container.scrollLeft += sectionWidth;
      } else if (container.scrollLeft > sectionWidth * 1.5) {
        container.scrollLeft -= sectionWidth;
      }

      // Find the nearest value to center
      const center = container.scrollLeft + container.offsetWidth / 2;
      const itemWidth = totalWidth / circularItems.length;
      const index = Math.round(center / itemWidth) % items.length;
      const selectedValue = items[index];
      if (selectedValue !== undefined) onChange(selectedValue);
      setIsUserScrolling(false);
    }, 200);
    return () => clearTimeout(timeout);
  }, [isUserScrolling, onChange, circularItems, items]);

  return (
    <div className="scroll-input">
      <label className="scroll-label">{label}</label>
      <div
        className="scroll-wheel"
        ref={containerRef}
        onScroll={() => setIsUserScrolling(true)}
      >
        {circularItems.map((item, i) => (
          <div
            key={i}
            className={`scroll-item ${item === value ? "active" : ""}`}
            onClick={() => onChange(item)}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalScrollInput;
