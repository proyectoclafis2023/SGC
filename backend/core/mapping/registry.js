/**
 * REGISTRO CENTRAL DE ENTIDADES - SGC v2.5.0 (CANONICAL FINAL)
 * Define la correspondencia entre las tres capas: Excel, API y BD.
 * Alineado con sgc-doctor (snake_case API, camelCase DB).
 */

const registry = {
    // 2.1.0 Reporte Diario
    reporte_diario: {
        model: 'DailyReport',
        isMaster: false,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'folio', bd: 'folio', excel: 'folio' },
            { api: 'concierge_id', bd: 'conciergeId', excel: 'funcionario_id' },
            { api: 'concierge_name', bd: 'conciergeName', excel: 'funcionario_nombre' },
            { api: 'shift_date', bd: 'shiftDate', excel: 'fecha_turno' },
            { api: 'shift_type', bd: 'shiftType', excel: 'tipo_turno' },
            { api: 'novedades', bd: 'novedades', excel: 'novedades' },
            { api: 'has_incidents', bd: 'hasIncidents', excel: 'hay_incidencias' },
            { api: 'incident_details', bd: 'incidentDetails', excel: 'detalle_incidencias' },
            { api: 'incident_attachments', bd: 'incidentAttachments', excel: 'adjuntos_incidencias' },
            { api: 'has_infrastructure_issues', bd: 'hasInfrastructureIssues', excel: 'hay_problemas_infra' },
            { api: 'infrastructure_issue_types', bd: 'infrastructureIssueTypes', excel: 'tipos_problemas_infra' },
            { api: 'infrastructure_issue_details', bd: 'infrastructureIssueDetails', excel: 'detalle_problemas_infra' },
            { api: 'infrastructure_attachments', bd: 'infrastructureAttachments', excel: 'adjuntos_infra' },
            { api: 'has_equipment_issues', bd: 'hasEquipmentIssues', excel: 'hay_problemas_equip' },
            { api: 'equipment_issue_types', bd: 'equipmentIssueTypes', excel: 'tipos_problemas_equip' },
            { api: 'equipment_issue_details', bd: 'equipmentIssueDetails', excel: 'detalle_problemas_equip' },
            { api: 'equipment_attachments', bd: 'equipmentAttachments', excel: 'adjuntos_equip' },
            { api: 'status', bd: 'status', excel: 'estado' },
            { api: 'closed_at', bd: 'closedAt', excel: 'fecha_cierre' },
            { api: 'admin_reopened_by', bd: 'adminReopenedBy', excel: 'reabierto_por' },
            { api: 'admin_reopen_reason', bd: 'adminReopenReason', excel: 'motivo_reapertura' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' },
            { api: 'resident_id', bd: 'residentId', excel: 'residente_id' },
            { api: 'owner_id', bd: 'ownerId', excel: 'propietario_id' },
            { api: 'department_id', bd: 'departmentId', excel: 'unidad_id' }
        ],
        relations: {
            resident: 'residentes',
            owner: 'propietarios',
            department: 'unidades',
            logs: 'bitacora_turnos'
        }
    },

    // 2.2.0 Libro de Novedades
    bitacora_turnos: {
        model: 'ShiftLog',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'daily_report_id', bd: 'dailyReportId', excel: 'reporte_id' },
            { api: 'timestamp', bd: 'timestamp', excel: 'timestamp' },
            { api: 'event', bd: 'event', excel: 'evento' },
            { api: 'category', bd: 'category', excel: 'categoria' },
            { api: 'concierge_id', bd: 'conciergeId', excel: 'funcionario_id' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            dailyReport: 'reporte_diario'
        }
    },

    // 2.3.1 Visitas
    visitas: {
        model: 'Visita',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'folio', bd: 'folio', excel: 'folio' },
            { api: 'names', bd: 'names', excel: 'nombres' },
            { api: 'dni', bd: 'dni', excel: 'dni' },
            { api: 'resident_id', bd: 'residentId', excel: 'residente_id' },
            { api: 'tower_id', bd: 'towerId', excel: 'torre_id' },
            { api: 'department_id', bd: 'departmentId', excel: 'unidad_id' },
            { api: 'visit_date', bd: 'visitDate', excel: 'fecha_visita' },
            { api: 'visit_time', bd: 'visitTime', excel: 'hora_visita' },
            { api: 'is_pre_registered', bd: 'isPreRegistered', excel: 'pre_registrado' },
            { api: 'status', bd: 'status', excel: 'estado' },
            { api: 'entry_at', bd: 'entryTime', excel: 'hora_entrada' },
            { api: 'exit_at', bd: 'exitTime', excel: 'hora_salida' },
            { api: 'vehicle_plate', bd: 'vehiclePlate', excel: 'patente' },
            { api: 'notes', bd: 'notes', excel: 'notas' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            resident: 'residentes',
            department: 'unidades'
        }
    },

    // 2.3.2 Encomiendas
    correspondencia: {
        model: 'Correspondence',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'folio', bd: 'folio', excel: 'folio' },
            { api: 'department_id', bd: 'departmentId', excel: 'unidad_id' },
            { api: 'tower_id', bd: 'towerId', excel: 'torre_id' },
            { api: 'type', bd: 'type', excel: 'tipo' },
            { api: 'addressee', bd: 'addressee', excel: 'destinatario' },
            { api: 'status', bd: 'status', excel: 'estado' },
            { api: 'received_at', bd: 'receivedAt', excel: 'fecha_recepcion' },
            { api: 'delivered_at', bd: 'deliveredAt', excel: 'fecha_entrega' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            department: 'unidades'
        }
    },

    // 2.3.3 Contratistas
    registro_contratistas: {
        model: 'ContratistaVisita',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'folio', bd: 'folio', excel: 'folio' },
            { api: 'names', bd: 'names', excel: 'nombres' },
            { api: 'dni', bd: 'dni', excel: 'dni' },
            { api: 'company', bd: 'company', excel: 'empresa' },
            { api: 'subject', bd: 'subject', excel: 'asunto' },
            { api: 'department_id', bd: 'departmentId', excel: 'unidad_id' },
            { api: 'status', bd: 'status', excel: 'estado' },
            { api: 'entry_at', bd: 'entryAt', excel: 'fecha_entrada' },
            { api: 'exit_at', bd: 'exitAt', excel: 'fecha_salida' },
            { api: 'allowed_until', bd: 'allowedUntil', excel: 'permitido_hasta' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            department: 'unidades'
        }
    },

    // 5.4.2 Maestro Contratistas (reusa modelo ContratistaVisita)
    contratistas: {
        model: 'ContratistaVisita',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'folio', bd: 'folio', excel: 'folio' },
            { api: 'names', bd: 'names', excel: 'nombres' },
            { api: 'dni', bd: 'dni', excel: 'dni' },
            { api: 'company', bd: 'company', excel: 'empresa' },
            { api: 'subject', bd: 'subject', excel: 'asunto' },
            { api: 'department_id', bd: 'departmentId', excel: 'unidad_id' },
            { api: 'status', bd: 'status', excel: 'estado' },
            { api: 'entry_at', bd: 'entryAt', excel: 'fecha_entrada' },
            { api: 'exit_at', bd: 'exitAt', excel: 'fecha_salida' },
            { api: 'allowed_until', bd: 'allowedUntil', excel: 'permitido_hasta' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            department: 'unidades'
        }
    },

    // 2.4.1 Solicitud Insumos
    solicitud_insumos: {
        model: 'SupplyRequest',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'folio', bd: 'folio', excel: 'folio' },
            { api: 'name', bd: 'name', excel: 'nombre' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'requested_by', bd: 'requestedBy', excel: 'solicitante_id' },
            { api: 'status', bd: 'status', excel: 'estado' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            concierge: 'personal' // requestedBy points to Personnel
        }
    },

    // 2.4.2 Gestión Registros CCTV
    camaras: {
        model: 'Camera',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'name', excel: 'nombre' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'backup_hours', bd: 'backupHours', excel: 'horas_respaldo' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'is_active', bd: 'isActive', excel: 'activo' }
        ],
        relations: {
            logs: 'cctv_logs'
        }
    },

    cctv_logs: {
        model: 'CctvLog',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'folio', bd: 'folio', excel: 'folio' },
            { api: 'camera_id', bd: 'cameraId', excel: 'camara_id' },
            { api: 'event_type', bd: 'eventType', excel: 'tipo_evento' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'recorded_at', bd: 'recordedAt', excel: 'fecha_registro' },
            { api: 'evidence_url', bd: 'evidenceUrl', excel: 'url_evidencia' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            camera: 'camaras'
        }
    },

    // 3.1.0 Mis Pagos (Hogar) -> use gastos_comunes
    
    // 4.1.0 Atención y Soporte
    reclamos: {
        model: 'Ticket',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'folio', bd: 'folio', excel: 'folio' },
            { api: 'resident_id', bd: 'residentId', excel: 'residente_id' },
            { api: 'unit_id', bd: 'unitId', excel: 'unidad_id' },
            { api: 'tower_id', bd: 'towerId', excel: 'torre_id' },
            { api: 'type', bd: 'type', excel: 'tipo' },
            { api: 'subject', bd: 'subject', excel: 'asunto' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'image', bd: 'image', excel: 'imagen' },
            { api: 'status', bd: 'status', excel: 'estado' },
            { api: 'admin_notes', bd: 'adminNotes', excel: 'notas_admin' },
            { api: 'acknowledged_at', bd: 'acknowledgedAt', excel: 'fecha_acuse' },
            { api: 'acknowledged_by', bd: 'acknowledgedBy', excel: 'autor_acuse' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' },
            { api: 'updated_at', bd: 'updatedAt', excel: 'fecha_actualizacion' }
        ],
        relations: {
            resident: 'residentes'
        }
    },

    // 4.2.0 Reserva Espacios Comunes
    reservas: {
        model: 'Reserva',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'folio', bd: 'folio', excel: 'folio' },
            { api: 'common_space_id', bd: 'commonSpaceId', excel: 'espacio_id' },
            { api: 'resident_id', bd: 'residentId', excel: 'residente_id' },
            { api: 'start_at', bd: 'startAt', excel: 'fecha_inicio' },
            { api: 'end_at', bd: 'endAt', excel: 'fecha_fin' },
            { api: 'status', bd: 'status', excel: 'estado' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            commonSpace: 'espacios',
            resident: 'residentes'
        }
    },

    // 4.3.0 Directorio de Servicios
    servicios_residentes: {
        model: 'DirectorioServicio',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'name', excel: 'nombre' },
            { api: 'category', bd: 'category', excel: 'categoria' },
            { api: 'contact_phone', bd: 'contactPhone', excel: 'telefono' },
            { api: 'contact_email', bd: 'contactEmail', excel: 'email' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' },
            { api: 'updated_at', bd: 'updatedAt', excel: 'fecha_actualizacion' }
        ]
    },

    // 4.4.0 Números Emergencia
    emergencias: {
        model: 'NumeroEmergencia',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'nombre', excel: 'nombre' },
            { api: 'phone', bd: 'phone', excel: 'telefono' },
            { api: 'category', bd: 'category', excel: 'categoria' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'web_url', bd: 'webUrl', excel: 'web_url' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ]
    },

    // 5.1.0 Dashboard KPI -> No persistent model required for standard CRUD

    // 5.2.0 Centro de Gestiones -> use reclamos (Tickets)
    tickets: {
        model: 'Ticket',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'folio', bd: 'folio', excel: 'folio' },
            { api: 'resident_id', bd: 'residentId', excel: 'residente_id' },
            { api: 'status', bd: 'status', excel: 'estado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            resident: 'residentes'
        }
    },

    // 5.3.1 Residentes
    residentes: {
        model: 'Residente',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'names', bd: 'names', excel: 'nombres' },
            { api: 'last_names', bd: 'lastNames', excel: 'apellidos' },
            { api: 'dni', bd: 'dni', excel: 'rut' },
            { api: 'email', bd: 'email', excel: 'correo' },
            { api: 'phone', bd: 'phone', excel: 'telefono' },
            { api: 'photo', bd: 'photo', excel: 'foto' },
            { api: 'tower_id', bd: 'towerId', excel: 'torre_id' },
            { api: 'unit_id', bd: 'unitId', excel: 'unidad_id' },
            { api: 'parking_ids', bd: 'parkingIds', excel: 'estacionamientos', isJson: true },
            { api: 'family_count', bd: 'familyCount', excel: 'integrantes_familia' },
            { api: 'has_pets', bd: 'hasPets', excel: 'tiene_mascotas' },
            { api: 'condition_ids', bd: 'conditionIds', excel: 'condiciones_especiales', isJson: true },
            { api: 'notes', bd: 'notes', excel: 'notas' },
            { api: 'is_tenant', bd: 'isTenant', excel: 'es_arrendatario' },
            { api: 'rent_amount', bd: 'rentAmount', excel: 'monto_arriendo' },
            { api: 'status', bd: 'status', excel: 'estado' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            departments: 'unidades'
        }
    },

    // 5.3.2 Propietarios
    propietarios: {
        model: 'Propietario',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'names', bd: 'names', excel: 'nombres' },
            { api: 'last_names', bd: 'lastNames', excel: 'apellidos' },
            { api: 'dni', bd: 'dni', excel: 'rut' },
            { api: 'email', bd: 'email', excel: 'correo' },
            { api: 'phone', bd: 'phone', excel: 'telefono' },
            { api: 'receive_resident_notifications', bd: 'receiveResidentNotifications', excel: 'notificaciones_residente' },
            { api: 'can_resident_see_arrears', bd: 'canResidentSeeArrears', excel: 'ver_deuda_residente' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            departments: 'unidades'
        }
    },

    // 5.3.3 Directiva
    directiva: {
        model: 'Comite',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'name', excel: 'nombre' },
            { api: 'position', bd: 'position', excel: 'cargo' },
            { api: 'dni', bd: 'dni', excel: 'rut' },
            { api: 'address', bd: 'address', excel: 'direccion' },
            { api: 'email', bd: 'email', excel: 'correo' },
            { api: 'phone', bd: 'phone', excel: 'telefono' },
            { api: 'photo', bd: 'photo', excel: 'foto' },
            { api: 'signature_photo', bd: 'signaturePhoto', excel: 'firma' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ]
    },

    // 5.3.4 Mensajes Dirigidos -> Historico
    mensajes_dirigidos: {
        model: 'CommunicationHistory',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'subject', bd: 'subject', excel: 'asunto' },
            { api: 'message', bd: 'message', excel: 'mensaje' },
            { api: 'recipients', bd: 'recipients', excel: 'destinatarios' },
            { api: 'sender_id', bd: 'senderId', excel: 'remitente_id' },
            { api: 'target_filter', bd: 'targetFilter', excel: 'filtro_objetivo' },
            { api: 'attachment_url', bd: 'attachmentUrl', excel: 'archivo_adjunto' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ]
    },

    // 5.3.5 Avisos del Sistema (Visor)
    mensajes: {
        model: 'Aviso',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'text', bd: 'text', excel: 'texto' },
            { api: 'type', bd: 'type', excel: 'tipo' },
            { api: 'is_active', bd: 'isActive', excel: 'activo' },
            { api: 'image', bd: 'image', excel: 'imagen' },
            { api: 'youtube_url', bd: 'youtubeUrl', excel: 'youtube_url' },
            { api: 'duration_seconds', bd: 'durationSeconds', excel: 'duracion_segundos' },
            { api: 'is_full_image', bd: 'isFullImage', excel: 'imagen_completa' },
            { api: 'expires_at', bd: 'expiresAt', excel: 'fecha_expiracion' },
            { api: 'tags', bd: 'tags', excel: 'etiquetas' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ]
    },

    // 5.4.1 Maestro Personal
    personal: {
        model: 'Personnel',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'names', bd: 'names', excel: 'nombres' },
            { api: 'last_names', bd: 'lastNames', excel: 'apellidos' },
            { api: 'dni', bd: 'dni', excel: 'rut' },
            { api: 'phone', bd: 'phone', excel: 'telefono' },
            { api: 'email', bd: 'email', excel: 'correo' },
            { api: 'photo', bd: 'photo', excel: 'foto' },
            { api: 'is_honorary', bd: 'isHonorary', excel: 'honorario' },
            { api: 'bank_id', bd: 'bankId', excel: 'banco_id' },
            { api: 'account_number', bd: 'accountNumber', excel: 'numero_cuenta' },
            { api: 'base_salary', bd: 'baseSalary', excel: 'sueldo_base' },
            { api: 'vacation_days', bd: 'vacationDays', excel: 'dias_vacaciones' },
            { api: 'vacation_last_update', bd: 'vacationLastUpdate', excel: 'ultima_actualizacion_vacaciones' },
            { api: 'health_provider_id', bd: 'healthProviderId', excel: 'prevision_id' },
            { api: 'pension_fund_id', bd: 'pensionFundId', excel: 'afp_id' },
            { api: 'jornada_group_id', bd: 'jornadaGroupId', excel: 'grupo_jornada_id' },
            { api: 'address', bd: 'address', excel: 'direccion' },
            { api: 'role', bd: 'position', excel: 'cargo' },
            { api: 'status', bd: 'status', excel: 'estado' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            bank: 'bancos',
            pensionFund: 'afps',
            healthProvider: 'previsiones',
            jornadaGroup: 'jornadas'
        }
    },

    // 5.4.4 Entrega de EPP
    entregas_articulos: {
        model: 'EntregaArticulo',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'folio', bd: 'folio', excel: 'folio' },
            { api: 'personnel_id', bd: 'personnelId', excel: 'asignado_a' },
            { api: 'delivery_date', bd: 'deliveryDate', excel: 'fecha_entrega' },
            { api: 'articles', bd: 'articlesJson', excel: 'articulos', isJson: true },
            { api: 'notes', bd: 'notes', excel: 'notas' },
            { api: 'status', bd: 'status', excel: 'estado' },
            { api: 'signed_document', bd: 'signedDocument', excel: 'documento_firmado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            personnel: 'personal'
        }
    },

    // 5.5.1 Gastos Comunes Admin
    gastos_comunes: {
        model: 'CommonExpense',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'total_amount', bd: 'totalAmount', excel: 'monto_total' },
            { api: 'period', bd: 'period', excel: 'periodo' },
            { api: 'calculated_at', bd: 'calculatedAt', excel: 'fecha_calculo' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ],
        relations: {
            payments: 'pagos_gastos_comunes'
        }
    },

    // 5.5.2 Registro de Egresos
    registro_gastos: {
        model: 'CommunityExpense',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'amount', bd: 'amount', excel: 'monto' },
            { api: 'expense_date', bd: 'date', excel: 'fecha' },
            { api: 'description', bd: 'description', excel: 'glosa' },
            { api: 'category', bd: 'category', excel: 'categoria' },
            { api: 'payment_method', bd: 'paymentMethod', excel: 'metodo_pago' },
            { api: 'reference', bd: 'reference', excel: 'folio' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'is_projected', bd: 'isProjected', excel: 'proyectivo' },
            { api: 'receipt_url', bd: 'receiptUrl', excel: 'boleta_url' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ]
    },

    // 5.5.3 Reglas de Cobro
    reglas_gastos_comunes: {
        model: 'ChargeRule',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'name', excel: 'nombre' },
            { api: 'rule_type', bd: 'ruleType', excel: 'tipo' },
            { api: 'value', bd: 'value', excel: 'valor' },
            { api: 'applies_to', bd: 'appliesTo', excel: 'aplica_a' },
            { api: 'target_id', bd: 'targetId', excel: 'objetivo_id' },
            { api: 'is_active', bd: 'isActive', excel: 'activo' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ]
    },

    // 5.5.4 Fondos Especiales
    maestro_fondos: {
        model: 'SpecialFund',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'name', excel: 'nombre' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'type', bd: 'type', excel: 'tipo' },
            { api: 'total_amount_per_unit', bd: 'totalAmountPerUnit', excel: 'monto_mensual_unidad' },
            { api: 'total_project_amount', bd: 'totalProjectAmount', excel: 'monto_total_proyectado' },
            { api: 'deadline', bd: 'deadline', excel: 'fecha_termino' },
            { api: 'is_active', bd: 'isActive', excel: 'activo' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'fund_code', bd: 'fundCode', excel: 'codigo_fondo' },
            { api: 'unit_configs', bd: 'unitConfigsJson', excel: 'config_unidades', isJson: true },
            { api: 'expenses', bd: 'expensesJson', excel: 'gastos_registrados', isJson: true },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ]
    },

    // 5.5.5 Activo Fijo
    activo_fijo: {
        model: 'FixedAsset',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'quantity', bd: 'quantity', excel: 'cantidad' },
            { api: 'purchase_price', bd: 'purchasePrice', excel: 'precio_compra' },
            { api: 'depreciated_value', bd: 'depreciatedValue', excel: 'valor_depreciado' },
            { api: 'model', bd: 'model', excel: 'modelo' },
            { api: 'details', bd: 'details', excel: 'detalles' },
            { api: 'is_active', bd: 'isActive', excel: 'activo' },
            { api: 'purchase_date', bd: 'purchaseDate', excel: 'fecha_compra' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ]
    },

    // 6.1.0 Configuración Comunidad
    configuracion: {
        model: 'SystemSettings',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'system_name', bd: 'systemName', excel: 'nombre_sistema' },
            { api: 'system_icon', bd: 'systemIcon', excel: 'icono_sistema' },
            { api: 'system_logo', bd: 'systemLogo', excel: 'logo_sistema' },
            { api: 'system_favicon', bd: 'systemFavicon', excel: 'favicon' },
            { api: 'camera_backup_days', bd: 'cameraBackupDays', excel: 'dias_respaldo_camaras' },
            { api: 'dark_mode', bd: 'darkMode', excel: 'modo_oscuro' },
            { api: 'theme', bd: 'theme', excel: 'tema' },
            { api: 'admin_name', bd: 'adminName', excel: 'nombre_admin' },
            { api: 'admin_rut', bd: 'adminRut', excel: 'rut_admin' },
            { api: 'condo_rut', bd: 'condoRut', excel: 'rut_condominio' },
            { api: 'condo_address', bd: 'condoAddress', excel: 'direccion_condominio' },
            { api: 'admin_phone', bd: 'adminPhone', excel: 'telefono_admin' },
            { api: 'admin_signature', bd: 'adminSignature', excel: 'firma_admin' },
            { api: 'deletion_password', bd: 'deletionPassword', excel: 'clave_eliminacion' },
            { api: 'vacation_accrual_rate', bd: 'vacationAccrualRate', excel: 'tasa_vacaciones' },
            { api: 'smtp_host', bd: 'smtpHost', excel: 'smtp_host' },
            { api: 'smtp_port', bd: 'smtpPort', excel: 'smtp_port' },
            { api: 'smtp_user', bd: 'smtpUser', excel: 'smtp_user' },
            { api: 'smtp_password', bd: 'smtpPassword', excel: 'smtp_password' },
            { api: 'smtp_from', bd: 'smtpFrom', excel: 'smtp_from' },
            { api: 'smtp_bcc', bd: 'smtpBcc', excel: 'smtp_bcc' },
            { api: 'concierge_email', bd: 'conciergeEmail', excel: 'email_conserjeria' },
            { api: 'email_triggers', bd: 'emailTriggers', excel: 'triggers_email', isJson: true },
            { api: 'payment_deadline_day', bd: 'paymentDeadlineDay', excel: 'dia_vencimiento' },
            { api: 'max_arrears_months', bd: 'maxArrearsMonths', excel: 'meses_max_morosidad' },
            { api: 'arrears_fine_amount', bd: 'arrearsFineAmount', excel: 'monto_multa_morosidad' },
            { api: 'arrears_fine_percentage', bd: 'arrearsFinePercentage', excel: 'porcentaje_multa_morosidad' },
            { api: 'census_frequency_years', bd: 'censusFrequencyYears', excel: 'frecuencia_censo_anios' },
            // System Doctor (v3.5.0+)
            { api: 'doctor_alert_enabled', bd: 'doctorAlertEnabled', excel: 'doctor_alertas_activas' },
            { api: 'doctor_threshold_warning', bd: 'doctorThresholdWarning', excel: 'doctor_umbral_advertencia' },
            { api: 'doctor_threshold_error', bd: 'doctorThresholdError', excel: 'doctor_umbral_error' },
            { api: 'doctor_cooldown_min', bd: 'doctorCooldownMin', excel: 'doctor_cooldown' },
            { api: 'doctor_webhook_url', bd: 'doctorWebhookUrl', excel: 'doctor_webhook' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ]
    },

    // 6.2.0 Configuración Email
    maestro_correos: {
        model: 'PlantillaComunicacion',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'nombre', excel: 'nombre' },
            { api: 'subject', bd: 'subject', excel: 'asunto' },
            { api: 'message', bd: 'message', excel: 'mensaje' },
            { api: 'type', bd: 'type', excel: 'tipo' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' }
        ]
    },

    // 6.3.0 Parámetros Generales -> use parametros
    parametros: {
        model: 'ParametroSistema',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'type', bd: 'type', excel: 'tipo' },
            { api: 'name', bd: 'nombre', excel: 'nombre' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'is_active', bd: 'isActive', excel: 'activo' }
        ]
    },

    // 6.4.0 Perfiles de Acceso
    perfiles: {
        model: 'Role',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'name', excel: 'nombre' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha_creacion' }
        ]
    },

    // 7.1.1 Infraestructura
    infraestructura: {
        model: 'ItemInfraestructura',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'nombre', excel: 'nombre' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'is_mandatory', bd: 'isMandatory', excel: 'obligatorio' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' }
        ]
    },

    // 7.1.1b Equipamiento (sub-módulo de Infraestructura)
    equipamiento: {
        model: 'ItemEquipamiento',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'nombre', excel: 'nombre' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'is_mandatory', bd: 'isMandatory', excel: 'obligatorio' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' }
        ]
    },

    // 7.1.2 Tipos de Unidad
    tipos_unidad: {
        model: 'TipoUnidad',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'nombre', bd: 'nombre', excel: 'nombre' },
            { api: 'base_common_expense', bd: 'baseCommonExpense', excel: 'gasto_comun_base' },
            { api: 'default_m2', bd: 'defaultM2', excel: 'm2_por_defecto' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' }
        ]
    },

    // 7.1.3 Espacios Comunes
    espacios: {
        model: 'EspacioComun',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'nombre', excel: 'nombre' },
            { api: 'location', bd: 'location', excel: 'ubicacion' },
            { api: 'rental_value', bd: 'rentalValue', excel: 'valor_arriendo' },
            { api: 'duration_hours', bd: 'durationHours', excel: 'duracion_horas' },
            { api: 'conditions', bd: 'conditions', excel: 'condiciones' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' }
        ]
    },

    // 7.1.4 Estacionamientos
    estacionamientos: {
        model: 'Estacionamiento',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'number', bd: 'number', excel: 'numero' },
            { api: 'location', bd: 'location', excel: 'ubicacion' },
            { api: 'is_handicapped', bd: 'isHandicapped', excel: 'discapacitado' },
            { api: 'department_id', bd: 'departmentId', excel: 'departamento_id' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' }
        ],
        relations: {
            department: 'unidades'
        }
    },

    // 7.2.1 Previsiones
    previsiones: {
        model: 'HealthProvider',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'name', excel: 'nombre' },
            { api: 'type', bd: 'type', excel: 'tipo' },
            { api: 'discount_rate', bd: 'discountRate', excel: 'tasa_descuento' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' }
        ]
    },

    // 7.2.2 AFPs
    afps: {
        model: 'PensionFund',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'name', excel: 'nombre' },
            { api: 'discount_rate', bd: 'discountRate', excel: 'tasa_descuento' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' }
        ]
    },

    // 7.2.3 Maestro AFC
    afc: {
        model: 'Afc',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'name', excel: 'nombre' },
            { api: 'fixed_term_rate', bd: 'fixedTermRate', excel: 'tasa_plazo_fijo' },
            { api: 'indefinite_term_rate', bd: 'indefiniteTermRate', excel: 'tasa_indefinido' },
            { api: 'is_active', bd: 'isActive', excel: 'activo' }
        ]
    },

    // 7.2.4 Maestro Insumos
    articulos_personal: {
        model: 'Articulo',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'nombre', excel: 'nombre' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'category', bd: 'category', excel: 'categoria' },
            { api: 'unit', bd: 'unit', excel: 'unidad' },
            { api: 'price', bd: 'price', excel: 'precio' },
            { api: 'stock', bd: 'stock', excel: 'stock' },
            { api: 'min_stock', bd: 'minStock', excel: 'stock_minimo' }
        ]
    },

    // 7.2.5 Maestro Categorias Insumos
    maestro_categorias_articulos: {
        model: 'ParametroSistema',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'nombre', excel: 'nombre' },
            { api: 'type', bd: 'type', excel: 'tipo' }
        ]
    },

    // 7.2.6 Maestro Feriados
    feriados: {
        model: 'Feriado',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'date', bd: 'date', excel: 'fecha' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' }
        ]
    },

    // 7.3.1 Bancos
    bancos: {
        model: 'Banco',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'nombre', excel: 'nombre' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' }
        ]
    },

    // 7.3.2 Maestro IPC
    maestro_ipc: {
        model: 'ProyeccionIPC',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'nombre', excel: 'nombre' },
            { api: 'ipc_rate', bd: 'ipcRate', excel: 'tasa_ipc' },
            { api: 'ponderado_rate', bd: 'ponderadoRate', excel: 'tasa_ponderado' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'is_active', bd: 'isActive', excel: 'activo' }
        ]
    },

    // 7.3.3 Maestros Operativos
    maestros_operativos: {
        model: 'ParametroSistema',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'type', bd: 'type', excel: 'tipo' },
            { api: 'name', bd: 'nombre', excel: 'nombre' },
            { api: 'description', bd: 'description', excel: 'descripcion' }
        ]
    },

    // 7.3.4 Mensajes Prefijados
    maestro_mensajes: {
        model: 'PlantillaComunicacion',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'nombre', excel: 'nombre' },
            { api: 'subject', bd: 'subject', excel: 'asunto' },
            { api: 'message', bd: 'message', excel: 'mensaje' }
        ]
    },

    // 7.3.5 Números Emergencia (Maestro) -> use emergencias


    // 7.3.6 Condiciones Especiales
    condiciones_especiales: {
        model: 'CondicionEspecial',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'nombre', excel: 'nombre' },
            { api: 'description', bd: 'description', excel: 'descripcion' },
            { api: 'is_archived', bd: 'isArchived', excel: 'archivado' }
        ]
    },

    // 8.1.0 Carga Masiva (Log)
    carga_masiva: {
        model: 'BulkUploadLog',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'module', bd: 'module', excel: 'modulo' },
            { api: 'processed', bd: 'processed', excel: 'procesados' },
            { api: 'created', bd: 'created', excel: 'creados' },
            { api: 'updated', bd: 'updated', excel: 'actualizados' },
            { api: 'status', bd: 'status', excel: 'estado' },
            { api: 'dry_run', bd: 'dryRun', excel: 'simulacion' },
            { api: 'errors', bd: 'errorsJson', excel: 'errores', isJson: true },
            { api: 'created_at', bd: 'createdAt', excel: 'fecha' }
        ]
    },

    // Auxiliares (No mapeados directamente a modulos doc)
    unidades: {
        model: 'Department',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'tower_id', bd: 'towerId', excel: 'torre_id' },
            { api: 'number', bd: 'number', excel: 'numero' },
            { api: 'floor', bd: 'floor', excel: 'piso' },
            { api: 'unit_type_id', bd: 'unitTypeId', excel: 'tipo_unidad_id' },
            { api: 'm2', bd: 'm2', excel: 'm2' },
            { api: 'owner_id', bd: 'ownerId', excel: 'propietario_id' },
            { api: 'resident_id', bd: 'residentId', excel: 'residente_id' }
        ],
        relations: {
            tower: 'torres',
            unitType: 'tipos_unidad',
            resident: 'residentes',
            owner: 'propietarios'
        }
    },
    torres: {
        model: 'Tower',
        isMaster: true,
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'name', bd: 'name', excel: 'nombre' }
        ]
    },
    pagos_gastos_comunes: {
        model: 'CommonExpensePayment',
        fields: [
            { api: 'id', bd: 'id', excel: 'id' },
            { api: 'department_id', bd: 'departmentId' },
            { api: 'common_expense_id', bd: 'commonExpenseId' },
            { api: 'period_month', bd: 'periodMonth' },
            { api: 'period_year', bd: 'periodYear' },
            { api: 'amount_paid', bd: 'amountPaid' },
            { api: 'payment_date', bd: 'paymentDate' },
            { api: 'payment_method', bd: 'paymentMethod' },
            { api: 'receipt_folio', bd: 'receiptFolio' },
            { api: 'notes', bd: 'notes' },
            { api: 'status', bd: 'status' }
        ],
        relations: {
            department: 'unidades',
            commonExpense: 'gastos_comunes'
        }
    },
    jornadas: {
        model: 'JornadaGroup',
        fields: [
            { api: 'id', bd: 'id' },
            { api: 'name', bd: 'name' },
            { api: 'start_time', bd: 'startTime' },
            { api: 'end_time', bd: 'endTime' },
            { api: 'work_days', bd: 'workDays', isJson: true },
            { api: 'schedules', bd: 'schedules', isJson: true }
        ]
    }
};

module.exports = registry;
