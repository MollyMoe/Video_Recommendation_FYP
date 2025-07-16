import React from 'react';
import { plans } from '../../data/subscriptionPlan';

const StPlans = ({ onSelect, onBack }) => {
  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="-ml-60 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <button
            onClick={() => onSelect(plan)}
            className="w-full flex justify-between items-center px-4 py-3 text-left font-medium"
          >
            <span className="font-semibold">{plan.name}</span>
            <span className="text-sm">{plan.tagline}</span>
          </button>
        </div>
      ))}

      {/* Back button styled similarly */}
        <div className="mt-6">
        <button
            onClick={onBack}
            className="text-lg text-gray-500 underline hover:text-gray-700 -ml-60"
        >
            &larr; Back
        </button>
        </div>
    </div>
  );
};

export default StPlans;