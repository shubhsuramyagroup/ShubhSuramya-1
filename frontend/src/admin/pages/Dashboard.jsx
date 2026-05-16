import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import { auth } from "../../firebase";
import { getProjects } from "../../services/projectService";
import { getArticles } from "../../services/articleService";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const projectData = await getProjects();
      const articleData = await getArticles();

      setProjects(projectData);
      setArticles(articleData);

      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const totalProjects = projects.length;

  const residentialProjects = projects.filter((item) =>
    item.type?.toLowerCase().includes("residential"),
  ).length;

  const commercialProjects = projects.filter((item) =>
    item.type?.toLowerCase().includes("commercial"),
  ).length;

  const upcomingProjects = projects.filter((item) =>
    item.status?.toLowerCase().includes("upcoming"),
  ).length;

  const completedProjects = projects.filter((item) =>
    item.status?.toLowerCase().includes("completed"),
  ).length;

  const totalArticles = articles.length;

  const handleLogout = async () => {
    try {
      await signOut(auth);

      localStorage.removeItem("admin");

      navigate("/admin");
    } catch (error) {
      console.log(error);
    }
  };

  const dashboardCards = [
    {
      title: "Total Projects",
      value: totalProjects,
      bg: "bg-[#1F2A44]",
    },
    {
      title: "Residential",
      value: residentialProjects,
      bg: "bg-[#E4572E]",
    },
    {
      title: "Commercial",
      value: commercialProjects,
      bg: "bg-emerald-600",
    },
    {
      title: "Total Articles",
      value: totalArticles,
      bg: "bg-purple-600",
    },
    {
      title: "Upcoming",
      value: upcomingProjects,
      bg: "bg-orange-500",
    },
    {
      title: "Completed",
      value: completedProjects,
      bg: "bg-blue-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center text-2xl font-semibold text-[#1F2A44]">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] p-5 lg:p-10">
      <div className="max-w-[1450px] mx-auto">
        {/* Header */}

        <div className="flex flex-wrap justify-between items-center gap-5 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1F2A44]">
              Dashboard
            </h1>

            <p className="text-gray-500 mt-2">Manage projects and articles</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link to="/admin/add-project">
              <button className="px-6 py-4 rounded-xl bg-[#E4572E] text-white font-semibold shadow-lg">
                + Add Project
              </button>
            </Link>

            <Link to="/admin/add-article">
              <button className="px-6 py-4 rounded-xl bg-purple-600 text-white font-semibold shadow-lg">
                + Add Article
              </button>
            </Link>

            <button
              onClick={handleLogout}
              className="px-6 py-4 rounded-xl bg-[#1F2A44] text-white font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              className={`${card.bg} rounded-3xl p-8 text-white shadow-lg`}
            >
              <p className="opacity-90">{card.title}</p>

              <h2 className="text-5xl font-bold mt-3">{card.value}</h2>
            </div>
          ))}
        </div>

        {/* Recent Projects */}

        <div className="bg-white rounded-3xl p-8 shadow-md mb-10">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#1F2A44]">
                Recent Projects
              </h2>

              <p className="text-gray-500 mt-2">Latest uploaded projects</p>
            </div>

            <Link to="/admin/projects">
              <button className="px-5 py-3 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50 transition">
                View All
              </button>
            </Link>
          </div>

          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F7F4]">
                  <th className="p-4 text-left">Image</th>

                  <th className="p-4 text-left">Title</th>

                  <th className="p-4 text-left">Type</th>

                  <th className="p-4 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {projects.slice(0, 5).map((project) => (
                  <tr key={project.id} className="border-b">
                    <td className="p-4">
                      <img
                        src={project.mainImage}
                        alt=""
                        className="w-[80px] h-[60px] rounded-xl object-cover"
                      />
                    </td>

                    <td className="p-4 font-semibold">{project.title}</td>

                    <td className="p-4">{project.type}</td>

                    <td className="p-4">{project.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Articles */}

        <div className="bg-white rounded-3xl p-8 shadow-md">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#1F2A44]">
                Recent Articles
              </h2>

              <p className="text-gray-500 mt-2">Latest uploaded articles</p>
            </div>

            <Link to="/admin/articles">
              <button className="border px-5 py-3 rounded-xl font-semibold">
                View All
              </button>
            </Link>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No Articles Found
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {articles.slice(0, 4).map((article) => (
                <div
                  key={article.id}
                  className="border rounded-3xl overflow-hidden"
                >
                  <img
                    src={article.image}
                    alt=""
                    className="w-full h-[180px] object-cover"
                  />

                  <div className="p-5">
                    <span className="bg-orange-100 text-[#E4572E] px-3 py-2 rounded-full text-xs font-semibold">
                      {article.type}
                    </span>

                    <h3 className="font-bold text-lg mt-4 text-[#1F2A44] line-clamp-2">
                      {article.heading}
                    </h3>

                    <p className="text-gray-500 mt-3">{article.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
