
import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const Carousel = ({ children, className }) => {
  const trackRef = useRef(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanScrollPrev(el.scrollLeft > 4)
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = trackRef.current
    if (!el) return
    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(el)
    return () => resizeObserver.disconnect()
  }, [children, updateScrollState])

  const scroll = (direction) => {
    const el = trackRef.current
    if (!el) return
    const amount = el.clientWidth * 0.85
    el.scrollBy({ left: direction === 'next' ? amount : -amount, behavior: 'smooth' })
  }

  return (
    <div className="carousel">
      <button
        className="carousel__arrow carousel__arrow--prev"
        onClick={() => scroll('prev')}
        disabled={!canScrollPrev}
        aria-label="Scroll previous"
      >
        <ChevronLeft size={20} />
      </button>

      <div
        className={clsx('carousel__track', className)}
        ref={trackRef}
        onScroll={updateScrollState}
      >
        {children}
      </div>

      <button
        className="carousel__arrow carousel__arrow--next"
        onClick={() => scroll('next')}
        disabled={!canScrollNext}
        aria-label="Scroll next"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

export default Carousel