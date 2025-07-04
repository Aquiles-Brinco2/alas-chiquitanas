import React, { useState } from 'react';
import Modal from 'react-modal';
import '../styles/Donors.css';

Modal.setAppElement('#root');

function DonorFormModal({ isOpen, onClose, onSubmit, formData, setFormData, editMode }) {
  const [errors, setErrors] = useState({});

  // Expresiones regulares
  const soloLetras = /^[a-zA-ZÁÉÍÓÚÑáéíóúñ\s]*$/;
  const soloNumeros = /^\d*$/;
  const letrasYNumeros = /^[a-zA-Z0-9]*$/;

  const handleChange = (field, value, regex, mensajeError) => {
    if (regex.test(value)) {
      setErrors(prev => ({ ...prev, [field]: '' }));
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setErrors(prev => ({ ...prev, [field]: mensajeError }));
    }
  };

  const getInputClass = field => (errors[field] ? 'form-control error' : 'form-control');

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Formulario Donante"
      className="modal-form"
      overlayClassName="modal-overlay"
    >
      <h2>{editMode ? 'Editar Donante' : 'Registrar Donante'}</h2>

      {/* Nombres */}
      <div className="form-group">
        <label>Nombres</label>
        <input
          type="text"
          className={getInputClass('nombres')}
          value={formData.nombres}
          onChange={e =>
            handleChange('nombres', e.target.value, soloLetras, 'Solo se permiten letras y espacios.')
          }
        />
        {errors.nombres && <small className="error-message">{errors.nombres}</small>}
      </div>

      {/* Apellido Paterno */}
      <div className="form-group">
        <label>Apellido Paterno</label>
        <input
          type="text"
          className={getInputClass('apellido_paterno')}
          value={formData.apellido_paterno}
          onChange={e =>
            handleChange('apellido_paterno', e.target.value, soloLetras, 'Solo se permiten letras y espacios.')
          }
        />
        {errors.apellido_paterno && <small className="error-message">{errors.apellido_paterno}</small>}
      </div>

      {/* Apellido Materno */}
      <div className="form-group">
        <label>Apellido Materno</label>
        <input
          type="text"
          className={getInputClass('apellido_materno')}
          value={formData.apellido_materno}
          onChange={e =>
            handleChange('apellido_materno', e.target.value, soloLetras, 'Solo se permiten letras y espacios.')
          }
        />
        {errors.apellido_materno && <small className="error-message">{errors.apellido_materno}</small>}
      </div>

      {/* Correo */}
      <div className="form-group">
        <label>Correo</label>
        <input
          type="email"
          className="form-control"
          value={formData.correo}
          onChange={e => setFormData({ ...formData, correo: e.target.value })}
        />
      </div>

      {/* Teléfono */}
      <div className="form-group">
        <label>Teléfono</label>
        <input
          type="text"
          className={getInputClass('telefono')}
          value={formData.telefono}
          onChange={e =>
            handleChange('telefono', e.target.value, soloNumeros, 'Solo se permiten números.')
          }
        />
        {errors.telefono && <small className="error-message">{errors.telefono}</small>}
      </div>

      {/* Usuario */}
      <div className="form-group">
        <label>Usuario</label>
        <input
          type="text"
          className={getInputClass('usuario')}
          value={formData.usuario}
          onChange={e =>
            handleChange('usuario', e.target.value, letrasYNumeros, 'Solo letras y números sin espacios.')
          }
        />
        {errors.usuario && <small className="error-message">{errors.usuario}</small>}
      </div>

      {/* Contraseña */}
      {!editMode && (
        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            className="form-control"
            value={formData.contraseña_hash}
            onChange={e => setFormData({ ...formData, contraseña_hash: e.target.value })}
          />
        </div>
      )}

      <div className="form-group">
        <button className="btn btn-primary" onClick={onSubmit}>
          {editMode ? 'Guardar Cambios' : 'Registrar Donante'}
        </button>
      </div>
    </Modal>
  );
}

export default DonorFormModal;
