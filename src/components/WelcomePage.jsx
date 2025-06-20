import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/WelcomePage.css';
import MetricasWebSocketListener from './MetricasWebSocketListener';

function WelcomePage({ onLogout }) {
  const [donantesCount, setDonantesCount] = useState(0);
  const [donacionesCount, setDonacionesCount] = useState(0);
  const [inventarioCount, setInventarioCount] = useState(0);
  const [usuario, setUsuario] = useState({});
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarModalCambio, setMostrarModalCambio] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [errorCambio, setErrorCambio] = useState('');
  const [cambiarPassword, setCambiarPassword] = useState(false);

  useEffect(() => {
    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
    if (usuarioGuardado) {
      setUsuario(usuarioGuardado);
    }

    const cambiarPassFlag = localStorage.getItem('cambiarPassword');
    if (cambiarPassFlag === 'true') {
      setCambiarPassword(true);
      setMostrarModalCambio(true);
    }

    // Cargar métricas solo una vez
    axios.get('/donantes')
      .then(response => setDonantesCount(response.data.length))
      .catch(error => console.error('Error fetching donantes:', error));

    axios.get('/donaciones')
      .then(response => setDonacionesCount(response.data.length))
      .catch(error => console.error('Error fetching donaciones:', error));

    axios.get('/donaciones-en-especie')
      .then(response => setInventarioCount(response.data.length))
      .catch(error => console.error('Error fetching inventario:', error));
  }, []);

  // Para manejar notificaciones
  const manejarNuevaNotificacion = (mensaje) => {
    const timestamp = new Date().toISOString();
    const nuevaNotificacion = typeof mensaje === 'string'
      ? {
          id: Date.now(),
          titulo: 'Notificación',
          descripcion: mensaje,
          nivelSeveridad: 'Media',
          fechaCreacion: timestamp,
        }
      : {
          ...mensaje,
          id: mensaje.id || Date.now(),
          fechaCreacion: mensaje.fechaCreacion || timestamp,
        };
  
    setNotificaciones((prev) => [nuevaNotificacion, ...prev]);
  };

  // Cambiar contraseña
  const handleCambioPassword = async () => {
    setErrorCambio('');
    if (nuevaPassword.length < 6) {
      setErrorCambio('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      await axios.put(`/users/${usuario.id}/password`, { newPassword: nuevaPassword });
      
      alert('Contraseña cambiada correctamente, ya puedes continuar.');
      setMostrarModalCambio(false);
      setCambiarPassword(false);
      localStorage.setItem('cambiarPassword', 'false');
      setNuevaPassword('');
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setErrorCambio('No se pudo cambiar la contraseña. Intente nuevamente.');
    }
  };

  // Volver a login (logout)
  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout(); // Si tienes callback para logout que te lleve al login
    else window.location.href = '/login'; // O redirige directamente
  };

  // Función para traducir número de rol a texto
  const getRolNombre = (rol) => {
    switch (rol) {
      case 1: return 'Administrador';
      case 2: return 'Usuario';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="welcome-container">
      <MetricasWebSocketListener onNuevaNotificacion={manejarNuevaNotificacion} />

      <div className="welcome-header-card">
        <div className="welcome-avatar">
          <img src="user.png" alt="Usuario" />
        </div>
        <div className="welcome-info">
          <h1>¡Bienvenido, {usuario.nombres || 'Usuario'}!</h1>
          <p><strong>Correo:</strong> {usuario.correo}</p>
          <p><strong>Rol:</strong> {getRolNombre(usuario.rol)}</p>
        </div>
      </div>

      <div className="welcome-content">
        <div className="welcome-cards">
          <div className="welcome-card">
            <h3>Donaciones</h3>
            <p>Total de donaciones recibidas: {donacionesCount}</p>
          </div>
          <div className="welcome-card">
            <h3>Inventario</h3>
            <p>Artículos en inventario: {inventarioCount}</p>
          </div>
          <div className="welcome-card">
            <h3>Donantes</h3>
            <p>Donantes registrados: {donantesCount}</p>
          </div>
        </div>
      </div>

      {/* Notificaciones Card */}
      <div className="notificaciones-container">
        <h3>Notificaciones recientes</h3>
        <div className="notificaciones-scroll">
          {notificaciones.length === 0 && <p>No hay notificaciones</p>}
          {notificaciones.map((notif) => {
            const claseSeveridad = notif.nivelSeveridad
              ? `severidad-${notif.nivelSeveridad.toLowerCase()}`
              : '';
            return (
              <div
                key={notif.id || notif.hora}
                className={`notificacion-card ${claseSeveridad}`}
              >
                <h4>{notif.titulo || 'Notificación'}</h4>
                <p>{notif.descripcion || notif.mensaje}</p>
                <span>
                  {notif.fechaCreacion
                    ? new Date(notif.fechaCreacion).toLocaleString()
                    : notif.hora}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal para cambio obligatorio de contraseña */}
      {mostrarModalCambio && (
        <div className="modal-backdrop">
          <div className="modal-cambio-password">
            <h2>Cambio obligatorio de contraseña</h2>
            <p>Debes cambiar tu contraseña antes de continuar.</p>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
            />
            {errorCambio && <p className="error">{errorCambio}</p>}
            <button onClick={handleCambioPassword}>Cambiar Contraseña</button>
            <button onClick={handleLogout} className="btn-secondary">Volver al Login</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WelcomePage;
