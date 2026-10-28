export function publicationState(result, now = Date.now()) {
  if (!result) return { tone: 'neutral', title: 'Tu tienda está lista para continuar', description: 'Edita tu diseño o publica tu primera versión.' };
  const fresh = Number.isFinite(Date.parse(result.recordedAt)) && now - Date.parse(result.recordedAt) < 180000;
  if (['uploading', 'preparing'].includes(result.status) && fresh) return { tone: 'pending', busy: true, title: result.status === 'preparing' ? 'Preparando tu tienda' : 'Publicando tu tienda', description: 'La herramienta está trabajando. Esta pantalla muestra el último estado recibido.' };
  if (result.status === 'preparing') return {tone:'warning',title:'Preparación sin confirmar',description:'No recibimos el resultado de la preparación. Continúa desde el chat; no hay un envío registrado para este intento.'};
  if (result.status === 'active') return { tone: 'success', title: 'Tu tienda está publicada', description: 'Abre tu tienda o continúa trabajando en el diseño.' };
  if (result.status === 'prepared') return { tone: 'neutral', title: 'Archivos preparados', description: 'La publicación continúa en el chat.' };
  if (result.status === 'activation_pending') return { tone: 'warning', title: 'Activación pendiente de confirmar', description: 'El servidor recibió el archivo, pero todavía no confirmó la activación.' };
  if (result.outcome === 'unknown' || ['uploading', 'preparing', 'unconfirmed', 'activation_unconfirmed'].includes(result.status)) return { tone: 'warning', title: 'Publicación sin confirmar', description: 'No recibimos un resultado definitivo. Tu tienda podría haberse actualizado.' };
  if (result.code === 'PUBLICATION_CONNECTION_FAILED' && ['ENOTFOUND','EAI_AGAIN'].includes(result.transportCode)) return {tone:'error',action:'diagnose',title:'No pudimos resolver el servidor',description:'La conexión falló antes de enviar archivos. Este error no confirma un problema de permisos: revisa la red y el entorno desde el chat.'};
  const messages = {
    LOCAL_PERMISSION_DENIED: ['El acceso al archivo está bloqueado', 'El sistema rechazó el acceso. Solicita permiso solo para esta ubicación, si el entorno lo permite. La subida no comenzó.'],
    LOCAL_FILE_ACCESS: ['No pudimos leer los archivos', 'Comprueba la ubicación y los permisos desde el chat. La subida no comenzó.'],
    PUBLICATION_CONNECTION_FAILED: ['No pudimos conectar con el servicio', 'Comprueba tu conexión y solicita otro intento en el chat. La subida no comenzó.'],
    PUBLICATION_PREFLIGHT_REJECTED: ['El servicio rechazó la comprobación', 'La subida no comenzó. Revisa el diagnóstico en el chat; si persiste, comparte la referencia con soporte.'],
    PUBLICATION_FORBIDDEN: ['No tienes permiso para publicar', 'Pide al administrador que revise el acceso de tu cuenta a esta tienda.'],
    UPLOAD_AUTHORIZATION_INVALID: ['La autorización venció o ya fue utilizada', 'Pide otro intento en el chat. La herramienta solicitará una autorización nueva.'],
    PUBLICATION_UNAVAILABLE: ['El servicio de publicación no está disponible', 'Solicita otro intento en el chat. Si vuelve a fallar, comparte el diagnóstico con soporte.'],
    PUBLICATION_REJECTED: ['El servidor rechazó la publicación', 'Revisa la configuración con el agente antes de solicitar otro intento.'],
    INVALID_ARCHIVE: ['El archivo necesita una corrección', 'Solicita al agente que corrija el build y prepare un nuevo archivo.'],
    ARTIFACT_CHANGED: ['Los archivos cambiaron', 'Solicita al agente que prepare la versión actual antes de publicar.'],
    INVALID_PUBLICATION_INPUT: ['La autorización no es válida', 'Solicita otro intento en el chat para preparar una autorización nueva.'],
  };
  const [title, description] = messages[result.code] || ['No pudimos completar la publicación', result.outcome === 'not_started' ? 'La subida no comenzó. Revisa el mensaje y solicita ayuda desde el chat.' : 'Revisa el diagnóstico y solicita otro intento desde el chat.'];
  return { tone: 'error', title, description, action: ['LOCAL_PERMISSION_DENIED','LOCAL_FILE_ACCESS','PUBLICATION_CONNECTION_FAILED', 'PUBLICATION_PREFLIGHT_REJECTED','PUBLICATION_FORBIDDEN'].includes(result.code) ? 'diagnose' : 'retry' };
}
export function supportDetails(project, result = {}) {
  return Object.fromEntries(Object.entries({
    project: project.name, hostname: result.hostname || project.lastConfirmedPublication?.hostname,
    status: result.status, outcome: result.outcome, code: result.code, message: result.message,
    stage: result.stage, httpStatus: result.httpStatus, transportCode: result.transportCode,
    requestId: result.requestId || 'No recibido del servidor', attemptId: result.attemptId,
    recordedAt: result.recordedAt, nextAction: result.nextAction,
  }).filter(([,value]) => value != null));
}
