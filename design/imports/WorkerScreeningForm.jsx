
import React, { useState } from 'react';

export default function WorkerScreeningForm() {
  const [jurisdiction, setJurisdiction] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !jurisdiction) return alert("Please complete all fields.");
    const formData = new FormData();
    formData.append('jurisdiction', jurisdiction);
    formData.append('certificate', file);

    const res = await fetch('/api/verify-worker-check', {
      method: 'POST',
      body: formData
    });

    const result = await res.json();
    alert(result.message);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow rounded-md max-w-xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">NDIS Worker Screening Verification</h2>
      <label className="block mb-2">
        Jurisdiction:
        <select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="block w-full mt-1 p-2 border rounded">
          <option value="">Select State or Territory</option>
          <option value="NSW">New South Wales</option>
          <option value="VIC">Victoria</option>
          <option value="QLD">Queensland</option>
          <option value="SA">South Australia</option>
          <option value="WA">Western Australia</option>
          <option value="TAS">Tasmania</option>
          <option value="ACT">Australian Capital Territory</option>
          <option value="NT">Northern Territory</option>
        </select>
      </label>
      <label className="block mb-4">
        Upload Certificate (PDF/Image):
        <input type="file" accept=".pdf,.png,.jpg" onChange={(e) => setFile(e.target.files[0])} className="block mt-1" />
      </label>
      <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700">Verify</button>
    </form>
  );
}
