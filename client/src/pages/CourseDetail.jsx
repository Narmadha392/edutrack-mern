import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api.js';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [assignments, setAssignments] = useState([]);
  const [aTitle, setATitle] = useState('');
  const [aDesc, setADesc] = useState('');
  const [aDue, setADue] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [submitText, setSubmitText] = useState('');

  useEffect(() => {
    api.get(`/courses/${id}`).then(({ data }) => setCourse(data));
    api.get('/enrollments/me')
      .then(({ data }) => setEnrolled(data.some((e) => e.course._id === id)))
      .catch(() => setEnrolled(false));
    api.get(`/assignments/course/${id}`).then(({ data }) => setAssignments(data)).catch(() => setAssignments([]));
  }, [id]);

  const enroll = async () => {
    await api.post(`/enrollments/${id}`);
    setEnrolled(true);
    const { data } = await api.get(`/courses/${id}`);
    setCourse(data);
  };

  const completeLesson = async (lessonIndex) => {
    await api.patch(`/enrollments/${id}/progress/${lessonIndex}`);
    const { data } = await api.get(`/courses/${id}`);
    setCourse(data);
  };

  if (!course) return <p>Loading...</p>;

  return (
    <div>
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      {!enrolled ? (
        <button className="btn" onClick={enroll}>Enroll</button>
      ) : (
        <p className="success">Enrolled</p>
      )}
      {(user?.role === 'instructor' || user?.role === 'admin') && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Enrolled Students</h3>
          {course.students?.length ? (
            <ul className="list">
              {course.students.map((s) => (
                <li key={s._id} className="list-item">
                  <span>{s.name}</span>
                  <span className="muted">{s.email}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No students enrolled yet.</p>
          )}
        </div>
      )}
      <h3>Lessons</h3>
      <ol className="list">
        {course.lessons?.map((l, idx) => (
          <li key={idx} className="list-item">
            <div>
              <strong>{l.title}</strong>
              <p>{l.content}</p>
            </div>
            {enrolled && (
              <button className="btn" onClick={() => completeLesson(idx)}>Mark complete</button>
            )}
          </li>
        ))}
      </ol>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Assignments</h3>
        {assignments.length === 0 ? (
          <p className="muted">No assignments yet.</p>
        ) : (
          <ul className="list">
            {assignments.map((a) => (
              <li key={a._id} className="list-item">
                <div>
                  <strong>{a.title}</strong>
                  <p>{a.description}</p>
                  <span className="muted">Due: {new Date(a.dueDate).toLocaleString()}</span>
                </div>
                {(user?.role === 'instructor' || user?.role === 'admin') && (
                  <button className="btn" onClick={async () => {
                    const { data } = await api.get(`/assignments/submissions/${a._id}`);
                    setSubmissions(data);
                  }}>View submissions</button>
                )}
              </li>
            ))}
          </ul>
        )}
        {(user?.role === 'instructor' || user?.role === 'admin') && (
          <div className="card" style={{ marginTop: 12 }}>
            <h4>Create assignment</h4>
            <input placeholder="Title" value={aTitle} onChange={(e) => setATitle(e.target.value)} />
            <input placeholder="Description" value={aDesc} onChange={(e) => setADesc(e.target.value)} />
            <input type="datetime-local" value={aDue} onChange={(e) => setADue(e.target.value)} />
            <button className="btn" onClick={async () => {
              await api.post(`/assignments/course/${id}`, { title: aTitle, description: aDesc, dueDate: aDue });
              setATitle(''); setADesc(''); setADue('');
              const { data } = await api.get(`/assignments/course/${id}`);
              setAssignments(data);
            }}>Create</button>
          </div>
        )}
        {enrolled && (
          <div className="card" style={{ marginTop: 12 }}>
            <h4>Submit assignment (paste text)</h4>
            <select onChange={(e) => setSubmitText((t) => t)} style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 8, background: '#0b1220', color: '#e2e8f0', border: '1px solid #334155', display: 'none' }} />
            <input placeholder="Paste your response here" value={submitText} onChange={(e) => setSubmitText(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {assignments.map((a) => (
                <button key={a._id} className="btn" onClick={async () => {
                  await api.post(`/assignments/submit/${a._id}`, { text: submitText });
                  setSubmitText('');
                }}>Submit for: {a.title}</button>
              ))}
            </div>
          </div>
        )}
        {(user?.role === 'instructor' || user?.role === 'admin') && submissions.length > 0 && (
          <div className="card" style={{ marginTop: 12 }}>
            <h4>Submissions</h4>
            <ul className="list">
              {submissions.map((s) => (
                <li key={s._id} className="list-item">
                  <strong>{s.student?.name}</strong>
                  <span className="muted">{new Date(s.createdAt || s.submittedAt).toLocaleString()}</span>
                  <p>{s.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
