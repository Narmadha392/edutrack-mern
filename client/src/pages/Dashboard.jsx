import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [enrollments, setEnrollments] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [toGrade, setToGrade] = useState([]);
  const [gradeValue, setGradeValue] = useState({}); // submissionId -> score
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role === 'student') {
      api.get('/enrollments/me').then(({ data }) => setEnrollments(data));
      api.get('/assignments/student/pending').then(({ data }) => setPendingAssignments(data)).catch(() => setPendingAssignments([]));
    } else if (user.role === 'instructor' || user.role === 'admin') {
      api.get('/courses/mine').then(({ data }) => setMyCourses(data));
      api.get('/assignments/to-grade').then(({ data }) => setToGrade(data));
    }
  }, [user?.role]);

  const grade = async (submissionId) => {
    setMsg(''); setErr('');
    try {
      const score = parseInt(gradeValue[submissionId] ?? '', 10);
      if (Number.isNaN(score)) return setErr('Please enter a score between 0 and 100');
      await api.patch(`/assignments/grade/${submissionId}`, { score });
      setMsg('Score saved');
      setToGrade((list) => list.filter((s) => s._id !== submissionId));
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to grade');
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}

      {user?.role === 'student' && (
        <>
          <h3>My Courses</h3>
          {enrollments.length === 0 ? (
            <p>You are not enrolled in any courses yet. Go to <Link to="/courses">Courses</Link> and enroll!</p>
          ) : (
            <ul className="list">
              {enrollments.map((enr) => (
                <li key={enr._id} className="list-item">
                  <div>
                    <strong>{enr.course.title}</strong>
                    <p>{enr.course.description}</p>
                  </div>
                  <div>
                    {`${enr.progress.filter(p => p.completed).length}/${enr.progress.length}`} lessons completed
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h3>Pending Assignments</h3>
          {pendingAssignments.length === 0 ? (
            <p className="muted">No pending assignments. Great job!</p>
          ) : (
            <ul className="list">
              {pendingAssignments.map((a) => (
                <li key={a._id} className="list-item">
                  <div>
                    <strong>{a.title}</strong>
                    <p>{a.description}</p>
                    <span className="muted">Due: {new Date(a.dueDate).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {(user?.role === 'instructor' || user?.role === 'admin') && (
        <>
          <h3>My Courses</h3>
          {myCourses.length === 0 ? (
            <p className="muted">No courses yet. Use Create Course to add one.</p>
          ) : (
            <ul className="list">
              {myCourses.map((c) => (
                <li key={c._id} className="list-item">
                  <div>
                    <strong>{c.title}</strong>
                    <p>{c.description}</p>
                  </div>
                  <Link className="btn" to={`/courses/${c._id}`}>Open</Link>
                </li>
              ))}
            </ul>
          )}

          <h3>Submissions to Grade</h3>
          {toGrade.length === 0 ? (
            <p className="muted">No ungraded submissions.</p>
          ) : (
            <ul className="list">
              {toGrade.map((s) => (
                <li key={s._id} className="list-item">
                  <div>
                    <strong>{s.assignment?.title}</strong>
                    <p className="muted">{s.student?.name} · submitted {new Date(s.submittedAt).toLocaleString()}</p>
                    <p style={{ maxWidth: 600 }}>{s.text}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Score"
                      value={gradeValue[s._id] ?? ''}
                      onChange={(e) => setGradeValue((prev) => ({ ...prev, [s._id]: e.target.value }))}
                      style={{ width: 90 }}
                    />
                    <button className="btn" onClick={() => grade(s._id)}>Save</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
