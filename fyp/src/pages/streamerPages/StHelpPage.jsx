import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react'; // or use + / − text if you don't use lucide

const faqs = [
  {
    question: "How do I like a movie?",
    answer: "Click the 'Like' button in the movie details popup after selecting a movie card. The movie will then be added to your 'Liked Movies' list.",
  },
  {
    question: "How do I save a movie to watch later?",
    answer: "Click the 'Save' button in the movie details popup after selecting a movie card. You'll find it later in the 'Watch Later' tab.",
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
    answer: "Go to 'Settings' to update your password, profile picture, or preferred genres. ALternatively, you can access your user profile by clicking on the profile icon and selecting 'Edit Profile'",
  },
  {
    question: "Why don't I see any recommendations?",
    answer: "Make sure you've selected your preferred genres. You can do this in Settings if you have not done so when you signed up.",
  },
      {
    question: "I forgot my password — how can I reset it?",
    answer: "Click on 'Forgot Password?' option on the login screen and follow the instructions sent to your email.",
  },
    {
    question: "How are recommendations generated?",
    answer: "Our algorithm analyses your liked movies, watch history, and preferred genres to suggest similar titles.",
  },
    {
    question: "How do I remove a movie from my liked list?",
    answer: "Go to your 'Liked Movies' tab and click the 'Remove' button to remove it.",
  },
    {
    question: "What does the rating mean on a movie card?",
    answer: "It reflects the average user rating based on viewer feedback.",
  },
    {
    question: "What if I don't want recommendations based on a certain genre?",
    answer: "You can update your preferred genres in the 'Settings' page to refine recommendations.",
  },
    {
    question: "How do I send feedback on my expriences using the application?",
    answer: "You can provide a feedback for us in the 'Send Feedback' page to help us improve on the web application.",
  },
    {
    question: "How do I report a broken or incorrect movie listing?",
    answer: "Notify us by providing a feedback along with a screenshot of the issue in the 'Send Feedback' page.",
  },
    {
    question: "Is there a mobile app available?",
    answer: "Not yet — but we're working on a mobile app! Stay tuned for updates.",
  },
    {
    question: "Is my viewing history private?",
    answer: "Yes, only you can see your watch history.",
  },
    {
    question: "Is my data shared with third parties?",
    answer: "No, we respect your privacy and do not share your personal data without your consent.",
  },
    {
    question: "Can I recover a deleted account?",
    answer: "Unfortunately, once an account is deleted, all associated data is permanently erased.",
  },
      {
    question: "How often are the recommendations updated?",
    answer: "Recommendations are updated dynamically based on your latest activity and watch trends.",
  },
    {
    question: "Who can I contact for support?",
    answer: (
      <>You can reach us anytime at <span className="text-blue-500 font-semibold">cineit.helpdesk@gmail.com</span>.,
  </>
    ),
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