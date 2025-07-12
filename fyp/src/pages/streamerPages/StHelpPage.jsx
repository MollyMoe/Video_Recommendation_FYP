import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react'; // or use + / − text if you don't use lucide

const faqs = [
  {
    question: "How do I like a movie?",
    answer: "Click the ❤️ icon in the movie details popup. It will appear in your 'Liked Movie' list.",
  },
  {
    question: "How do I save a movie to watch later?",
    answer: "Click the 🔖 bookmark icon. You'll find it later in the 'Watch Later' tab.",
  },
  {
    question: "How do I view my watch history?",
    answer: "Click the 'History' section in the sidebar. All played movies are shown there.",
  },
  {
    question: "Can I search for movies?",
    answer: "Yes! Use the search bar at the top to find movies by title, genre, or director.",
  },
  {
    question: "How do I change my account settings?",
    answer: "Go to 'Settings' to update your password, profile picture, or preferred genres.",
  },
  {
    question: "Why don't I see any recommendations?",
    answer: "Make sure you've selected your preferred genres. You can do this in Settings.",
  },
];

const StHelpPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(index === openIndex ? null : index);
  };

  return (
    <div className="sm:ml-64 px-6 py-10 min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-3xl font-bold mb-8">📘 Help & FAQs</h1>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex justify-between items-center px-4 py-3 text-left font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <span>{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {openIndex === index && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-sm rounded-b-md">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StHelpPage;
