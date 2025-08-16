
import React from 'react';
import { plans } from '../../data/subscriptionPlan';
import { Star, ArrowRight } from 'lucide-react';

const StPlans = ({ onSelect, onBack }) => {
  return (
    <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto px-4 py-6">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md hover:shadow-lg transition duration-300 flex flex-col justify-between"
        >
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                {plan.name}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {plan.tagline}
              </span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm">{plan.description}</p>

            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              ${plan.price} <span className="text-sm font-normal">/ {plan.cycle}</span>
            </div>
          </div>

          <button
            onClick={() => onSelect(plan)}
            className="flex justify-center items-center gap-2 py-3 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-b-2xl transition"
          >
            Choose Plan <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ))}

      <div className="col-span-full mt-6 text-center">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white underline"
        >
          &larr; Back
        </button>
      </div>
    </div>
  );
};

export default StPlans;
