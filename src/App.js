import React, { useState, useEffect } from 'react';
import { Mail, DollarSign, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function CobrApp() {
  const [currentView, setCurrentView] = useState('landing');
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    numeroFactura: '',
    monto: '',
    fechaVencimiento: '',
    emailCliente: '',
    nombreCliente: ''
  });

  // Cargar facturas desde Supabase
  useEffect(() => {
    cargarFacturas();
  }, []);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('facturas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFacturas(data || []);
    } catch (error) {
      console.error('Error cargando facturas:', error);
      alert('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoFactura = (fechaVencimiento) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffDias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

    if (diffDias > 3) return { estado: 'pendiente', dias: diffDias, color: 'text-blue-600' };
    if (diffDias > 0) return { estado: 'por_vencer', dias: diffDias, color: 'text-yellow-600' };
    if (diffDias === 0) return { estado: 'vence_hoy', dias: 0, color: 'text-orange-600' };
    return { estado: 'vencida', dias: Math.abs(diffDias), color: 'text-red-600' };
  };

  const handleSubmit = async () => {
    if (!formData.nombreCliente || !formData.numeroFactura || !formData.monto || 
        !formData.fechaVencimiento || !formData.emailCliente) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('facturas')
        .insert([
          {
            numero_factura: formData.numeroFactura,
            monto: parseFloat(formData.monto),
            fecha_vencimiento: formData.fechaVencimiento,
            email_cliente: formData.emailCliente,
            nombre_cliente: formData.nombreCliente,
            pagada: false
          }
        ])
        .select();

      if (error) throw error;

      alert('¡Factura creada! Los recordatorios se enviarán automáticamente.');
      
      setFormData({
        numeroFactura: '',
        monto: '',
        fechaVencimiento: '',
        emailCliente: '',
        nombreCliente: ''
      });

      await cargarFacturas();
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error creando factura:', error);
      alert('Error al crear factura: ' + error.message);
    }
  };

  const marcarComoPagada = async (id) => {
    try {
      const { error } = await supabase
        .from('facturas')
        .update({ pagada: true })
        .eq('id', id);

      if (error) throw error;

      await cargarFacturas();
    } catch (error) {
      console.error('Error actualizando factura:', error);
      alert('Error al marcar como pagada');
    }
  };

 const eliminarFactura = async (id) => {
  const confirmar = window.confirm('¿Estás seguro de eliminar esta factura?');
  
  if (!confirmar) return;

  try {
    const { error } = await supabase
      .from('facturas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error de Supabase:', error);
      throw error;
    }

    alert('Factura eliminada correctamente');
    await cargarFacturas();
  } catch (error) {
    console.error('Error eliminando factura:', error);
    alert('Error al eliminar factura: ' + error.message);
  }
};

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="bg-indigo-600 p-3 rounded-full">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">CobrApp</h1>
            <p className="text-2xl text-gray-700 mb-2">
              Deja de perseguir clientes que no te pagan
            </p>
            <p className="text-lg text-gray-600">
              Recordatorios automáticos por email y WhatsApp. Tu cliente recibe el mensaje. Tú recibes tu dinero.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Clock className="w-10 h-10 text-indigo-600 mb-3" />
              <h3 className="text-xl font-semibold mb-2">Deja de Perseguir Clientes</h3>
              <p className="text-gray-600">
                El sistema envía recordatorios automáticos. Tú te enfocas en trabajar, no en cobrar.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <DollarSign className="w-10 h-10 text-green-600 mb-3" />
              <h3 className="text-xl font-semibold mb-2">Cobra Más Rápido</h3>
              <p className="text-gray-600">
                Freelancers recuperan pagos 7 días más rápido con recordatorios automáticos.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <CheckCircle className="w-10 h-10 text-blue-600 mb-3" />
              <h3 className="text-xl font-semibold mb-2">Sin Conversaciones Incómodas</h3>
              <p className="text-gray-600">
                El recordatorio viene del sistema, no de ti. Mantienes la relación profesional.
              </p>
            </div>
          </div>

          <div className="text-center mb-12">
            <button
              onClick={() => setCurrentView('form')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-xl font-semibold hover:bg-indigo-700 transition shadow-lg"
            >
              Empezar
            </button>
            <p className="text-gray-600 mt-4">
              ✓ Sin conversaciones incómodas ✓ Setup en 2 minutos ✓ 100% automático
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md mb-12">
            <h2 className="text-2xl font-bold text-center mb-6">¿Te suena familiar?</h2>
            <div className="space-y-3 mb-6">
              <div className="flex items-start">
                <span className="text-red-600 mr-3 text-xl">❌</span>
                <p className="text-gray-700">Terminaste el trabajo hace 30 días. Aún no te pagan.</p>
              </div>
              <div className="flex items-start">
                <span className="text-red-600 mr-3 text-xl">❌</span>
                <p className="text-gray-700">No sabes si escribirle de nuevo o esperar más.</p>
              </div>
              <div className="flex items-start">
                <span className="text-red-600 mr-3 text-xl">❌</span>
                <p className="text-gray-700">Te da pena parecer insistente.</p>
              </div>
              <div className="flex items-start">
                <span className="text-red-600 mr-3 text-xl">❌</span>
                <p className="text-gray-700">Ya perdiste $2,000+ en facturas olvidadas.</p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-green-600 mr-3 text-xl">✅</span>
                <p className="text-gray-700">
                  <strong>Con CobrApp</strong>, tu cliente recibe recordatorios automáticos. Sin que tengas que escribir. Sin quedar mal. Sin perder dinero.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-8">¿Cómo funciona?</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-indigo-100 text-indigo-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">1</div>
                <div>
                  <h3 className="font-semibold mb-1">Ingresa los datos de tu factura</h3>
                  <p className="text-gray-600">Número, monto, fecha de vencimiento y email del cliente (2 minutos)</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-indigo-100 text-indigo-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">2</div>
                <div>
                  <h3 className="font-semibold mb-1">El sistema programa recordatorios automáticos</h3>
                  <p className="text-gray-600">3 días antes, día del vencimiento y 7 días después</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-indigo-100 text-indigo-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">3</div>
                <div>
                  <h3 className="font-semibold mb-1">Tu cliente recibe emails automáticos</h3>
                  <p className="text-gray-600">Recordatorios profesionales que funcionan, sin que hagas nada</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-indigo-100 text-indigo-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">4</div>
                <div>
                  <h3 className="font-semibold mb-1">Recibes tu dinero más rápido</h3>
                  <p className="text-gray-600">Marcas como pagada cuando llegue el pago. Así de simple.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button onClick={() => setCurrentView('landing')} className="text-indigo-600 mb-6 hover:underline">← Volver</button>

          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-6">Nueva Factura</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Cliente</label>
                <input
                  type="text"
                  value={formData.nombreCliente}
                  onChange={(e) => setFormData({...formData, nombreCliente: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: María García"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Factura</label>
                <input
                  type="text"
                  value={formData.numeroFactura}
                  onChange={(e) => setFormData({...formData, numeroFactura: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: #001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monto (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monto}
                  onChange={(e) => setFormData({...formData, monto: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: 500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={formData.fechaVencimiento}
                  onChange={(e) => setFormData({...formData, fechaVencimiento: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email del Cliente</label>
                <input
                  type="email"
                  value={formData.emailCliente}
                  onChange={(e) => setFormData({...formData, emailCliente: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="cliente@email.com"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📧 Recordatorios automáticos programados:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 3 días antes del vencimiento</li>
                  <li>• Día del vencimiento</li>
                  <li>• 7 días después del vencimiento</li>
                </ul>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Activar Recordatorios Automáticos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando facturas...</p>
        </div>
      </div>
    );
  }

  const facturasActivas = facturas.filter(f => !f.pagada);
  const facturasPagadas = facturas.filter(f => f.pagada);
  const totalPorCobrar = facturasActivas.reduce((sum, f) => sum + parseFloat(f.monto || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Facturas</h1>
            <p className="text-gray-600">Gestiona tus cobros automáticos</p>
          </div>
          <button
            onClick={() => setCurrentView('form')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            + Nueva Factura
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-1">Total por Cobrar</p>
            <p className="text-3xl font-bold text-indigo-600">${totalPorCobrar.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-1">Facturas Pendientes</p>
            <p className="text-3xl font-bold text-orange-600">{facturasActivas.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-1">Facturas Pagadas</p>
            <p className="text-3xl font-bold text-green-600">{facturasPagadas.length}</p>
          </div>
        </div>

        {facturasActivas.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Pendientes de Cobro</h2>
            <div className="space-y-4">
              {facturasActivas.map(factura => {
                const { estado, dias, color } = getEstadoFactura(factura.fecha_vencimiento);
                return (
                  <div key={factura.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{factura.nombre_cliente}</h3>
                          <span className="text-sm text-gray-500">Factura {factura.numero_factura}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-2">${factura.monto}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            <Calendar className="inline w-4 h-4 mr-1" />
                            Vence: {new Date(factura.fecha_vencimiento).toLocaleDateString()}
                          </span>
                          <span className={`font-semibold ${color}`}>
                            {estado === 'pendiente' && `Vence en ${dias} días`}
                            {estado === 'por_vencer' && `⚠️ Vence en ${dias} días`}
                            {estado === 'vence_hoy' && '🔔 Vence HOY'}
                            {estado === 'vencida' && `❌ Vencida hace ${dias} días`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          <Mail className="inline w-4 h-4 mr-1" />
                          {factura.email_cliente}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => marcarComoPagada(factura.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
                        >
                          ✓ Pagada
                        </button>
                        <button
                          onClick={() => eliminarFactura(factura.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {facturasPagadas.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-green-600">✓ Facturas Pagadas</h2>
            <div className="space-y-3">
              {facturasPagadas.map(factura => (
                <div key={factura.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{factura.nombre_cliente} - Factura {factura.numero_factura}</h3>
                      <p className="text-gray-600">${factura.monto}</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {facturas.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes facturas aún</h3>
            <p className="text-gray-600 mb-6">Crea tu primera factura y activa recordatorios automáticos</p>
            <button
              onClick={() => setCurrentView('form')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Crear Primera Factura
            </button>
          </div>
        )}
      </div>
    </div>
  );
}