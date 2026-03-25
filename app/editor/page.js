import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import EditorClient from "./EditorClient";

export default async function EditorPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="glass-panel" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
          STUDIO <span style={{ color: 'var(--primary-color)' }}>AI</span>
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{session.user.email}</span>
          {session.user.role === 'ADMIN' && (
            <a href="/admin" style={{ fontSize: '0.9rem', color: 'var(--text-main)', textDecoration: 'underline' }}>Admin</a>
          )}
        </div>
      </header>
      
      <main style={{ flex: 1, padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <EditorClient />
      </main>
    </div>
  );
}
