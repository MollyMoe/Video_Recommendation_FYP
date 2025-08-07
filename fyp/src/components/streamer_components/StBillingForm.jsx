import React, { useState, useEffect } from "react";
import { RiVisaFill } from "react-icons/ri";
import { FaCcMastercard, FaCcAmex, FaApplePay, FaGooglePay } from "react-icons/fa";

import { getAPI } from "@/config/api";

const StBillingForm = ({ onSuccess, onBack }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [form, setForm] = useState({
    cardNumber: "",
    expiry: "",
    cvc: "",
    nameOnCard: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchBilling = async () => {
      const res = await fetch(`${API}/api/billing/${user.userId}`);
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({
          ...prev,
          ...data,
        }));
      }
    };
    fetchBilling();
  }, [user.userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "cardNumber") {
      const raw = value.replace(/\D/g, "").slice(0, 16);
      newValue = raw.replace(/(.{4})/g, "$1 ").trim();
    } else if (name === "expiry") {
      const clean = value.replace(/\D/g, "").slice(0, 4);
      newValue = clean.length > 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
    }

    setForm((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    await fetch(`${API}/api/billing/${user.userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setIsSaving(false);
    onSuccess(); // Go back to overview
  };

  return (
    <div className="relative">
      <div className="max-w-sm mx-auto p-6 border border-gray-200 rounded-lg shadow bg-white space-y-4">
        <h2 className="text-lg font-semibold">Billing Information</h2>

        <div className="flex justify-between items-center border-b pb-2">
          <div className="flex gap-2 text-xl text-gray-600">
            <RiVisaFill />
            <FaCcMastercard className="text-red-500" />
            <FaCcAmex className="text-blue-500" />
            <FaApplePay />
            <FaGooglePay />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Card Number */}
          <div className="relative">
            <label className="text-xs font-medium text-gray-600">CARD NUMBER</label>
            <input
              name="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={form.cardNumber}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded-md mt-1 text-sm"
              maxLength={19}
              required
            />
          </div>

          {/* Expiry and CVC */}
          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="text-xs font-medium text-gray-600">EXPIRY DATE</label>
              <input
                name="expiry"
                placeholder="MM/YY"
                value={form.expiry}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-md mt-1 text-sm"
                maxLength={5}
                required
              />
            </div>
            <div className="w-1/2">
              <label className="text-xs font-medium text-gray-600">SECURE CODE</label>
              <input
                name="cvc"
                placeholder="CVC"
                value={form.cvc}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-md mt-1 text-sm"
                maxLength={4}
                required
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-600">NAME ON CARD</label>
            <input
              name="nameOnCard"
              placeholder="John Doe"
              value={form.nameOnCard}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded-md mt-1 text-sm"
              required
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full mt-2 bg-black text-white text-sm py-2 rounded-md disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </form>
      </div>

      {/* Back Button */}
      <div className="max-w-sm mx-auto px-6 mt-2 text-center">
        <button
          onClick={onBack}
          className="text-lg text-gray-500 hover:text-black underline"
        >
          &larr; Back
        </button>
      </div>
    </div>
  );
};

export default StBillingForm;
