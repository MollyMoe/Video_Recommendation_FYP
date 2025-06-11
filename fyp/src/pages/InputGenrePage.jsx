import React from "react";
import { useNavigate } from "react-router-dom";
import logoPic from "../images/Cine-It.png";

const InputGenrePage = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/signin");
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center mt-30 bg-white space-y-6 px-4">
        {/* Logo */}
        <div className="flex items-center justify-start rtl:justify-end">
          <img
            className="w-70 h-20 rounded-full"
            src={logoPic}
            alt="Cine-It.png"
          />
        </div>

        {/* Form container */}
        <div className="w-full max-w-lg h-60 p-4 bg-[#F6EBFF] border border-gray-200 rounded-lg shadow-sm sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h5 className="text-xl font-medium text-gray-900 dark:text-white text-center">
              What are your preference genres?
            </h5>
            <div>
              <input
                type="text"
                id="genre"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                    focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 
                    dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white 
                    dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="mx-auto text-black bg-white hover:bg-blue-800 focus:ring-4 focus:outline-none flex items-center
                focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5
                hover:bg-gray-200 dark:hover:bg-gray-700 shadow-md dark:focus:ring-blue-800"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default InputGenrePage;

// <form onSubmit={handleSubmit} class="max-w-sm mx-auto">

// <div className="mb-5">
//     <label for="input"
//         className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your password</label>
//     <input type="text" id="Genre" className="bg-gray-50 border border-gray-300 text-gray-900
//     text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700
//     dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500
//     dark:focus:border-blue-500" required />
// </div>

// <button type="submit" className="text-white bg-blue-700
// hover:bg-blue-800 focus:ring-4 focus:outline-none
// focus:ring-blue-300 font-medium rounded-lg text-sm
// w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600
// dark:hover:bg-blue-700 dark:focus:ring-blue-800">Submit</button>
// </form>
