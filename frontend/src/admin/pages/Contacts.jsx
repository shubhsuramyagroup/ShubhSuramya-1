import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { getContacts } from "../../services/contactService";
import { Toast, BackButton, PageHeader } from "../components/Adminshared ";

function formatDate(timestamp) {
  if (!timestamp) return "N/A";
  return new Date(timestamp.seconds * 1000).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDOB(dob) {
  if (!dob) return "N/A";
  if (dob && (typeof dob.toDate === "function" || dob.seconds)) {
    const date = typeof dob.toDate === "function" ? dob.toDate() : new Date(dob.seconds * 1000);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
  }
  return dob;
}

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [expanded, setExpanded] = useState(null); // row id for mobile expand

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try {
      const data = await getContacts();
      const sortedData = data.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      setContacts(sortedData);
    } catch (error) {
      console.log(error);
      setToast({ type: "error", message: "Failed to load contacts." });
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    const data = contacts.map((item) => ({
      FullName: item.fullName || "",
      Email: item.email || "",
      Phone: item.phone || "",
      DateOfBirth: formatDOB(item.dob),
      Subject: item.subject || "",
      Message: item.message || "",
      CreatedDate: formatDate(item.createdAt),
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    XLSX.writeFile(workbook, "contacts.xlsx");
    setToast({ type: "success", message: "Excel file downloaded successfully." });
  };

  const filteredContacts = contacts.filter((item) =>
    item.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center gap-4">
        <div className="w-9 h-9 rounded-full border-[3px] border-[#E4572E]/20 border-t-[#E4572E]"
             style={{ animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-[#1F2A44] font-semibold text-sm">Loading contacts…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <Toast show={toast} onClose={() => setToast(null)} />

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100
                      px-4 sm:px-8 h-14 flex items-center gap-4">
        <BackButton onClick={() => navigate("/admin/dashboard")} label="Dashboard" />
        <span className="text-gray-200 text-lg">|</span>
        <span className="text-[#1F2A44] font-semibold text-sm">Contacts</span>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <PageHeader
          eyebrow="Inquiries"
          title="Contact Requests"
          subtitle="Manage all contact inquiries from your website"
          actions={
            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-1.5 bg-emerald-600 text-white
                         px-5 py-2.5 rounded-full text-[12px] font-semibold tracking-wide
                         hover:bg-emerald-700 hover:scale-[1.03] transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Excel
            </button>
          }
        />

        {/* Stat card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1F2A44] text-white rounded-2xl p-5 sm:p-6">
            <p className="text-white/60 text-[10px] font-bold tracking-[1.5px] uppercase">Total</p>
            <h2 className="text-4xl font-bold mt-1">{contacts.length}</h2>
            <p className="text-white/40 text-[10px] mt-1">All contacts</p>
          </div>
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-[10px] font-bold tracking-[1.5px] uppercase">Showing</p>
            <h2 className="text-4xl font-bold mt-1 text-[#1F2A44]">{filteredContacts.length}</h2>
            <p className="text-gray-300 text-[10px] mt-1">In search results</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round"
                 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                         text-[#1F2A44] placeholder:text-gray-300 outline-none
                         focus:border-[#E4572E] focus:ring-2 focus:ring-[#E4572E]/10
                         transition-all duration-200"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 sm:px-8 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[#E34A2F] text-[10px] font-bold tracking-[2.5px] uppercase">Records</p>
              <h3 className="text-[#1F2A44] font-semibold text-base mt-0.5">
                {filteredContacts.length} {filteredContacts.length === 1 ? "contact" : "contacts"} found
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-[#F8F7F4]">
                  {["Full Name", "Email", "Phone", "DOB", "Subject", "Message", "Date"].map((h) => (
                    <th key={h} className="px-5 sm:px-6 py-3.5 text-left
                                           text-[10px] font-bold tracking-[1.5px] uppercase text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16 text-gray-400 text-sm">
                      No contacts found
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact, i) => (
                    <tr
                      key={contact.id}
                      className="border-b border-gray-50 hover:bg-[#FDFAF6] transition-colors duration-150"
                      style={{ animation: `fadeUp 0.4s ease ${i * 30}ms both` }}
                    >
                      <td className="px-5 sm:px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#FFF0EC] flex items-center
                                          justify-center flex-shrink-0">
                            <span className="text-[#E4572E] text-[10px] font-bold">
                              {contact.fullName?.[0]?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <span className="text-[#1F2A44] text-sm font-medium whitespace-nowrap">
                            {contact.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-gray-500 text-sm">{contact.email}</td>
                      <td className="px-5 sm:px-6 py-4 text-gray-500 text-sm whitespace-nowrap">{contact.phone}</td>
                      <td className="px-5 sm:px-6 py-4 text-gray-500 text-sm whitespace-nowrap">{formatDOB(contact.dob)}</td>
                      <td className="px-5 sm:px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                                         bg-[#FFF0EC] text-[#E4572E] text-[10px] font-bold
                                         tracking-[1px] uppercase whitespace-nowrap">
                          {contact.subject}
                        </span>
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-gray-500 text-sm max-w-[220px]">
                        <p className="line-clamp-2 text-xs leading-relaxed">{contact.message}</p>
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(contact.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}