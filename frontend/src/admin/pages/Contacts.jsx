import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { Plus, Pencil, Trash2, Search, Loader2, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  addContact,
  getContacts,
  updateContact,
  deleteContact,
} from "../../services/contactService";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "", // Updated from dob -> dateOfBirth
  subject: "",
  message: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

const formatDate = (date) => {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (date) => {
  if (!date) return "—";
  // Fallback support for Firestore Timestamps if they have a toDate method
  const d = date && typeof date.toDate === "function" ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toDateInputValue = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

/* ---------------- Contact Modal (Add/Edit) ---------------- */
const ContactModal = ({ isOpen, onClose, onSubmit, initialData, mode }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setForm({
          fullName: initialData.fullName || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          dateOfBirth: toDateInputValue(initialData.dateOfBirth), // Updated from dob
          subject: initialData.subject || "",
          message: initialData.message || "",
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
    }
  }, [isOpen, initialData, mode]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!EMAIL_REGEX.test(form.email)) newErrors.email = "Invalid email format";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!PHONE_REGEX.test(form.phone)) newErrors.phone = "Invalid phone number";
    if (!form.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required"; // Updated from dob
    if (!form.subject.trim()) newErrors.subject = "Subject is required";
    if (!form.message.trim()) newErrors.message = "Message is required";
    return newErrors;
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-[fadeIn_0.2s_ease]">
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl animate-[slideUp_0.25s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === "edit" ? "Edit Contact" : "Add Contact"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="flex flex-col">
            <label htmlFor="fullName" className="mb-1.5 text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
              className={`rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                errors.fullName ? "border-red-500" : "border-gray-300 focus:border-blue-500"
              }`}
            />
            {errors.fullName && <span className="mt-1 text-xs text-red-500">{errors.fullName}</span>}
          </div>

          <div className="flex flex-col">
            <label htmlFor="email" className="mb-1.5 text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email address"
              className={`rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                errors.email ? "border-red-500" : "border-gray-300 focus:border-blue-500"
              }`}
            />
            {errors.email && <span className="mt-1 text-xs text-red-500">{errors.email}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="phone" className="mb-1.5 text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91XXXXXXXXXX"
                className={`rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  errors.phone ? "border-red-500" : "border-gray-300 focus:border-blue-500"
                }`}
              />
              {errors.phone && <span className="mt-1 text-xs text-red-500">{errors.phone}</span>}
            </div>

            <div className="flex flex-col">
              <label htmlFor="dateOfBirth" className="mb-1.5 text-sm font-medium text-gray-700">
                Date of Birth *
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth" // Updated from dob
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                className={`rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  errors.dateOfBirth ? "border-red-500" : "border-gray-300 focus:border-blue-500"
                }`}
              />
              {errors.dateOfBirth && <span className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</span>}
            </div>
          </div>

          <div className="flex flex-col">
            <label htmlFor="subject" className="mb-1.5 text-sm font-medium text-gray-700">
              Subject *
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              placeholder="Enter subject"
              className={`rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                errors.subject ? "border-red-500" : "border-gray-300 focus:border-blue-500"
              }`}
            />
            {errors.subject && <span className="mt-1 text-xs text-red-500">{errors.subject}</span>}
          </div>

          <div className="flex flex-col">
            <label htmlFor="message" className="mb-1.5 text-sm font-medium text-gray-700">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              placeholder="Enter message"
              className={`rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none ${
                errors.message ? "border-red-500" : "border-gray-300 focus:border-blue-500"
              }`}
            />
            {errors.message && <span className="mt-1 text-xs text-red-500">{errors.message}</span>}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting
                ? mode === "edit"
                  ? "Saving..."
                  : "Adding..."
                : mode === "edit"
                ? "Save Changes"
                : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- Delete Confirmation Modal ---------------- */
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-[fadeIn_0.2s_ease]">
      <div
        className="w-full max-w-sm rounded-xl bg-white shadow-2xl animate-[slideUp_0.25s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Delete Contact</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600">Are you sure you want to delete this contact?</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 flex items-center gap-2"
          >
            {deleting && <Loader2 size={16} className="animate-spin" />}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Main Contacts Page ---------------- */
const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getContacts();
      setContacts(data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;
    const term = searchTerm.toLowerCase();
    return contacts.filter(
      (c) =>
        c.fullName?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.subject?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.projectName?.toLowerCase().includes(term) || // Support search parameters on project data
        c.source?.toLowerCase().includes(term)
    );
  }, [contacts, searchTerm]);

  /* Add */
  const handleAddContact = useCallback(async (formData) => {
    try {
      const docRef = await addContact(formData);
      const newContact = {
        id: docRef.id,
        ...formData,
        dateOfBirth: formData.dateOfBirth, // Maintained string layout consistent with Firestore
        createdAt: new Date(),
      };
      setContacts((prev) => [newContact, ...prev]);
      setIsAddModalOpen(false);
      toast.success("Contact added successfully!");
    } catch (error) {
      console.error("Error adding contact:", error);
      toast.error("Failed to add contact.");
    }
  }, []);

  /* Edit */
  const openEditModal = useCallback((contact) => {
    setSelectedContact(contact);
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateContact = useCallback(
    async (formData) => {
      if (!selectedContact) return;
      try {
        await updateContact(selectedContact.id, formData);
        setContacts((prev) =>
          prev.map((c) =>
            c.id === selectedContact.id
              ? { ...c, ...formData }
              : c
          )
        );
        setIsEditModalOpen(false);
        setSelectedContact(null);
        toast.success("Contact updated successfully!");
      } catch (error) {
        console.error("Error updating contact:", error);
        toast.error("Failed to update contact.");
      }
    },
    [selectedContact]
  );

  /* Delete */
  const openDeleteModal = useCallback((contact) => {
    setSelectedContact(contact);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteContact = useCallback(async () => {
    if (!selectedContact) return;
    const prevContacts = contacts;
    setContacts((prev) => prev.filter((c) => c.id !== selectedContact.id));
    try {
      await deleteContact(selectedContact.id);
      toast.success("Contact deleted successfully!");
      setIsDeleteModalOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error("Error deleting contact:", error);
      setContacts(prevContacts);
      toast.error("Failed to delete contact.");
    }
  }, [selectedContact, contacts]);

  /* Excel Export */
  const handleExport = useCallback(() => {
    const exportData = filteredContacts.map((c) => ({
      "Full Name": c.fullName,
      Email: c.email,
      Phone: c.phone,
      "Date of Birth": formatDate(c.dateOfBirth), // Updated key structure
      "Project Name": c.projectName || "—",       // Added sheet properties
      Source: c.source || "—",
      Subject: c.subject,
      Message: c.message,
      "Created Date": formatDateTime(c.createdAt),
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    XLSX.writeFile(workbook, `contacts_${new Date().toISOString().split("T")[0]}.xlsx`);
  }, [filteredContacts]);

  return (
    <div className="p-4 sm:p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all contact form submissions</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
        >
          <Plus size={18} />
          Add Contact
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Total Contacts</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{contacts.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Filtered Contacts</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{filteredContacts.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Search Results</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {searchTerm ? filteredContacts.length : 0}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, project, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleExport}
          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Export to Excel
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-500">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-gray-500">
            <p className="text-sm">No contacts found.</p>
          </div>
        ) : (
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Full Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Phone</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">DOB</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Project Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Source</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Subject</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Message</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Created At</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="border-t border-gray-100 transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{contact.fullName}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{contact.email}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{contact.phone}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(contact.dateOfBirth)}</td>
                  <td className="px-4 py-3 text-blue-600 font-medium whitespace-nowrap">{contact.projectName || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${
                      contact.source === "Brochure Download" ? "bg-orange-50 text-orange-600" : "bg-purple-50 text-purple-600"
                    }`}>
                      {contact.source || "Form Submission"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{contact.subject}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-gray-600" title={contact.message}>{contact.message}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(contact.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(contact)}
                        title="Edit"
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-600 transition-transform hover:scale-105 hover:bg-blue-200"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(contact)}
                        title="Delete"
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-600 transition-transform hover:scale-105 hover:bg-red-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <ContactModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddContact}
        mode="add"
      />

      <ContactModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedContact(null);
        }}
        onSubmit={handleUpdateContact}
        initialData={selectedContact}
        mode="edit"
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedContact(null);
        }}
        onConfirm={handleDeleteContact}
      />
    </div>
  );
};

export default Contacts;