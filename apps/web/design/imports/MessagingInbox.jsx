
import React, { useEffect, useState } from 'react';

export default function MessagingInbox() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetch('/api/messages')
      .then((res) => res.json())
      .then(setMessages);
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto bg-white shadow rounded-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Inbox</h2>
      <ul className="space-y-3">
        {messages.map((msg, i) => (
          <li key={i} className="border p-3 rounded hover:bg-gray-50">
            <div className="text-sm text-gray-500">{msg.timestamp}</div>
            <div className="font-bold text-gray-700">{msg.from}</div>
            <div className="text-gray-800">{msg.body}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
