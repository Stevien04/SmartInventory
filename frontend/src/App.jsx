import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Movimientos from './pages/Movimientos';
import Categorias from './pages/Categorias';
import Proveedores from './pages/Proveedores';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';

function MainApp() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'productos':
        return <Productos userRole={user.rol} />;
      case 'movimientos':
        return <Movimientos />;
      case 'categorias':
        return <Categorias userRole={user.rol} />;
      case 'proveedores':
        return <Proveedores userRole={user.rol} />;
      case 'reportes':
        return <Reportes />;
      case 'usuarios':
        return <Usuarios />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          userRole={user.rol}
        />
        <main className="flex-1 p-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
