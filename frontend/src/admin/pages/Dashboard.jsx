import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import * as XLSX from "xlsx";

import { auth } from "../../firebase";

import { getProjects } from "../../services/projectService";
import { getArticles } from "../../services/articleService";
import { getContacts } from "../../services/contactService";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [articles, setArticles] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        projectData,
        articleData,
        contactData,
      ] = await Promise.all([
        getProjects(),
        getArticles(),
        getContacts(),
      ]);

      setProjects(projectData);
      setArticles(articleData);
      setContacts(contactData);

      setLoading(false);

    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const exportExcel = () => {
    const data = contacts.map((item) => ({
      FullName: item.fullName,
      Email: item.email,
      Phone: item.phone,
      DOB: item.dob,
      Subject: item.subject,
      Message: item.message,
    }));

    const worksheet =
      XLSX.utils.json_to_sheet(data);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Contacts"
    );

    XLSX.writeFile(
      workbook,
      "contacts.xlsx"
    );
  };

  const handleLogout = async () => {
    await signOut(auth);

    localStorage.removeItem(
      "admin"
    );

    navigate("/admin");
  };

  const dashboardCards = [
    {
      title: "Projects",
      value: projects.length,
      bg: "bg-[#1F2A44]",
    },
    {
      title: "Articles",
      value: articles.length,
      bg: "bg-purple-600",
    },
    {
      title: "Contacts",
      value: contacts.length,
      bg: "bg-green-600",
    },
    {
      title: "Residential",
      value: projects.filter((p) =>
        p.type?.toLowerCase()
          .includes("residential")
      ).length,
      bg: "bg-[#E4572E]",
    },
    {
      title: "Commercial",
      value: projects.filter((p) =>
        p.type?.toLowerCase()
          .includes("commercial")
      ).length,
      bg: "bg-blue-600",
    },
    {
      title: "Upcoming",
      value: projects.filter((p) =>
        p.status?.toLowerCase()
          .includes("upcoming")
      ).length,
      bg: "bg-orange-500",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl font-bold">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] p-5 lg:p-10">

      <div className="max-w-[1500px] mx-auto">

        {/* HEADER */}

        <div className="flex flex-wrap justify-between gap-5 mb-10">

          <div>
            <h1 className="text-5xl font-bold text-[#1F2A44]">
              Dashboard
            </h1>

            <p className="text-gray-500 mt-2">
              Manage Projects, Articles and Contacts
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <Link to="/admin/add-project">
              <button className="bg-[#E4572E] text-white px-6 py-4 rounded-xl">
                + Add Project
              </button>
            </Link>

            <Link to="/admin/add-article">
              <button className="bg-purple-600 text-white px-6 py-4 rounded-xl">
                + Add Article
              </button>
            </Link>

            <Link to="/admin/contacts">
              <button className="bg-green-600 text-white px-6 py-4 rounded-xl">
                Contacts
              </button>
            </Link>

            <button
              onClick={handleLogout}
              className="bg-[#1F2A44] text-white px-6 py-4 rounded-xl"
            >
              Logout
            </button>

          </div>

        </div>

        {/* STATS CARDS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">

          {dashboardCards.map((card, index) => (

            <div
              key={index}
              className={`${card.bg} rounded-3xl p-8 text-white`}
            >
              <p>{card.title}</p>

              <h2 className="text-5xl font-bold mt-4">
                {card.value}
              </h2>

            </div>

          ))}

        </div>

        {/* RECENT CONTACTS */}

        <div className="bg-white p-8 rounded-3xl shadow">

          <div className="flex justify-between items-center mb-8">

            <div>
              <h2 className="text-3xl font-bold text-[#1F2A44]">
                Recent Contacts
              </h2>

              <p className="text-gray-500">
                Latest contact requests
              </p>
            </div>

            <div className="flex gap-3">

              <Link to="/admin/contacts">
                <button className="border px-5 py-3 rounded-xl">
                  View All
                </button>
              </Link>

              <button
                onClick={exportExcel}
                className="bg-green-600 text-white px-5 py-3 rounded-xl"
              >
                Download Excel
              </button>

            </div>

          </div>

          <div className="overflow-auto">

            <table className="w-full">

              <thead>

                <tr className="bg-gray-100">

                  <th className="p-4 text-left">
                    Name
                  </th>

                  <th className="p-4 text-left">
                    Email
                  </th>

                  <th className="p-4 text-left">
                    Phone
                  </th>

                  <th className="p-4 text-left">
                    Subject
                  </th>

                </tr>

              </thead>

              <tbody>

                {contacts.slice(0,5).map((contact)=>(

                  <tr
                    key={contact.id}
                    className="border-b"
                  >
                    <td className="p-4">
                      {contact.fullName}
                    </td>

                    <td className="p-4">
                      {contact.email}
                    </td>

                    <td className="p-4">
                      {contact.phone}
                    </td>

                    <td className="p-4">
                      {contact.subject}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* RECENT PROJECTS */}

        <div className="bg-white p-8 rounded-3xl shadow mt-10">

          <div className="flex justify-between items-center mb-8">

            <div>
              <h2 className="text-3xl font-bold text-[#1F2A44]">
                Recent Projects
              </h2>

              <p className="text-gray-500">
                Latest uploaded projects
              </p>
            </div>

            <Link to="/admin/projects">
              <button className="border px-5 py-3 rounded-xl">
                View All
              </button>
            </Link>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

            {projects.slice(0,4).map((project)=>(

              <div
                key={project.id}
                className="border rounded-2xl overflow-hidden"
              >
                <img
                  src={project.mainImage}
                  alt={project.title}
                  className="w-full h-[180px] object-cover"
                />

                <div className="p-5">

                  <span className="bg-[#E4572E]/10 text-[#E4572E] px-3 py-1 rounded-full text-xs font-semibold">
                    {project.type}
                  </span>

                  <h3 className="font-bold mt-4 text-[#1F2A44] line-clamp-2">
                    {project.title}
                  </h3>

                  <p className="text-gray-500 mt-3">
                    {project.status}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* RECENT ARTICLES */}

        <div className="bg-white p-8 rounded-3xl shadow mt-10">

          <div className="flex justify-between items-center mb-8">

            <div>
              <h2 className="text-3xl font-bold text-[#1F2A44]">
                Recent Articles
              </h2>

              <p className="text-gray-500">
                Latest uploaded articles
              </p>
            </div>

            <Link to="/admin/articles">
              <button className="border px-5 py-3 rounded-xl">
                View All
              </button>
            </Link>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

            {articles.slice(0,4).map((article)=>(

              <div
                key={article.id}
                className="border rounded-2xl overflow-hidden"
              >
                <img
                  src={article.image}
                  alt={article.heading}
                  className="w-full h-[180px] object-cover"
                />

                <div className="p-5">

                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                    {article.type}
                  </span>

                  <h3 className="font-bold mt-4 text-[#1F2A44] line-clamp-2">
                    {article.heading}
                  </h3>

                  <p className="text-gray-500 mt-3">
                    {article.date}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>
  );
}