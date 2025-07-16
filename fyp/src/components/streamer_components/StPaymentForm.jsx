import React, { useState, useEffect } from "react";
import { RiVisaFill } from "react-icons/ri";
import { FaCcMastercard, FaCcAmex, FaApplePay, FaGooglePay } from "react-icons/fa";

const PaymentForm = ({ plan, onClose, onBack }) => {
  const [form, setForm] = useState({
    cardNumber: "",
    expiry: "",
    cvc: "",
    nameOnCard: "",
  });

  const [cardType, setCardType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [touchedFields, setTouchedFields] = useState({
    cardNumber: false,
    expiry: false,
    cvc: false,
    nameOnCard: false,
  });

  const detectCardType = (number) => {
    if (number.startsWith("4")) return "Visa";
    if (number.startsWith("5")) return "Mastercard";
    if (number.startsWith("3")) return "Amex";
    return null;
  };

  const isValidExpiry = (expiry) => {
    const [mm, yy] = expiry.split("/");
    if (!mm || !yy || mm.length !== 2 || yy.length !== 2) return false;
    const month = parseInt(mm, 10);
    const year = parseInt("20" + yy, 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    return year > currentYear || (year === currentYear && month >= currentMonth);
  };

  const isFormValid = () => {
    const cardDigits = form.cardNumber.replace(/\s/g, "");
    return (
      cardDigits.length === 16 &&
      isValidExpiry(form.expiry) &&
      form.cvc.length >= 3 &&
      form.nameOnCard.trim().length > 0
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "cardNumber") {
      const raw = value.replace(/\D/g, "").slice(0, 16);
      const formatted = raw.replace(/(.{4})/g, "$1 ").trim();
      setCardType(detectCardType(raw));
      setForm((prev) => ({ ...prev, cardNumber: formatted }));
    } else if (name === "expiry") {
      const clean = value.replace(/\D/g, "").slice(0, 4);
      const formatted = clean.length > 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
      setForm((prev) => ({ ...prev, expiry: formatted }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (fieldName) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError("❌ Please fill in valid payment details.");
      return;
    }
    setError("");
    setTimeout(() => setShowModal(true), 1000); // simulate delay
  };

    useEffect(() => {
    const allFilled = Object.values(form).every((val) => val.trim().length > 0);
    if (!allFilled) {
        setError("");
        return;
    }

    setError(isFormValid() ? "" : "❌ Please fill in valid payment details.");
    }, [form]);


  return (
    <div className="relative">
      <div className="max-w-sm mx-auto p-6 border border-gray-200 rounded-lg shadow bg-white space-y-4">
        <h2 className="text-lg font-semibold">Payment</h2>

        <div className="flex justify-between items-center border-b pb-2">
          <div className="flex gap-2 text-xl text-gray-600">
            <RiVisaFill />
            <FaCcMastercard className="text-red-500" />
            <FaCcAmex className="text-blue-500" />
            <FaApplePay />
            <FaGooglePay />
          </div>
          <p className="text-sm font-semibold">${(plan?.price || 0).toFixed(2)}</p>
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <label className="text-xs font-medium text-gray-600">CARD NUMBER</label>
            <input
              name="cardNumber"
              value={form.cardNumber}
              onChange={handleChange}
              onBlur={() => handleBlur("cardNumber")}
              className="w-full border border-gray-300 p-2 rounded-md mt-1 text-sm pr-12"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
            {cardType && (
              <span className="absolute right-3 top-9 text-gray-500 text-lg">
                {cardType === "Visa" && <RiVisaFill className="text-blue-600" />}
                {cardType === "Mastercard" && <FaCcMastercard className="text-red-600" />}
                {cardType === "Amex" && <FaCcAmex className="text-blue-500" />}
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="text-xs font-medium text-gray-600">EXPIRY DATE</label>
              <input
                name="expiry"
                value={form.expiry}
                onChange={handleChange}
                onBlur={() => handleBlur("expiry")}
                className="w-full border border-gray-300 p-2 rounded-md mt-1 text-sm"
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
            <div className="w-1/2">
              <label className="text-xs font-medium text-gray-600">SECURE CODE</label>
              <input
                name="cvc"
                value={form.cvc}
                onChange={handleChange}
                onBlur={() => handleBlur("cvc")}
                className="w-full border border-gray-300 p-2 rounded-md mt-1 text-sm"
                placeholder="CVC"
                maxLength={4}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">NAME ON CARD</label>
            <input
              name="nameOnCard"
              value={form.nameOnCard}
              onChange={handleChange}
              onBlur={() => handleBlur("nameOnCard")}
              className="w-full border border-gray-300 p-2 rounded-md mt-1 text-sm"
              placeholder="John Doe"
            />
          </div>

          <button
            type="submit"
            className={`w-full mt-2 ${
              isFormValid() ? "bg-black text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"
            } text-sm py-2 rounded-md`}
            disabled={!isFormValid()}
          >
            <span role="img" aria-label="lock" className="mr-1">🔒</span>
            Submit Payment
          </button>
        </form>
      </div>

        {/* Back button styled similarly */}
        <div className="max-w-sm mx-auto px-6 mt-2 text-center">
        <button
            onClick={onBack}
            className="text-lg text-gray-500 hover:text-black underline"
        >
            &larr; Back
        </button>
        </div>

      {showModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2 text-green-600">✅ Payment Successful</h3>
            <p className="text-sm text-gray-700 mb-4">Thank you! Your transaction is complete.</p>
            <button
              onClick={() => {
                setShowModal(false);
                onClose(); // closes the form and triggers parent update
              }}
              className="px-4 py-1 shadow-md bg-white border border-gray-300 text-black rounded hover:bg-gray-100 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentForm;
