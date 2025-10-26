import React, { useRef, useEffect, useCallback, useState } from 'react';
import './index.css';

const HorizontalScrollInput = React.memo(({ label, value, min, max, increment, onChange }) => {
    const wheelRef = useRef(null);
    const [itemWidth, setItemWidth] = useState(80);
    const visibleItems = 5;
    const maxIndex = Math.floor((max - min) / increment);
    const items = Array.from({ length: maxIndex + 1 }, (_, i) => min + i * increment);

    // Dynamic item width
    useEffect(() => {
        const calculateWidth = () => {
            if (wheelRef.current) {
                const containerWidth = wheelRef.current.offsetWidth;
                setItemWidth(containerWidth / visibleItems);
            }
        };
        calculateWidth();
        window.addEventListener('resize', calculateWidth);
        return () => window.removeEventListener('resize', calculateWidth);
    }, [visibleItems]);

    // Scroll to center an index
    const scrollToIndex = useCallback((index, smooth = true) => {
        const element = wheelRef.current;
        if (!element) return;
        const leftPadding = (element.offsetWidth / 2) - (itemWidth / 2);
        element.scrollTo({ left: index * itemWidth - leftPadding, behavior: smooth ? 'smooth' : 'auto' });
    }, [itemWidth]);

    // Center current value on mount / value change
    useEffect(() => {
        const currentIndex = Math.round((value - min) / increment);
        scrollToIndex(currentIndex, false);
    }, [value, min, increment, scrollToIndex]);

    // Snap to nearest value on scroll
    const handleScroll = useCallback(() => {
        const element = wheelRef.current;
        if (!element) return;

        const leftPadding = (element.offsetWidth / 2) - (itemWidth / 2);
        const scrollLeft = element.scrollLeft;
        const centeredIndex = Math.round((scrollLeft + leftPadding) / itemWidth);
        const newIndex = Math.max(0, Math.min(maxIndex, centeredIndex));
        const newValue = min + newIndex * increment;

        if (newValue !== value) {
            onChange(newValue);
            scrollToIndex(newIndex, true);
        }
    }, [value, min, increment, maxIndex, onChange, itemWidth, scrollToIndex]);

    // Handle tap/click on an item
    const handleItemClick = (index) => {
        const newValue = min + index * increment;
        if (newValue !== value) {
            onChange(newValue);
            scrollToIndex(index, true);
        }
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
                    <div className="scroll-padding-start" style={{ width: `${(itemWidth * visibleItems)/2}px` }} />
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={`scroll-item-h ${item === value ? 'active' : ''}`}
                            style={{ width: itemWidth }}
                            onClick={() => handleItemClick(index)}
                        >
                            {item}
                        </div>
                    ))}
                    <div className="scroll-padding-end" style={{ width: `${(itemWidth * visibleItems)/2}px` }} />
                </div>
            </div>
        </div>
    );
});

export default HorizontalScrollInput;
