import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/courses').then(({ data }) => setCourses(data));
  }, []);

  const search = async (e) => {
    e.preventDefault();
    const { data } = await api.get('/courses', { params: { q } });
    setCourses(data);
  };

  return (
    <div>
      <h2>Courses</h2>
      <form onSubmit={search} className="row">
        <input placeholder="Search courses" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn">Search</button>
      </form>
      <ul className="grid">
        {courses.map((c) => (
          <li key={c._id} className="card">
            <h3>{c.title}</h3>
            <p>{c.description}</p>
            <p className="muted">By {c.instructor?.name || 'Unknown'}</p>
            <Link className="btn" to={`/courses/${c._id}`}>View</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
