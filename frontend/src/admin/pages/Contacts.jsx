import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { getContacts } from "../../services/contactService";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const data = await getContacts();

      // Sort newest first
      const sortedData = data.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;

        return dateB - dateA;
      });

      setContacts(sortedData);
    } catch (error) {
      console.log(error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  const exportExcel = () => {
    const data = contacts.map((item) => ({
      FullName: item.fullName || "",
      Email: item.email || "",
      Phone: item.phone || "",
      DateOfBirth: item.dob || "",
      Subject: item.subject || "",
      Message: item.message || "",
      CreatedDate: formatDate(item.createdAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");

    XLSX.writeFile(workbook, "contacts.xlsx");
  };

  const filteredContacts = contacts.filter((item) =>
    item.fullName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#F8F7F4] p-5 lg:p-10">
      <div className="max-w-[1500px] mx-auto">
        {/* Header */}

        <div className="flex flex-wrap justify-between gap-5 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-[#1F2A44]">
              Contact Requests
            </h1>

            <p className="text-gray-500 mt-2">Manage all contact inquiries</p>
          </div>

          <button
            onClick={exportExcel}
            className="bg-green-600 text-white px-6 py-4 rounded-xl font-semibold"
          >
            Download Excel
          </button>
        </div>

        {/* Statistics */}

        <div className="grid md:grid-cols-3 gap-5 mb-8">
          <div className="bg-[#1F2A44] text-white p-8 rounded-3xl">
            <p>Total Contacts</p>

            <h2 className="text-5xl font-bold mt-3">{contacts.length}</h2>
          </div>
        </div>

        {/* Search */}

        <div className="bg-white p-5 rounded-3xl shadow mb-8">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border p-4 rounded-xl"
          />
        </div>

        {/* Table */}

        <div className="bg-white rounded-3xl p-6 shadow overflow-auto">
          <table className="w-full min-w-[1400px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-4 text-left">Full Name</th>

                <th className="p-4 text-left">Email</th>

                <th className="p-4 text-left">Phone</th>

                <th className="p-4 text-left">DOB</th>

                <th className="p-4 text-left">Subject</th>

                <th className="p-4 text-left">Message</th>

                <th className="p-4 text-left">Created Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500">
                    No Contacts Found
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{contact.fullName}</td>

                    <td className="p-4">{contact.email}</td>

                    <td className="p-4">{contact.phone}</td>

                    <td className="p-4">{contact.dob}</td>

                    <td className="p-4">{contact.subject}</td>

                    <td className="p-4 max-w-[300px]">
                      <p className="line-clamp-2">{contact.message}</p>
                    </td>

                    <td className="p-4 whitespace-nowrap">
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
  );
}
