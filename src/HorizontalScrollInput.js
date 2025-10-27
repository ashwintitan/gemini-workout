import React, { useEffect, useRef, useState } from "react";

const HorizontalScrollInput = ({ label, value, min, max, increment, onChange }) => {
  const containerRef = useRef(null);
  const [items, setItems] = useState([]);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  useEffect(() => {
    const vals = [];
    for (let i = min; i <= max; i += increment) vals.push(i);
    setItems(vals);
  }, [min, max, increment]);

  const circularItems = [...items, ...items, ...items];
  const middleIndex = items.length;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !items.length) return;
    const itemWidth = container.scrollWidth / circularItems.length;
    container.scrollLeft = itemWidth * middleIndex;
  }, [items]);

  useEffect(() => {
    if (!isUserScrolling) return;
    const timeout = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const totalWidth = container.scrollWidth;
      const sectionWidth = totalWidth / 3;

      if (container.scrollLeft < sectionWidth / 2) {
        container.scrollLeft += sectionWidth;
      } else if (container.scrollLeft > sectionWidth * 1.5) {
        container.scrollLeft -= sectionWidth;
      }

      const center = container.scrollLeft + container.offsetWidth / 2;
      const itemWidth = totalWidth / circularItems.length;
      const index = Math.round(center / itemWidth) % items.length;
      const selectedValue = items[index];
      if (selectedValue !== undefined) {
        onChange(selectedValue);
      }
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
            className={`scroll-item ${item === value ? "active pulse" : ""}`}
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
