import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Project from "./pages/Project";
import Contact from "./pages/Contact";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ScrollToTop from "./components/ScrollToTop";

import AdminLogin from "./admin/pages/AdminLogin";
import ProtectedRoute from "./admin/components/ProtectedRoute";

import Dashboard from "./admin/pages/Dashboard";
import AddProject from "./admin/pages/AddProject";
import AllProjects from "./admin/pages/AllProjects";
import EditProject from "./admin/pages/EditProject";
import AddArticle from "./admin/pages/AddArticle";
import Articles from "./admin/pages/Articles";
import EditArticle from "./admin/pages/EditArticle";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Project />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/project-details/:projectId"
          element={<ProjectDetailPage />}
        />
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/add-project" element={<AddProject />} />
        <Route path="/admin/projects" element={<AllProjects />} />
        <Route path="/admin/edit-project/:id" element={<EditProject />} />
        <Route path="/admin/add-article" element={<AddArticle />} />

        <Route path="/admin/articles" element={<Articles />} />
        <Route path="/admin/edit-article/:id" element={<EditArticle />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
