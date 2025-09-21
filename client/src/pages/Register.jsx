import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (e) {
      // Prefer backend error message or first validation error
      const apiErr = e.response?.data;
      const firstValidation = Array.isArray(apiErr?.errors) && apiErr.errors.length > 0 ? apiErr.errors[0].msg : '';
      setError(apiErr?.error || firstValidation || 'Registration failed');
      console.error('Register error:', e.response?.data || e.message);
    }
  };

  return (
    <div className="card">
      <h2>Register</h2>
      <form onSubmit={submit}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)} style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 8, background: '#0b1220', color: '#e2e8f0', border: '1px solid #334155' }}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit">Create account</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
