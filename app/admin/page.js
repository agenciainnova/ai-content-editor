import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect("/login");
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true }
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Admin Dashboard</h1>
        <a href="/editor" className="btn-primary">Go to Editor</a>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>User Management</h2>
        
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 8px' }}>Email</th>
              <th style={{ padding: '12px 8px' }}>Role</th>
              <th style={{ padding: '12px 8px' }}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 8px' }}>{u.email}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ 
                    background: u.role === 'ADMIN' ? 'rgba(255, 42, 95, 0.2)' : 'rgba(255,255,255,0.1)', 
                    padding: '4px 10px', 
                    borderRadius: '100px',
                    fontSize: '0.8rem',
                    color: u.role === 'ADMIN' ? 'var(--primary-color)' : 'var(--text-muted)'
                  }}>{u.role}</span>
                </td>
                <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
