import React, { useRef, useEffect, useCallback, useState } from 'react';
import './index.css';

const HorizontalScrollInput = React.memo(({ label, value, min, max, increment, onChange }) => {
    const wheelRef = useRef(null);
    const [itemWidth, setItemWidth] = useState(80); 
    const [visibleItems, setVisibleItems] = useState(5); // default visible items
    const maxIndex = Math.floor((max - min) / increment);
    const items = Array.from({ length: maxIndex + 1 }, (_, i) => min + i * increment);

    // Dynamically calculate item width based on container width
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

    // Scroll to center a given index
    const scrollToIndex = useCallback((index, smooth = false) => {
        const element = wheelRef.current;
        if (!element) return;
        const leftPadding = (element.offsetWidth / 2) - (itemWidth / 2);
        const targetScrollLeft = index * itemWidth - leftPadding;
        element.scrollTo({ left: targetScrollLeft, behavior: smooth ? 'smooth' : 'auto' });
    }, [itemWidth]);

    // Center the current value on mount or when value changes
    useEffect(() => {
        const currentIndex = Math.round((value - min) / increment);
        scrollToIndex(currentIndex);
    }, [value, min, increment, scrollToIndex]);

    // Handle scroll and snap to nearest item
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

    return (
        <div className="input-group">
            <label className="input-label">{label}</label>
            <div className="scroll-container">
                <div ref={wheelRef} className="scroll-wheel-horizontal" onScroll={handleScroll}>
                    {/* Extra padding ensures first and last items are fully scrollable */}
                    <div
                        className="scroll-padding-start"
                        style={{ width: itemWidth * 2 }}
                    />
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={`scroll-item-h ${item === value ? 'active' : ''}`}
                            style={{ width: itemWidth }}
                        >
                            {item}
                        </div>
                    ))}
                    <div
                        className="scroll-padding-end"
                        style={{ width: itemWidth * 2 }}
                    />
                </div>
            </div>
        </div>
    );
});

export default HorizontalScrollInput;
