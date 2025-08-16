
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

function MovieCarousel({ title, movies, onMovieClick, autoScroll = false }) {
  const scrollRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const CARD_WIDTH = 240;
  const CARD_GAP = 16;

  const getItemsPerPage = () => {
    if (!scrollRef.current) return 1;
    const containerWidth = scrollRef.current.clientWidth;
    return Math.floor(containerWidth / (CARD_WIDTH + CARD_GAP));
  };

  useEffect(() => {
    const calculatePages = () => {
      const itemsPerPage = getItemsPerPage();
      const pages = Math.ceil(movies.length / itemsPerPage);
      setTotalPages(pages);
    };
    calculatePages();
    window.addEventListener('resize', calculatePages);
    return () => window.removeEventListener('resize', calculatePages);
  }, [movies]);

  useEffect(() => {
    if (!autoScroll || totalPages <= 1 || isHovering) return;
    const interval = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, 3000);
    return () => clearInterval(interval);
  }, [totalPages, isHovering, autoScroll]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const itemsPerPage = getItemsPerPage();
    const scrollAmount = (CARD_WIDTH + CARD_GAP) * itemsPerPage;
    container.scrollTo({
      left: currentPage * scrollAmount,
      behavior: 'smooth',
    });
  }, [currentPage]);

  const handlePrev = () => {
    setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
  };

  const handleNext = () => {
    setCurrentPage(prev => (prev + 1) % totalPages);
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold text-black mb-4 px-4">{title}</h2>

      <div className="relative group">
        <div className="overflow-x-auto scrollbar-hide" ref={scrollRef}>
            <div
                className="relative py-3 snap-x snap-mandatory ml-18 overflow-visible"
            >
            <div className="flex gap-x-8 px-4">
              {movies.map((movie) => (
                <div
                  key={movie._id || movie.movieId}
                  className="relative flex-shrink-0 w-[250px] snap-start overflow-visible"
                >
                  <MovieCard movie={movie} onClick={onMovieClick} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
        onClick={handlePrev}
        className="absolute top-1/2 -translate-y-1/2 z-50 p-1 bg-white/80 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex"
        aria-label="Previous page"
        >
        <ChevronLeft size={24} />
        </button>

        <button
        onClick={handleNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-50 p-1 bg-white/80 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex"
        aria-label="Next page"
        >
        <ChevronRight size={24} />
        </button>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentPage ? 'bg-black scale-125' : 'bg-gray-400'
              }`}
              aria-label={`Go to page ${idx + 1}`}
            ></button>
          ))}
        </div>
      )}
    </div>
  );
}

export default MovieCarousel;
