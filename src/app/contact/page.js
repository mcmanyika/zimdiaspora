'use client'
import React, { useState } from 'react'
import withAuth from '../../utils/withAuth'
import Admin from '../../components/layout/Admin'
import { supabase } from '../../lib/supabase/config'
import {  toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.topic || !form.message) {
      setError('Please fill in all fields.');
      toast.error('Please fill in all fields.');
      return;
    }
    setError('');
    setSubmitted(false);
    // Insert into Supabase
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: form.name,
          email: form.email,
          topic: form.topic,
          message: form.message,
          created_at: new Date().toISOString(),
        },
      ]);
    if (dbError) {
      setError('Failed to send message. Please try again.');
      toast.error('Failed to send message. Please try again.');
      return;
    }
    setSubmitted(true);
    setForm({ name: '', email: '', topic: '', message: '' });
    toast.success('Thank you for contacting us!');
  };

  return (
    <Admin>
      <div style={{
        maxWidth: 480,
        margin: '40px auto',
        padding: '32px 28px',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        fontFamily: 'Inter, Arial, sans-serif',
      }}>
        <h2 style={{
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 28,
          marginBottom: 24,
          letterSpacing: '-0.5px',
          color: '#222'
        }}>Contact Us</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 500, color: '#333', marginBottom: 6, display: 'block' }}>Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 16,
                outline: 'none',
                transition: 'border 0.2s',
                boxSizing: 'border-box',
                background: '#fafbfc',
                marginTop: 2,
              }}
              onFocus={e => e.target.style.border = '1.5px solid #6366f1'}
              onBlur={e => e.target.style.border = '1px solid #e0e0e0'}
              placeholder="Your name"
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 500, color: '#333', marginBottom: 6, display: 'block' }}>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 16,
                outline: 'none',
                transition: 'border 0.2s',
                boxSizing: 'border-box',
                background: '#fafbfc',
                marginTop: 2,
              }}
              onFocus={e => e.target.style.border = '1.5px solid #6366f1'}
              onBlur={e => e.target.style.border = '1px solid #e0e0e0'}
              placeholder="you@email.com"
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 500, color: '#333', marginBottom: 6, display: 'block' }}>Topic</label>
            <select
              name="topic"
              value={form.topic}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 16,
                outline: 'none',
                transition: 'border 0.2s',
                boxSizing: 'border-box',
                background: '#fafbfc',
                marginTop: 2,
                color: form.topic ? '#222' : '#888',
                appearance: 'none',
              }}
              onFocus={e => e.target.style.border = '1.5px solid #6366f1'}
              onBlur={e => e.target.style.border = '1px solid #e0e0e0'}
            >
              <option value="" disabled>Select a topic</option>
              <option value="General Inquiry">General Inquiry</option>
              <option value="Support">Support</option>
              <option value="Feedback">Feedback</option>
              <option value="Partnership">Partnership</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontWeight: 500, color: '#333', marginBottom: 6, display: 'block' }}>Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={5}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 16,
                outline: 'none',
                transition: 'border 0.2s',
                boxSizing: 'border-box',
                background: '#fafbfc',
                marginTop: 2,
                resize: 'vertical',
                minHeight: 120,
              }}
              onFocus={e => e.target.style.border = '1.5px solid #6366f1'}
              onBlur={e => e.target.style.border = '1px solid #e0e0e0'}
              placeholder="Type your message here..."
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '13px 0',
              background: 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 17,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
              transition: 'background 0.2s, transform 0.1s',
              marginTop: 6,
            }}
            onMouseOver={e => e.target.style.background = 'linear-gradient(90deg, #4f46e5 0%, #2563eb 100%)'}
            onMouseOut={e => e.target.style.background = 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)'}
          >
            Send Message
          </button>
        </form>
      </div>
    </Admin>
  );
}

export default withAuth(Contact);