// ClassCharts proxy (Cloudflare Worker)
// Deploy: https://dash.cloudflare.com > Workers > Create > paste this code > Deploy
// Set the worker URL in the app Settings as "Proxy URL".
// This hides your credentials from the browser and avoids CORS issues.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/homework' && request.method === 'POST') {
      try {
        const { code, dob } = await request.json();
        if (!code || !dob) return new Response('Missing code/dob', { status: 400 });

        // Login
        const [y,m,d] = dob.split('-');
        const payload = { code, date_of_birth: `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}` };
        const login = await fetch(`https://www.classcharts.com/apiv2/student/${code}/login`, {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
        if (!login.ok) return new Response('Login failed', { status: 401 });
        const data = await login.json();
        const token = data.token;
        if (!token) return new Response('No token', { status: 401 });

        // Homework
        const hw = await fetch(`https://www.classcharts.com/apiv2/student/homeworks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!hw.ok) return new Response('Homework fetch failed', { status: 502 });
        const j = await hw.json();
        const items = (Array.isArray(j) ? j : j.data) || [];
        const out = items.map(x => ({
          title: x.title || x.class_name || 'Homework',
          description: x.description || '',
          due_date: (x.due_date || x.due || (x.due_datetime||'').split('T')[0] || '')
        }));
        return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      } catch (e) {
        return new Response('Error: '+e.message, { status: 500 });
      }
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    return new Response('OK', { status: 200 });
  }
};
