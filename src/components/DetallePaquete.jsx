import React, { useState, useMemo } from 'react';
import axios from '../axios';
import ListaCajasPorPaquete from './ListaCajasPorPaquete';

const DetallePaquete = ({ paquete, productos, volver }) => {
  const [seleccionados, setSeleccionados] = useState([]);
  const [refreshCajas, setRefreshCajas] = useState(Date.now());
  const [cajas, setCajas] = useState([]); // Estado para cajas actuales
  const [creando, setCreando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Calculamos la cantidad asignada total por producto a partir de las cajas
  const cantidadesAsignadas = useMemo(() => {
    const asignadas = {};
    productos.forEach(prod => {
      asignadas[prod.nombre_articulo] = 0;
    });
    cajas.forEach(caja => {
      // Buscamos el producto en la descripcion de la caja
      const nombreProducto = productos.find(p => caja.descripcion.includes(p.nombre_articulo))?.nombre_articulo;
      if (nombreProducto) {
        asignadas[nombreProducto] += caja.cantidad_asignada;
      }
    });
    return asignadas;
  }, [productos, cajas]);

  // Función para obtener cantidad disponible real (total - asignada)
  const cantidadDisponibleReal = (nombre_articulo) => {
    const prod = productos.find(p => p.nombre_articulo === nombre_articulo);
    if (!prod) return 0;
    return prod.cantidad - (cantidadesAsignadas[nombre_articulo] || 0);
  };

  const toggleSeleccion = (nombre_articulo) => {
    const existe = seleccionados.find(p => p.nombre_articulo === nombre_articulo);
    if (existe) {
      setSeleccionados(prev => prev.filter(p => p.nombre_articulo !== nombre_articulo));
    } else {
      const prod = productos.find(p => p.nombre_articulo === nombre_articulo);
      setSeleccionados(prev => [...prev, { ...prod, cantidad_asignada: 1 }]);
    }
  };

  const cambiarCantidad = (nombre_articulo, valor) => {
    let cantidad = Number(valor);
    const disponible = cantidadDisponibleReal(nombre_articulo);
    if (cantidad < 1) cantidad = 1;
    if (cantidad > disponible) cantidad = disponible;

    setSeleccionados(prev =>
      prev.map(p =>
        p.nombre_articulo === nombre_articulo ? { ...p, cantidad_asignada: cantidad } : p
      )
    );
  };

  const crearCaja = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (creando) return;

    setCreando(true);

    if (seleccionados.length === 0) {
      alert('Selecciona al menos un producto');
      setCreando(false);
      return;
    }

    // Validar cantidades asignadas respecto a disponible real
    for (const p of seleccionados) {
      const disponible = cantidadDisponibleReal(p.nombre_articulo);
      if (p.cantidad_asignada < 1) {
        alert('La cantidad asignada debe ser al menos 1 en cada producto seleccionado');
        setCreando(false);
        return;
      }
      if (p.cantidad_asignada > disponible) {
        alert(`La cantidad asignada para ${p.nombre_articulo} excede la cantidad disponible (${disponible})`);
        setCreando(false);
        return;
      }
    }

    const descripcion = seleccionados
      .map(p => `${p.nombre_articulo} (${p.unidad})`)
      .join(', ');

    const cantidadTotal = seleccionados.reduce((acc, cur) => acc + cur.cantidad_asignada, 0);
    const numeroCaja = Math.floor(Math.random() * 10000);
    const codigoCaja = `${paquete.nombre_paquete || paquete.id_paquete}-#${numeroCaja}`;

    try {
      const res = await axios.post('/cajas', {
        codigo_caja: codigoCaja,
        descripcion,
        id_paquete: paquete.id_paquete,
        cantidad_asignada: cantidadTotal
      });

      alert(`Caja creada: ${res.data.id_caja}`);
      setRefreshCajas(Date.now());
      setSeleccionados([]);
    } catch (error) {
      console.error('Error creando caja:', error);
      alert('Hubo un error al crear la caja');
    } finally {
      setCreando(false);
    }
  };

  const marcarComoEnviado = async () => {
    if (enviando) return;

    // Validar que para cada producto las cantidades asignadas coincidan con la cantidad total
    for (const prod of productos) {
      const asignado = cantidadesAsignadas[prod.nombre_articulo] || 0;
      if (asignado !== prod.cantidad) {
        alert(`No se puede marcar como enviado: El producto "${prod.nombre_articulo}" tiene ${asignado} asignados pero la cantidad total es ${prod.cantidad}`);
        return;
      }
    }

    setEnviando(true);
    try {
      await axios.put('/paquetes/marcar-enviado', {
        id_paquete: paquete.id_paquete
      });
      alert('Paquete marcado como enviado');
      volver();
    } catch (error) {
      console.error('Error al marcar como enviado:', error);
      alert('No se pudo marcar como enviado');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <h4>Crear caja para: {paquete.nombre_paquete}</h4>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Artículo</th>
            <th>Unidad</th>
            <th>Disponible</th>
            <th>Asignar</th>
            <th>Seleccionar</th>
          </tr>
        </thead>
        <tbody>
          {productos.map(prod => {
            const seleccionado = seleccionados.find(p => p.nombre_articulo === prod.nombre_articulo);
            const disponibleReal = cantidadDisponibleReal(prod.nombre_articulo);

            return (
              <tr key={prod.nombre_articulo}>
                <td>{prod.nombre_articulo}</td>
                <td>{prod.unidad}</td>
                <td>{disponibleReal}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={disponibleReal}
                    disabled={!seleccionado || disponibleReal === 0}
                    value={seleccionado?.cantidad_asignada || ''}
                    onChange={e => cambiarCantidad(prod.nombre_articulo, e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={!!seleccionado}
                    disabled={disponibleReal === 0}
                    onChange={() => toggleSeleccion(prod.nombre_articulo)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        className="btn btn-primary"
        onClick={crearCaja}
        disabled={creando}
      >
        {creando ? 'Creando...' : 'Crear Caja'}
      </button>

      <button className="btn btn-secondary ms-2" onClick={volver}>Cancelar</button>

      <ListaCajasPorPaquete
        idPaquete={paquete.id_paquete}
        refrescarTrigger={refreshCajas}
        setCajas={setCajas}
      />

      <hr />
      <button
        className="btn btn-success mt-3"
        onClick={marcarComoEnviado}
        disabled={enviando}
      >
        {enviando ? 'Enviando...' : 'Marcar como Enviado'}
      </button>
    </div>
  );
};

export default DetallePaquete;
