
import { useState } from 'react';
import { FaFileInvoice, FaSyncAlt, FaPaperPlane, FaTimes } from 'react-icons/fa';

export default function OrbInvoiceWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-10 right-10 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-16 h-16 bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-800 transition"
        aria-label="Toggle Invoice Orb"
      >
        {open ? <FaTimes size={24} /> : <FaFileInvoice size={28} />}
      </button>

      {open && (
        <div className="absolute bottom-20 right-0 bg-white border border-gray-300 rounded-xl shadow-lg w-64 p-4 space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Invoice Tools</h3>
          <button className="flex items-center space-x-2 text-blue-700 hover:underline">
            <FaPaperPlane /> <span>Send Invoice</span>
          </button>
          <button className="flex items-center space-x-2 text-blue-700 hover:underline">
            <FaSyncAlt /> <span>Sync with Xero</span>
          </button>
          <button className="flex items-center space-x-2 text-blue-700 hover:underline">
            <FaFileInvoice /> <span>Preview Invoice</span>
          </button>
        </div>
      )}
    </div>
  );
}
