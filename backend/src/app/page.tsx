"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Activity, Server, Box, ShoppingCart, Info, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

const endpoints = [
  {
    id: 'health',
    method: 'GET',
    path: '/api/health',
    description: 'Checks the health and uptime of the Next.js API and database connections.',
    icon: <Activity size={18} />
  },
  {
    id: 'catalog',
    method: 'GET',
    path: '/api/catalog',
    description: 'Retrieves the complete product catalog including categories and featured items.',
    icon: <Box size={18} />
  },
  {
    id: 'product-details',
    method: 'GET',
    path: '/api/products/1',
    description: 'Fetches detailed information for a specific product by its ID.',
    icon: <Info size={18} />
  },
  {
    id: 'create-order',
    method: 'POST',
    path: '/api/orders',
    description: 'Creates a new order in the system with the provided cart items.',
    body: '{\n  "customerName": "John Doe",\n  "customerPhone": "+1234567890",\n  "items": [\n    { "productId": 1, "quantity": 2, "price": 150 }\n  ],\n  "subtotal": 300,\n  "shippingFee": 15,\n  "total": 315\n}',
    icon: <ShoppingCart size={18} />
  }
];

export default function ApiExplorer() {
  const [activeEndpoint, setActiveEndpoint] = useState(endpoints[0]);
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestBody, setRequestBody] = useState(endpoints[0].body || '');

  // Update body when endpoint changes
  useEffect(() => {
    setRequestBody(activeEndpoint.body || '');
    setResponse(null);
    setStatus(null);
  }, [activeEndpoint]);

  const handleTest = async () => {
    setLoading(true);
    setResponse(null);
    setStatus(null);
    const start = Date.now();

    try {
      const options: RequestInit = {
        method: activeEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };
      
      if (activeEndpoint.method !== 'GET' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(activeEndpoint.path, options);
      setStatus(res.status);
      
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setResponse(JSON.stringify(json, null, 2));
      } catch (e) {
        setResponse(text);
      }
    } catch (err: any) {
      setStatus(500);
      setResponse(err.message || 'Network Error');
    } finally {
      setLoading(false);
    }
  };

  const syntaxHighlight = (jsonStr: string) => {
    if (!jsonStr) return null;
    try {
      // Very basic syntax highlighting replacement for valid JSON
      JSON.parse(jsonStr); 
      return jsonStr.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function (match) {
          let cls = 'json-number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'json-key';
            } else {
              cls = 'json-string';
            }
          } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
          } else if (/null/.test(match)) {
            cls = 'json-null';
          }
          return `<span class="${cls}">${match}</span>`;
        }
      );
    } catch {
      return jsonStr; // return raw if not valid json
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Sidebar */}
      <aside style={{
        width: '320px',
        backgroundColor: 'var(--surface-color)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--accent-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-color)'
          }}>
            <Server size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Esiarko API</h1>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Next.js Backend v1.0</p>
          </div>
        </div>

        <div style={{ padding: '20px 16px', flex: 1, overflowY: 'auto' }}>
          <h2 style={{ 
            fontSize: '11px', 
            textTransform: 'uppercase', 
            letterSpacing: '1px', 
            color: 'var(--text-secondary)',
            marginBottom: '16px',
            paddingLeft: '8px'
          }}>
            Available Endpoints
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {endpoints.map(ep => (
              <button
                key={ep.id}
                onClick={() => setActiveEndpoint(ep)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeEndpoint.id === ep.id ? 'var(--surface-hover)' : 'transparent',
                  color: activeEndpoint.id === ep.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {activeEndpoint.id === ep.id && (
                  <motion.div 
                    layoutId="active-indicator"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      backgroundColor: 'var(--accent-color)'
                    }}
                  />
                )}
                <span style={{ 
                  color: activeEndpoint.id === ep.id ? 'var(--accent-color)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {ep.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{ep.path}</div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: ep.method === 'GET' ? 'var(--method-get)' : 'var(--method-post)',
                    fontWeight: 600,
                    marginTop: '4px'
                  }}>{ep.method}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          padding: '32px 48px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-color)',
        }}>
          <motion.div
            key={activeEndpoint.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <span style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: activeEndpoint.method === 'GET' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(96, 165, 250, 0.1)',
                color: activeEndpoint.method === 'GET' ? 'var(--method-get)' : 'var(--method-post)',
              }}>
                {activeEndpoint.method}
              </span>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px' }}>
                {activeEndpoint.path}
              </h2>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, maxWidth: '800px' }}>
              {activeEndpoint.description}
            </p>
          </motion.div>
        </header>

        <div style={{ flex: 1, padding: '32px 48px', overflowY: 'auto', display: 'flex', gap: '32px' }}>
          {/* Request Section */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '50%' }}>
            <div>
              <h3 style={{ fontSize: '14px', margin: '0 0 16px 0', color: 'var(--text-secondary)' }}>Parameters / Body</h3>
              {activeEndpoint.method !== 'GET' ? (
                <div style={{
                  backgroundColor: 'var(--surface-color)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden'
                }}>
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '200px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      padding: '16px',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div style={{
                  padding: '24px',
                  backgroundColor: 'var(--surface-color)',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  No request body required for this GET request.
                </div>
              )}
            </div>

            <button
              onClick={handleTest}
              disabled={loading}
              style={{
                padding: '16px 24px',
                backgroundColor: 'var(--accent-color)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 14px var(--accent-glow)'
              }}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ display: 'flex' }}
                >
                  <Activity size={18} />
                </motion.div>
              ) : (
                <Play size={18} fill="#000" />
              )}
              {loading ? 'Sending Request...' : 'Send Request'}
            </button>
          </div>

          {/* Response Section */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 16px 0', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Response</span>
              {status && (
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  color: status < 400 ? 'var(--method-get)' : 'var(--method-delete)',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  {status < 400 ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {status} {status === 200 ? 'OK' : ''}
                </span>
              )}
            </h3>
            <div style={{
              flex: 1,
              backgroundColor: 'var(--surface-color)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {!response && !loading && (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{ opacity: 0.2 }}><Activity size={48} /></div>
                  Hit "Send Request" to view the response
                </div>
              )}
              
              {loading && (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-color)'
                }}>
                   <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                     <Activity size={32} />
                   </motion.div>
                </div>
              )}

              {response && !loading && (
                <pre style={{
                  margin: 0,
                  padding: '20px',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  flex: 1
                }}>
                  <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(response) || response }} />
                </pre>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
