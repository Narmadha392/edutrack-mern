import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Courses from './pages/Courses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import CreateCourse from './pages/CreateCourse.jsx';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  return (
    <nav className="nav">
      <Link to="/" className="logo">EduTrack</Link>
      <div className="spacer" />
      <Link to="/courses">Courses</Link>
      {(user?.role === 'instructor' || user?.role === 'admin') && (
        <Link to="/create-course">Create Course</Link>
      )}
      {user ? (
        <>
          <Link to="/">Dashboard</Link>
          <span className="muted" style={{ marginLeft: 8 }}>({user.name} · {user.role})</span>
          <button onClick={logout} className="btn">Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/create-course" element={<PrivateRoute><CreateCourse /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  );
}
