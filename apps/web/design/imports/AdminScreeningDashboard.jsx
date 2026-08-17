
import React, { useEffect, useState } from 'react';

export default function AdminScreeningDashboard() {
  const [verifications, setVerifications] = useState([]);

  useEffect(() => {
    fetch('/api/admin/screening-verifications')
      .then((res) => res.json())
      .then(setVerifications);
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white shadow rounded-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Worker Screening Submissions</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border-b">Worker Name</th>
            <th className="p-2 border-b">Jurisdiction</th>
            <th className="p-2 border-b">Submitted At</th>
            <th className="p-2 border-b">Status</th>
            <th className="p-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {verifications.map((v, i) => (
            <tr key={i} className="border-t hover:bg-gray-50">
              <td className="p-2">{v.name}</td>
              <td className="p-2">{v.jurisdiction}</td>
              <td className="p-2">{v.timestamp}</td>
              <td className="p-2">
                <span className={`text-sm font-medium ${
                  v.status === 'Verified' ? 'text-green-600' :
                  v.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {v.status}
                </span>
              </td>
              <td className="p-2">
                <button className="text-sm text-blue-600 hover:underline">Review</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
