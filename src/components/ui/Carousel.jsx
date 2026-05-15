import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../../styles/Carousel.css";

const DRAG_BUFFER        = 0;
const VELOCITY_THRESHOLD = 500;
const GAP                = 12;
const SPRING_OPTIONS     = { type: "spring", stiffness: 300, damping: 30 };

function CarouselItem({ item, index, itemWidth, trackItemOffset, x, transition }) {
  const range   = [-(index + 1) * trackItemOffset, -index * trackItemOffset, -(index - 1) * trackItemOffset];
  const rotateY = useTransform(x, range, [90, 0, -90], { clamp: false });
  const glow    = item.iconColor
    ? { filter: `drop-shadow(0 0 7px ${item.iconColor})` }
    : undefined;

  return (
    <motion.div
      className="carousel-item"
      style={{ width: itemWidth, rotateY }}
      transition={transition}
    >
      <div className="carousel-item-header">
        <span className="carousel-icon-glow" style={glow}>{item.icon}</span>
        {item.label && <span className="carousel-item-label">{item.label}</span>}
      </div>

      <div className="carousel-item-content">
        <div className="carousel-item-title">{item.title}</div>

        {item.tags?.length > 0 ? (
          <div className="carousel-tag-list">
            {item.tags.map(t => (
              <span key={t} className="carousel-tag">{t}</span>
            ))}
          </div>
        ) : item.body ? (
          <p className="carousel-item-description">{item.body}</p>
        ) : null}

        {item.action && (
          <button className="carousel-action-btn" onClick={item.action}>
            {item.actionLabel ?? "Open"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Carousel({ items = [], autoplay = false, autoplayDelay = 3000, loop = false }) {
  const containerRef   = useRef(null);
  const pointerStartX  = useRef(null);
  const didDrag        = useRef(false);
  const [width, setWidth]         = useState(300);
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [position, setPosition]   = useState(loop ? 1 : 0);
  const x = useMotionValue(0);

  // Fill the container -- contentRect.width already excludes CSS padding
  const itemWidth       = width;
  const trackItemOffset = itemWidth + GAP;

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const itemsForRender = useMemo(() => {
    if (!loop || items.length === 0) return items;
    return [items[items.length - 1], ...items, items[0]];
  }, [items, loop]);

  useEffect(() => {
    const start = loop ? 1 : 0;
    setPosition(start);
    x.set(-start * trackItemOffset);
  }, [items.length, loop, trackItemOffset, x]);

  useEffect(() => {
    if (!loop && position > itemsForRender.length - 1) {
      setPosition(Math.max(0, itemsForRender.length - 1));
    }
  }, [itemsForRender.length, loop, position]);

  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1 || isHovered) return;
    const t = setInterval(() => setPosition(p => Math.min(p + 1, itemsForRender.length - 1)), autoplayDelay);
    return () => clearInterval(t);
  }, [autoplay, autoplayDelay, isHovered, itemsForRender.length]);

  const effectiveTransition = isJumping ? { duration: 0 } : SPRING_OPTIONS;

  function handleAnimationComplete() {
    if (!loop || itemsForRender.length <= 1) { setIsAnimating(false); return; }
    const lastClone = itemsForRender.length - 1;
    if (position === lastClone) {
      setIsJumping(true);
      setPosition(1); x.set(-trackItemOffset);
      requestAnimationFrame(() => { setIsJumping(false); setIsAnimating(false); });
      return;
    }
    if (position === 0) {
      setIsJumping(true);
      const t = items.length; setPosition(t); x.set(-t * trackItemOffset);
      requestAnimationFrame(() => { setIsJumping(false); setIsAnimating(false); });
      return;
    }
    setIsAnimating(false);
  }

  function handleDragEnd(_, { offset, velocity }) {
    didDrag.current = true;
    const dir = offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD ?  1
              : offset.x >  DRAG_BUFFER || velocity.x >  VELOCITY_THRESHOLD ? -1 : 0;
    if (!dir) return;
    setPosition(p => Math.max(0, Math.min(p + dir, itemsForRender.length - 1)));
  }

  function goNext() {
    if (isAnimating) return;
    setPosition(p => Math.min(p + 1, itemsForRender.length - 1));
  }

  function goPrev() {
    if (isAnimating) return;
    setPosition(p => Math.max(0, p - 1));
  }

  // Click left half = prev, right half = next.
  // Aborts if the pointer actually dragged or hit an interactive element.
  function handleContainerClick(e) {
    if (didDrag.current) { didDrag.current = false; return; }
    if (e.target.closest("button") || e.target.closest(".carousel-indicator")) return;
    const rect  = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    clickX < rect.width / 2 ? goPrev() : goNext();
  }

  const dragConstraints = loop ? {} : {
    dragConstraints: { left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0), right: 0 }
  };

  const activeIndex = items.length === 0 ? 0
    : loop ? (position - 1 + items.length) % items.length
    : Math.min(position, items.length - 1);

  const atStart = !loop && position === 0;
  const atEnd   = !loop && position === itemsForRender.length - 1;

  return (
    <div
      ref={containerRef}
      className="carousel-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={e => { pointerStartX.current = e.clientX; didDrag.current = false; }}
      onClick={handleContainerClick}
    >
      {/* Hover arrows */}
      {!atStart && (
        <button className="carousel-arrow carousel-arrow-prev" onClick={e => { e.stopPropagation(); goPrev(); }}>
          <ChevronLeft size={16} />
        </button>
      )}
      {!atEnd && (
        <button className="carousel-arrow carousel-arrow-next" onClick={e => { e.stopPropagation(); goNext(); }}>
          <ChevronRight size={16} />
        </button>
      )}

      <motion.div
        className="carousel-track"
        drag={isAnimating ? false : "x"}
        {...dragConstraints}
        style={{
          width: itemWidth, gap: `${GAP}px`, perspective: 1000,
          perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`, x,
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(position * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationStart={() => setIsAnimating(true)}
        onAnimationComplete={handleAnimationComplete}
      >
        {itemsForRender.map((item, index) => (
          <CarouselItem
            key={`${item?.id ?? index}-${index}`}
            item={item}
            index={index}
            itemWidth={itemWidth}
            trackItemOffset={trackItemOffset}
            x={x}
            transition={effectiveTransition}
          />
        ))}
      </motion.div>

      <div className="carousel-indicators-container">
        <div className="carousel-indicators">
          {items.map((_, i) => (
            <motion.div
              key={i}
              className={`carousel-indicator ${activeIndex === i ? "active" : "inactive"}`}
              animate={{ scale: activeIndex === i ? 1.2 : 1 }}
              onClick={e => { e.stopPropagation(); setPosition(loop ? i + 1 : i); }}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
