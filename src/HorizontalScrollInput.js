import React, { useEffect, useRef, useState } from "react";

const HorizontalScrollInput = ({ label, value, min, max, increment, onChange }) => {
  const containerRef = useRef(null);
  const [items, setItems] = useState([]);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Generate values
  useEffect(() => {
    const vals = [];
    for (let i = min; i <= max; i += increment) vals.push(i);
    setItems(vals);
  }, [min, max, increment]);

  // Duplicate array 3 times for infinite effect
  const circularItems = [...items, ...items, ...items];
  const middleIndex = items.length;

  // Center on middle copy
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !items.length) return;
    const itemWidth = container.scrollWidth / circularItems.length;
    container.scrollLeft = itemWidth * middleIndex;
  }, [items]);

  // Infinite scroll logic
  const handleScroll = () => {
    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const totalWidth = container.scrollWidth;
    const third = totalWidth / 3;

    if (scrollLeft < third / 2) {
      container.scrollLeft += third;
    } else if (scrollLeft > third * 1.5) {
      container.scrollLeft -= third;
    }
  };

  // Tap selection
  const handleClick = (item) => {
    onChange(item);
  };

  // Detect closest item after scroll stops
  useEffect(() => {
    if (!isUserScrolling) return;
    const timeout = setTimeout(() => {
      const container = containerRef.current;
      const center = container.scrollLeft + container.offsetWidth / 2;
      const itemWidth = container.scrollWidth / circularItems.length;
      const index = Math.round(center / itemWidth) % items.length;
      const selectedValue = items[index];
      if (selectedValue !== undefined) onChange(selectedValue);
      setIsUserScrolling(false);
    }, 150);
    return () => clearTimeout(timeout);
  }, [isUserScrolling, onChange, circularItems, items]);

  return (
    <div className="scroll-input">
      <label className="scroll-label">{label}</label>
      <div
        className="scroll-wheel"
        ref={containerRef}
        onScroll={() => {
          setIsUserScrolling(true);
          handleScroll();
        }}
      >
        {circularItems.map((item, i) => (
          <div
            key={i}
            className={`scroll-item ${item === value ? "active" : ""}`}
            onClick={() => handleClick(item)}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalScrollInput;
