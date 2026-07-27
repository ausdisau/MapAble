
import React from 'react';

export default function IDVerificationFlow() {
  const steps = [
    "Worker initiates ID verification",
    "Redirect to third-party service (e.g., Stripe Identity, IDVerse)",
    "Upload ID and selfie for liveness check",
    "Third-party validates ID and returns result",
    "Verification result stored in backend",
    "Worker profile updated (badge shown)",
    "Optional: Cross-check with NDIS Worker Screening DB",
    "Audit log saved with timestamp"
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold text-teal-800 mb-4">
        Participant-Safe ID Verification Flow
      </h2>
      <ol className="space-y-4">
        {steps.map((step, idx) => (
          <li
            key={idx}
            className="flex items-start space-x-3 bg-teal-50 border-l-4 border-teal-600 p-4 rounded-md"
          >
            <div className="flex-shrink-0">
              <span className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-teal-600 text-white font-bold">
                {idx + 1}
              </span>
            </div>
            <p className="text-gray-800">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
