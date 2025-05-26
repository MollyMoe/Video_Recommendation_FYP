import { useState } from "react";
import { Dialog } from "@headlessui/react";
import movies from "../data/movieData";
import {Play,Heart,Bookmark} from "lucide-react"

function HomeContent() {
  const [selectedMovie, setSelectedMovie] = useState(null);

  return (
    
    <div className="sm:ml-64 pt-24 px-4 sm:px-8 dark:bg-gray-800 dark:border-gray-700">
      {/* Centered max-width container */}

      <div className="max-w-6xl mx-auto">
        {/* Movie Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-6">
    {movies.map((movie) => (
        <div
        key={movie.id}
        className="relative cursor-pointer group w-[180px] mx-auto"
        onClick={() => setSelectedMovie(movie)}
        >
      {/* Poster view */}
      <div className="aspect-[9/16] overflow-hidden rounded-2xl shadow-lg transition-opacity duration-300 group-hover:opacity-0">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Trailer view on hover */}
         <div className="
          absolute left-1/2
          top-9
          transform -translate-x-1/2 
          w-[350px] 
          z-10
          hidden group-hover:block
          ">
            <div className="aspect-[5/3] overflow-hidden rounded-t-xl shadow-lg">
            <video
                src={movie.trailerUrl}
                muted
                loop
                autoPlay
                playsInline
                className="w-full h-full object-cover "
            />
            </div>
            <div className="bg-black/60 text-white text-xs p-2 rounded-b-xl">
            {movie.description}
            </div>
        </div>
        </div>
    ))}
    </div>
    

      </div>

      {/* Dialog Modal */}
        <Dialog open={!!selectedMovie} onClose={() => setSelectedMovie(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white p-6 rounded-2xl max-w-xl w-full space-y-4 shadow-2xl">
            
                {/* Flex container for poster and buttons side-by-side */}
                <div className="flex space-x-6">
                
                    {/* Poster with fixed width */}
                    <img
                    src={selectedMovie?.poster}
                    alt={selectedMovie?.title}
                    className="rounded-lg w-40 h-auto object-cover"
                    />
                    
                    {/* Buttons container, vertical stack */}
                    <div className="flex flex-col justify-center space-y-3 flex-grow">
                        <h2 className="text-3xl font-semibold mb-10">{selectedMovie?.title}</h2>
                        <p className="text-sm text-gray-700 mb-20">{selectedMovie?.description}</p>
                        <div className="flex space-x-2 mb-10">
                            <button className="bg-white text-black text-sm px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
                                <div className="flex items-center space-x-2">
                                    <div className="bg-black rounded-full p-0.5"><Play className="w-3 h-3 fill-white" /></div>
                                <span>Play</span>
                                </div>
                            </button>
                            <button className="bg-white text-black text-sm px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
                                <div className="flex items-center space-x-2">
                                    <Heart className="w-4 h-4 fill-black" />
                                <span>Like</span>
                                </div>
                            </button>
                            <button className="bg-white text-black text-sm px-4 py-1 mt-10 rounded-lg shadow-md hover:bg-gray-200">
                                <div className="flex items-center space-x-2">
                                    <Bookmark className="w-4 h-4 fill-black"/>
                                <span>Save</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            
            {/* Close button */}
            <button
                onClick={() => setSelectedMovie(null)}
                className="w-15 border border-gray-400 text-gray-800 py-2 rounded-xl hover:bg-gray-100"
            >
                Close
            </button>
            </Dialog.Panel>
        </div>
        </Dialog>
    </div>
  );
}

export default HomeContent;