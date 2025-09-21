import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api.js';

export default function CreateCourse() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [lessons, setLessons] = useState([{ title: '', content: '' }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'instructor' && user.role !== 'admin') return <p className="error">Only instructors can create courses.</p>;

  const updateLesson = (idx, field, value) => {
    const copy = lessons.slice();
    copy[idx] = { ...copy[idx], [field]: value };
    setLessons(copy);
  };

  const addLesson = () => setLessons([...lessons, { title: '', content: '' }]);
  const removeLesson = (idx) => setLessons(lessons.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = {
        title,
        description,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        lessons: lessons.filter(l => l.title && l.content)
      };
      const { data } = await api.post('/courses', payload);
      setSuccess('Course created!');
      setTitle('');
      setDescription('');
      setTags('');
      setLessons([{ title: '', content: '' }]);
      // Optionally navigate to course detail
      // navigate(`/courses/${data._id}`);
    } catch (e) {
      const apiErr = e.response?.data;
      const firstValidation = Array.isArray(apiErr?.errors) && apiErr.errors.length > 0 ? apiErr.errors[0].msg : '';
      setError(apiErr?.error || firstValidation || 'Failed to create course');
      console.error('Create course error:', e.response?.data || e.message);
    }
  };

  return (
    <div className="card">
      <h2>Create Course</h2>
      <form onSubmit={submit}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          <h3>Lessons</h3>
          {lessons.map((l, idx) => (
            <div key={idx} className="card" style={{ padding: 12 }}>
              <input placeholder={`Lesson ${idx + 1} Title`} value={l.title} onChange={(e) => updateLesson(idx, 'title', e.target.value)} />
              <input placeholder={`Lesson ${idx + 1} Content`} value={l.content} onChange={(e) => updateLesson(idx, 'content', e.target.value)} />
              {lessons.length > 1 && (
                <button type="button" className="btn" onClick={() => removeLesson(idx)}>
                  Remove Lesson
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn" onClick={addLesson}>Add Lesson</button>
        </div>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button className="btn" type="submit">Create</button>
      </form>
    </div>
  );
}
