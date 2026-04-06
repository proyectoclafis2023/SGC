import React from 'react';

export interface SystemParameter {
    id: string;
    type: 'job_position' | 'shift' | 'contractor_specialty' | 'ticket_category' | 'article_category' | 'pet_type' | 'vehicle_type' | 'camera_request_reason' | 'shift_report_category' | 'jornada_group';
    name: string;
    description?: string;
    is_active: boolean;
}

export interface SystemParameterContextType {
    parameters: SystemParameter[];
    addParameter: (param: Omit<SystemParameter, 'id'>) => Promise<void>;
    updateParameter: (id: string, param: Partial<SystemParameter>) => Promise<void>;
    deleteParameter: (id: string) => Promise<void>;
}
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'global_admin' | 'admin' | 'resident' | 'concierge' | 'owner' | 'user' | 'pending';
    profileId?: string;
    relatedId?: string; // ID of resident or personnel
    status: 'active' | 'inactive' | 'setting_up' | 'pending_approval';
    is_archived?: boolean;
    mustChangePassword?: boolean;
    password?: string;
    created_at: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
        photo?: string;
        relatedId?: string;
        profileId?: string;
        mustChangePassword?: boolean;
        permissions?: string[];
    } | null;
}

export interface UserContextType {
    users: User[];
    addUser: (user: Omit<User, 'id' | 'created_at'>) => Promise<void>;
    updateUser: (id: string, user: Omit<User, 'id' | 'created_at'>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    resetPassword: (id: string, newPassword: string) => Promise<void>;
}

export interface SystemSettings {
    system_name: string;
    system_icon: string;
    system_logo?: string; // Base64 del logo personalizado
    system_favicon?: string; // Base64 del favicon personalizado
    camera_backup_days: number;
    darkMode: boolean;
    theme?: 'light' | 'dark' | 'modern';
    // Datos del Administrador/Condominio
    admin_name?: string;
    admin_rut?: string;
    condo_rut?: string;
    condo_address?: string;
    admin_phone?: string;
    admin_signature?: string; // Base64 de la firma
    deletion_password?: string;
    vacation_accrual_rate?: number;
    // Email Config
    smtp_host?: string;
    smtp_port?: number;
    smtp_user?: string;
    smtp_password?: string;
    smtp_from?: string;
    smtp_bcc?: string; // Correo en copia (registro)
    concierge_email?: string; // Correo para recibir notificaciones de conserjería
    email_triggers?: {
        expenses?: boolean;
        visits?: boolean;
        correspondence?: boolean;
        reservations?: boolean;
        systemAnnouncements?: boolean;
        suggestions?: boolean;
    };
    // Gestión de Cobranza
    payment_deadline_day?: number; // Día del mes límite de pago
    max_arrears_months?: number; // Meses de mora máximos antes de alerta crítica
    arrears_fine_amount?: number; // Monto de multa fija por mora
    arrears_fine_percentage?: number; // % de multa por mora (si aplica)
    census_frequency_years?: number; // Frecuencia de censo en años
    
    // System Doctor (v3.5.0+)
    doctor_alert_enabled?: boolean;
    doctor_threshold_warning?: number;
    doctor_threshold_error?: number;
    doctor_cooldown_min?: number;
    doctor_webhook_url?: string;
}

export interface IPCProjection {
    id: string;
    name: string;
    ipc_rate: number;      // Valor del IPC Real
    ponderado_rate: number; // Valor del IPC Ponderado
    description?: string;
    is_active: boolean;
    created_at: string;
}

export interface SettingsContextType {
    settings: SystemSettings;
    updateSettings: (newSettings: SystemSettings) => void;
    toggleTheme: () => void;
    setTheme: (theme: 'light' | 'dark' | 'modern') => void;
}

export interface EmergencyContact {
    names: string;
    last_names: string;
    phone: string;
}

export interface Personnel {
    id: string;
    names: string;
    last_names: string;
    dni: string;
    phone?: string;
    email?: string;
    photo?: string; // Base64
    is_honorary: boolean;
    bank_id?: string;
    account_number?: string;
    base_salary: number;
    vacation_days: number;
    health_provider_id?: string;
    has_complementary_insurance?: boolean;
    complementary_insurance_type?: 'percentage' | 'amount';
    complementary_insurance_value?: number;
    pension_fund_id?: string;
    has_apv?: boolean;
    apv_type?: 'percentage' | 'amount';
    apv_value?: number;
    address: string;
    has_emergency_contact: boolean;
    emergency_contact?: EmergencyContact;
    medical_info?: string;
    role?: string;
    contract_type?: 'honorarios' | 'plazo' | 'indefinido';
    assigned_shift?: 'Manana' | 'Tarde' | 'Noche';
    vacation_last_update?: string;
    assigned_articles?: AssignedArticle[];
    status: 'active' | 'inactive';
    is_archived?: boolean;
    created_at: string;
    jornada_group_id?: string;
}

export interface Bank {
    id: string;
    name: string;
    is_archived?: boolean;
}

export interface BankContextType {
    banks: Bank[];
    addBank: (bank: Omit<Bank, 'id'>) => Promise<string>;
    updateBank: (bank: Bank) => Promise<void>;
    deleteBank: (id: string) => Promise<void>;
}

export interface Article {
    id: string;
    name: string;
    description?: string;
    category: string;
    unit: string;
    price: number;
    stock: number;
    minStock: number;
    isActive: boolean;
    allowPersonnelRequest: boolean;
    is_archived?: boolean;
}

export interface AssignedArticle {
    id: string;
    article_id: string;
    size?: string; // Talla o número
    quantity: number;
    assigned_at: string;
    notes?: string;
}

export interface ArticleContextType {
    articles: Article[];
    addArticle: (article: Omit<Article, 'id'>) => Promise<void>;
    updateArticle: (article: Article) => Promise<void>;
    deleteArticle: (id: string) => Promise<void>;
    decreaseStock: (articleId: string, quantity: number) => Promise<void>;
}


export interface CommonSpace {
    id: string;
    name: string;
    location: string;
    rental_value: number; // Valor entero ($)
    duration_hours: number; // Duración por defecto en horas (entero)
    conditions?: string; // Leyenda con condiciones y reglas
    is_archived?: boolean;
}

export interface Reservation {
    id: string;
    folio: string;
    common_space_id: string;
    resident_id: string; // Quien reserva
    unit_id?: string;
    tower_id?: string;
    start_at: string; // ISO
    end_at: string; // ISO
    status: 'pending' | 'approved' | 'cancelled' | 'completed' | 'rejected';
    payment_status: 'pending' | 'paid';
    is_archived?: boolean;
    created_at: string; // Timestamp
    approval_user_id?: string;
    approval_date?: string;
    signed_document_url?: string;
    notes?: string;
}

export interface ReservationLog {
    id: string;
    reservation_id: string;
    resident_id: string; // The person who performed the action
    action: 'created' | 'approved' | 'rejected' | 'payment_confirmed' | 'cancelled' | 'updated';
    details: string;
    timestamp: string;
}

export interface HistoryLog {
    id: string;
    entityType: 'department' | 'owner' | 'resident' | 'personnel' | 'reservation';
    entityId: string;
    unitId?: string; // Vinculo permanente con la unidad física
    action: 'created' | 'updated' | 'deleted' | 'owner_change' | 'resident_change' | 'approval' | 'archived' | 'status_change';
    previousValue?: any;
    newValue?: any;
    details: string;
    timestamp: string;
}

export interface SpecialCondition {
    id: string;
    name: string;
    description?: string;
    is_archived?: boolean;
}

export interface UnitType {
    id: string;
    nombre: string;
    base_common_expense: number; // Monto base para gastos comunes
    default_m2?: number; // Metraje por defecto
    is_archived?: boolean;
}

export interface Department {
    id: string;
    tower_id?: string;
    number: string;
    floor?: number;
    unit_type_id?: string;
    property_role?: string;
    m2?: number;
    terrain_m2?: number;
    value?: number;
    dormitorios?: number;
    banos?: number;
    estacionamientos?: number;
    year_built?: number;
    is_available?: boolean;
    publish_type?: 'venta' | 'arriendo';
    image?: string;
    location_map_url?: string;
    water_client_id?: string;
    electricity_client_id?: string;
    gas_client_id?: string;
    owner_id?: string;
    resident_id?: string;
    last_census_date?: string; // Fecha del último censo
    is_archived?: boolean;
    history?: HistoryLog[];
    tower?: { name: string };
    unit_type?: { nombre: string };
}

export interface Tower {
    id: string;
    name: string;
    is_archived?: boolean;
    departments: Department[];
}

export interface Owner {
    id: string;
    names: string;
    last_names: string;
    dni: string;
    phone: string;
    email: string;
    notes?: string;
    status: 'active' | 'inactive';
    is_archived?: boolean;
    receive_resident_notifications?: boolean;
    can_resident_see_arrears?: boolean; // Permite que el residente vea el reporte de deudas
    created_at: string;
    departments?: Department[];
}

export interface Parking {
    id: string;
    number: string;
    location?: string;
    is_handicapped?: boolean;
    notes?: string;
    department_id?: string; // Unidad asociada
    related_unit?: string; // Nombre/Número de la unidad (para despliegue rápido)
    is_archived?: boolean;
    created_at: string;
    department?: Department;
}

export interface Resident {
    id: string;
    names: string;
    last_names: string;
    dni: string;
    phone: string;
    email: string;
    photo?: string; // Base64 image
    tower_id?: string;
    unit_id?: string;
    parking_ids?: string[]; // IDs for associated parking spots
    family_count: number;
    has_pets: boolean;
    condition_ids: string[]; // Maestra de condiciones especiales
    notes?: string;
    is_tenant: boolean;
    rent_amount?: number;
    status: 'active' | 'inactive';
    is_archived?: boolean;
    created_at: string;
    departments?: Department[];
}

export interface ParkingContextType {
    parkings: Parking[];
    addParking: (parking: Omit<Parking, 'id' | 'created_at'>) => Promise<void>;
    updateParking: (parking: Parking) => Promise<void>;
    deleteParking: (id: string) => Promise<void>;
}

export interface SpecialConditionContextType {
    conditions: SpecialCondition[];
    addCondition: (condition: Omit<SpecialCondition, 'id'>) => Promise<void>;
    updateCondition: (condition: SpecialCondition) => Promise<void>;
    deleteCondition: (id: string) => Promise<void>;
}

export interface UnitTypeContextType {
    unit_types: UnitType[];
    addUnitType: (unit_type: Omit<UnitType, 'id'>) => Promise<UnitType | undefined>;
    updateUnitType: (unit_type: UnitType) => Promise<void>;
    deleteUnitType: (id: string) => Promise<void>;
}

export interface OwnerContextType {
    owners: Owner[];
    addOwner: (owner: Omit<Owner, 'id' | 'created_at' | 'status'>) => Promise<string>;
    updateOwner: (owner: Owner) => Promise<void>;
    deleteOwner: (id: string) => Promise<void>;
}

export interface ResidentContextType {
    residents: Resident[];
    addResident: (resident: Omit<Resident, 'id' | 'created_at' | 'status'>) => Promise<Resident | undefined>;
    updateResident: (resident: Resident) => Promise<void>;
    deleteResident: (id: string) => Promise<void>;
    uploadResidents: (file: File) => Promise<{ message: string }>;
}

export interface CommonSpaceContextType {
    spaces: CommonSpace[];
    addSpace: (space: Omit<CommonSpace, 'id'>) => Promise<void>;
    updateSpace: (space: CommonSpace) => Promise<void>;
    deleteSpace: (id: string) => Promise<void>;
}

export interface ReservationContextType {
    reservations: Reservation[];
    reservationLogs: ReservationLog[];
    addReservation: (reservation: Omit<Reservation, 'id' | 'folio' | 'created_at' | 'status' | 'paymentStatus'>) => Promise<void>;
    updateReservation: (reservation: Reservation) => Promise<void>;
    deleteReservation: (id: string) => Promise<void>;
    approveReservation: (id: string, adminId: string) => Promise<void>;
    rejectReservation: (id: string, adminId: string, reason: string) => Promise<void>;
    confirmPayment: (id: string, adminId: string) => Promise<void>;
    uploadSignedDocument: (id: string, url: string) => Promise<void>;
}

export interface Ticket {
    id: string;
    folio: string;
    resident_id: string;
    unit_id?: string;
    tower_id?: string;
    type: string;
    subject: string;
    description: string;
    image?: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    admin_notes?: string;
    acknowledged_at?: string;
    acknowledged_by?: string;
    is_archived?: boolean;
    created_at: string;
    updated_at: string;
}

export interface TicketContextType {
    tickets: Ticket[];
    addTicket: (ticket_data: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'folio' | 'is_archived'>) => Promise<Ticket>;
    updateTicket: (id: string, ticket_data: Partial<Ticket>) => Promise<void>;
    deleteTicket: (id: string) => Promise<void>;
    updateTicketStatus: (id: string, status: Ticket['status']) => Promise<void>;
    addSolutionNote: (id: string, notes: string) => Promise<void>;
    refreshTickets: () => Promise<void>;
}

export interface ServiceDirectory {
    id: string;
    name: string;
    category: string;
    contact_phone?: string;
    contact_email?: string;
    description?: string;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

export interface ServiceDirectoryContextType {
    services: ServiceDirectory[];
    addService: (service: Omit<ServiceDirectory, 'id' | 'created_at' | 'updated_at' | 'is_archived'>) => Promise<void>;
    updateService: (id: string, service: Partial<ServiceDirectory>) => Promise<void>;
    deleteService: (id: string) => Promise<void>;
    refreshServices: () => Promise<void>;
}

export interface CameraRequest {
    id: string;
    folio: string;
    user_id: string;
    resident_name?: string; // Nombre completo del residente
    unitId?: string; // Unidad (Ej: Torre A - 101)
    cameraId: string; // O ubicación de la cámara
    date: string;
    start_time: string;
    end_time: string;
    reason: string;
    status: 'pending' | 'attended' | 'rejected';
    created_at: string;
    admin_notes?: string;
}

export interface CameraRequestContextType {
    requests: CameraRequest[];
    addRequest: (request: Omit<CameraRequest, 'id' | 'folio' | 'status' | 'created_at'>) => Promise<void>;
    updateRequestStatus: (id: string, status: CameraRequest['status'], admin_notes?: string) => Promise<void>;
    deleteRequest: (id: string) => Promise<void>;
}

export interface InfrastructureContextType {
    towers: Tower[];
    departments: Department[];
    addTower: (tower: Omit<Tower, 'id'>) => Promise<Tower | undefined>;
    updateTower: (tower: Tower) => Promise<void>;
    deleteTower: (id: string) => Promise<void>;
    duplicateTower: (id: string, newName: string) => Promise<void>;
    addDepartment: (dept: Omit<Department, 'id'>) => Promise<Department | undefined>;
    updateDepartment: (dept: Department) => Promise<void>;
    deleteDepartment: (id: string) => Promise<void>;
    fetchAll: () => Promise<void>;
}

export interface HealthProvider {
    id: string;
    name: string;
    type: 'fonasa' | 'isapre';
    discount_rate: number; // % de descuento
    is_archived?: boolean;
}

export interface PensionFund {
    id: string;
    name: string;
    discount_rate: number; // % de descuento fijo/variable
    is_archived?: boolean;
}

export interface AFC {
    id: string;
    name: string;
    fixed_term_rate: number;    // % Seguro Cesantía Trabajador a Plazo
    indefinite_term_rate: number; // % Seguro Cesantía Trabajador Indefinido
    is_active: boolean;
    created_at: string;
}

export interface Holiday {
    id: string;
    date: string;
    description: string;
    is_archived?: boolean;
    created_at: string;
}

export interface HealthProviderContextType {
    providers: HealthProvider[];
    addProvider: (provider: Omit<HealthProvider, 'id'>) => Promise<void>;
    updateProvider: (provider: HealthProvider) => Promise<void>;
    deleteProvider: (id: string) => Promise<void>;
}

export interface PensionFundContextType {
    funds: PensionFund[];
    addFund: (fund: Omit<PensionFund, 'id'>) => Promise<void>;
    updateFund: (fund: PensionFund) => Promise<void>;
    deleteFund: (id: string) => Promise<void>;
}

export interface AFCContextType {
    afcs: AFC[];
    addAFC: (afc: Omit<AFC, 'id' | 'created_at'>) => Promise<void>;
    updateAFC: (afc: AFC) => Promise<void>;
    deleteAFC: (id: string) => Promise<void>;
}

export interface HolidayContextType {
    holidays: Holiday[];
    addHoliday: (holiday: Omit<Holiday, 'id' | 'created_at'>) => Promise<void>;
    updateHoliday: (holiday: Holiday) => Promise<void>;
    deleteHoliday: (id: string) => Promise<void>;
}

export interface ProfilePermissions {
    // Maestros y Configuración
    canViewPersonnel: boolean;
    canManagePersonnel: boolean;
    canViewPrevisiones: boolean;
    canManagePrevisiones: boolean;
    canViewAFPs: boolean;
    canManageAFPs: boolean;
    canViewUsers: boolean;
    canManageUsers: boolean;
    canViewProfiles: boolean;
    canManageProfiles: boolean;
    canViewSettings: boolean;
    canManageSettings: boolean;
    canViewInfrastructure: boolean;
    canManageInfrastructure: boolean;
    canViewResidents: boolean;
    canManageResidents: boolean;
    canViewOwners: boolean;
    canManageOwners: boolean;
    canViewUnitTypes: boolean;
    canManageUnitTypes: boolean;
    canViewParking: boolean;
    canManageParking: boolean;
    canViewCommonSpaces: boolean;
    canManageCommonSpaces: boolean;
    canViewArticles: boolean;
    canManageArticles: boolean;
    canViewContractors: boolean;
    canManageContractors: boolean;
    canViewFixedAssets: boolean;
    canManageFixedAssets: boolean;
    canViewEmergencyNumbers: boolean;
    canManageEmergencyNumbers: boolean;
    canViewOperationalMasters: boolean;
    canManageOperationalMasters: boolean;

    // Operativa y Gestión
    canViewCommonExpenses: boolean;
    canManageCommonExpenses: boolean;
    canViewCertificates: boolean;
    canManageCertificates: boolean;
    canViewVisitors: boolean;
    canManageVisitors: boolean;
    canViewShiftReports: boolean;
    canManageShiftReports: boolean;
    canViewCorrespondence: boolean;
    canManageCorrespondence: boolean;
    canViewTickets: boolean;
    canManageTickets: boolean;
    canViewCameraRequests: boolean;
    canManageCameraRequests: boolean;
    canViewReservations: boolean;
    canManageReservations: boolean;
    canViewSystemMessages: boolean;
    canManageSystemMessages: boolean;
    canViewArticleDeliveries: boolean;
    canManageArticleDeliveries: boolean;
    canViewPayslips: boolean;
    canManagePayslips: boolean;
}

export interface Profile {
    id: string;
    name: string;
    permissions: ProfilePermissions;
    is_archived?: boolean;
}

export interface ProfileContextType {
    profiles: Profile[];
    addProfile: (profile: Omit<Profile, 'id'>) => Promise<void>;
    updateProfile: (profile: Profile) => Promise<void>;
    deleteProfile: (id: string) => Promise<void>;
}

export interface PersonnelContextType {
    personnel: Personnel[];
    addPersonnel: (person: Omit<Personnel, 'id' | 'created_at' | 'status'>) => Promise<Personnel | undefined>;
    updatePersonnel: (person: Personnel) => Promise<void>;
    deletePersonnel: (id: string) => Promise<void>;
    uploadPersonnel: (file: File) => Promise<{ message: string }>;
}

export interface SystemMessage {
    id: string;
    text: string;
    type: 'info' | 'warning' | 'danger' | 'success';
    is_active: boolean;
    image?: string;
    youtube_url?: string;
    duration_seconds?: number;
    is_full_image?: boolean; // Si la imagen debe ocupar gran parte del aviso
    expires_at?: string;
    tags?: string[];
    is_archived?: boolean;
    created_at: string;
}

export interface SystemMessageContextType {
    messages: SystemMessage[];
    addMessage: (message: Omit<SystemMessage, 'id' | 'created_at'>) => Promise<void>;
    updateMessage: (message: SystemMessage) => Promise<void>;
    deleteMessage: (id: string) => Promise<void>;
    toggleMessageStatus: (id: string) => Promise<void>;
}

export interface DirectedMessage {
    id: string;
    unitId?: string;
    text: string;
    type: 'info' | 'warning' | 'danger' | 'success';
    isActive: boolean;
    created_at: string;
}

export interface DirectedMessageContextType {
    messages: DirectedMessage[];
    addMessage: (message: Omit<DirectedMessage, 'id' | 'created_at'>) => Promise<void>;
    updateMessage: (message: DirectedMessage) => Promise<void>;
    deleteMessage: (id: string) => Promise<void>;
}

export interface ArticleDelivery {
    id: string;
    folio: string;
    personnel_id: string;
    delivery_date: string; // Fecha en que se entregó físicamente
    created_at: string;    // Fecha en que se registró en sistema
    articles: {
        article_id: string;
        quantity: number;
        size?: string;
    }[];
    notes?: string;
    status: 'active' | 'voided';
    signed_document?: string; // Base64 of signed document
}

export interface ArticleDeliveryContextType {
    deliveries: ArticleDelivery[];
    addDelivery: (delivery: Omit<ArticleDelivery, 'id' | 'folio' | 'created_at'>) => Promise<string>;
    updateDelivery: (delivery: ArticleDelivery) => Promise<void>;
    deleteDelivery: (id: string) => Promise<void>;
    setDeliveries: React.Dispatch<React.SetStateAction<ArticleDelivery[]>>;
}

export interface ExtraordinaryQuota {
    id: string;
    amount: number;
    description: string;
}

export interface FundUnitTypeConfig {
    unit_type_id: string;
    calculationType: 'fixed' | 'percentage';
    value: number; // Fixed amount or % of Base Common Expense
    isExempt: boolean;
}

export interface JornadaSchedule {
    days: number[]; // 0-6 (Sun-Sat)
    start_time: string;
    end_time: string;
}

export interface JornadaGroup {
    id: string;
    name: string;
    description?: string;
    workDays: number[]; // Mantener para compatibilidad
    start_time?: string;
    end_time?: string;
    isActive: boolean;
    is_archived?: boolean;
    schedules?: JornadaSchedule[];
    breakMinutes?: number;
}

export interface FundExpense {
    id: string;
    amount: number;
    description: string;
    date: string;
}

export interface SpecialFund {
    id: string;
    type: 'reserve' | 'extraordinary';
    name: string;
    description: string;
    total_amount_per_unit: number; 
    total_project_amount?: number; 
    is_active: boolean;
    deadline?: string;
    unit_configs?: FundUnitTypeConfig[];
    expenses?: FundExpense[];
    fund_code: number;
    is_archived: boolean;
    created_at: string;
}

export interface CommonExpenseRule {
    id: string;
    unit_type_id?: string;
    amount: number;
    effective_from: string;
    description?: string;
    is_archived: boolean;
    created_at: string;
}

export interface ChargeRule {
    id: string;
    name: string;
    rule_type: 'fixed' | 'percentage' | 'interest' | 'penalty';
    value: number;
    applies_to: 'global' | 'unit_type' | 'department';
    target_id?: string;
    is_active: boolean;
    is_archived: boolean;
    created_at: string;
}

export interface Payment {
    id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference?: string;
    resident_id?: string;
    department_id?: string;
    common_expense_payment_id: string;
    is_archived: boolean;
    created_at: string;
}

export interface FundContribution {
    fund_id: string;
    amount: number;
}

export interface CommonExpensePayment {
    id: string;
    department_id: string;
    common_expense_id?: string;
    period_month: number;
    period_year: number;
    amount_paid: number;
    payment_date: string;
    status: 'paid' | 'unpaid' | 'mora';
    payment_method?: string;
    receipt_folio?: string;
    evidence_image?: string;
    notes?: string;
    is_electronic: boolean;
    fund_contributions?: FundContribution[];
    is_archived: boolean;
    created_at: string;
}

export interface CommunityExpense {
    id: string;
    description: string;
    amount: number;
    category_id?: string;
    category_name: 'Sueldos' | 'Mantención' | 'Seguros' | 'Servicios Básicos' | 'Administración' | 'Otros' | 'Reparaciones';
    expense_date: string;
    receipt_url?: string;
    receiptImages?: string[];
    payment_method?: string;
    reference?: string;
    is_archived: boolean;
    is_projected: boolean;
    created_at: string;
}

export interface CommonExpenseContextType {
    payments: CommonExpensePayment[];
    funds: SpecialFund[];
    rules: CommonExpenseRule[];
    communityExpenses: CommunityExpense[];
    fetchPayments: () => Promise<void>;
    fetchFunds: (includeArchived?: boolean) => Promise<void>;
    fetchCommunityExpenses: (includeArchived?: boolean) => Promise<void>;
    addPayment: (payment: Omit<CommonExpensePayment, 'id' | 'created_at'>) => Promise<void>;
    updatePayment: (payment: CommonExpensePayment) => Promise<void>;
    deletePayment: (id: string) => Promise<void>;
    addFund: (fund: Omit<SpecialFund, 'id' | 'created_at'>) => Promise<void>;
    updateFund: (fund: SpecialFund) => Promise<void>;
    deleteFund: (id: string) => Promise<void>;
    restoreFund: (id: string) => Promise<void>;
    addRule: (rule: Omit<CommonExpenseRule, 'id' | 'created_at'>) => Promise<void>;
    calculateAmount: (deptId: string) => Promise<{ suggestedAmount: number, ruleUsed: string }>;
    addCommunityExpense: (expense: Omit<CommunityExpense, 'id' | 'created_at'>) => Promise<void>;
    deleteCommunityExpense: (id: string) => Promise<void>;
    chargeRules: ChargeRule[];
    fetchChargeRules: () => Promise<void>;
    addChargeRule: (rule: Omit<ChargeRule, 'id' | 'created_at'>) => Promise<void>;
    deleteChargeRule: (id: string) => Promise<void>;
    actualPayments: Payment[];
    fetchActualPayments: () => Promise<void>;
    addActualPayment: (transaction: Omit<Payment, 'id' | 'created_at'>) => Promise<void>;
    deleteActualPayment: (id: string) => Promise<void>;
}

export interface MaintenanceRecord {
    id: string;
    folio: string;
    date: string;
    description: string;
    technicianName: string;
    cost?: number;
    observations?: string;
}

export interface FixedAsset {
    id: string;
    description: string;
    quantity: number;
    purchasePrice: number;
    depreciatedValue: number;
    model: string;
    details: string;
    isActive: boolean;
    image?: string;
    purchaseDate: string;
    requiresMaintenance?: boolean;
    nextMaintenanceDate?: string;
    maintenanceHistory?: MaintenanceRecord[];
    is_archived?: boolean;
    created_at: string;
}

export interface FixedAssetContextType {
    assets: FixedAsset[];
    addAsset: (asset: Omit<FixedAsset, 'id' | 'created_at'>) => Promise<void>;
    updateAsset: (asset: FixedAsset) => Promise<void>;
    deleteAsset: (id: string) => Promise<void>;
}

export interface AuthContextType extends AuthState {
    login: (username: string, pass: string) => Promise<boolean>;
    loginWithGoogle: (email: string, name: string, photoUrl?: string) => Promise<boolean>;
    logout: () => void;
    updateUserAuthData: (data: Partial<NonNullable<AuthState['user']>>) => void;
    changePassword: (newPassword: string) => Promise<void>;
}

export interface Correspondence {
    id: string;
    folio: string;
    department_id: string;
    tower_id: string;
    type: 'package' | 'letter' | 'delivery' | 'other';
    addressee: string;
    received_by?: string; // Personnel ID or name
    courier?: string;
    details?: string;
    evidence_image?: string;
    status: 'pending' | 'received' | 'notified' | 'delivered' | 'expected';
    received_at?: string;
    delivered_at?: string;
    expected_date?: string;
    expected_time_range?: string;
    is_archived?: boolean;
    created_at: string;
}

export interface CorrespondenceContextType {
    items: Correspondence[];
    addItem: (item: Omit<Correspondence, 'id' | 'folio' | 'created_at'>) => Promise<void>;
    updateItemStatus: (id: string, status: Correspondence['status'], deliveredAt?: string) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
}

export interface Contractor {
    id: string;
    folio: string;
    name: string;
    specialty: string; // Eléctrica, Hidropack, etc.
    monthlyPaymentAmount?: number;
    hoursOfService?: string;
    phone: string;
    email: string;
    escalationContact?: string; // Nombre de contacto para escalamiento
    escalationPhone?: string; // Teléfono de contacto para escalamiento
    notes?: string;
    isActive: boolean;
    maintenanceFrequency?: 'monthly' | 'half-yearly' | 'annual' | 'none';
    lastMaintenanceDate?: string;
    showToResidents?: boolean;
    created_at: string;
}

export interface ContractorContextType {
    contractors: Contractor[];
    addContractor: (contractor: Omit<Contractor, 'id' | 'folio' | 'created_at'>) => Promise<void>;
    updateContractor: (contractor: Contractor) => Promise<void>;
    deleteContractor: (id: string) => Promise<void>;
}

export interface ContractorVisit {
    id: string;
    folio: string;
    contractor_id?: string; // If registered in master
    names: string;
    dni: string;
    company: string;
    subject: string;
    entry_at: string;
    exit_at?: string;
    allowed_until?: string;
    department_id?: string;
    status: 'active' | 'exited' | 'expired';
    is_archived?: boolean;
    created_at: string;
}

export interface ContractorVisitContextType {
    visits: ContractorVisit[];
    addVisit: (visit: Omit<ContractorVisit, 'id' | 'folio' | 'created_at' | 'status'>) => Promise<void>;
    updateVisitStatus: (id: string, status: ContractorVisit['status']) => Promise<void>;
}

export interface Visitor {
    id: string;
    folio: string;
    names: string;
    dni: string;
    tower_id: string;
    department_id: string;
    resident_id?: string;
    visit_date: string;
    visit_time?: string;
    is_pre_registered: boolean; // Si fue registrado por el residente
    status: 'scheduled' | 'entered' | 'exited' | 'cancelled';
    entry_at?: string;
    exit_at?: string;
    vehicle_plate?: string;
    notes?: string;
    is_archived?: boolean;
    created_at: string;
}

export interface VisitorContextType {
    visitors: Visitor[];
    addVisitor: (visitor: Omit<Visitor, 'id' | 'folio' | 'created_at'>) => Promise<void>;
    updateVisitorStatus: (id: string, status: Visitor['status'], time?: string) => Promise<void>;
    deleteVisitor: (id: string) => Promise<void>;
}

export interface InfrastructureItem {
    id: string;
    name: string;
    isMandatory?: boolean;
    is_archived?: boolean;
    created_at: string;
}

export interface EquipmentItem {
    id: string;
    name: string;
    isMandatory?: boolean;
    is_archived?: boolean;
    created_at: string;
}

export interface InfrastructureItemContextType {
    items: InfrastructureItem[];
    addItem: (item: Omit<InfrastructureItem, 'id' | 'created_at'>) => Promise<void>;
    updateItem: (item: InfrastructureItem) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
}

export interface EquipmentItemContextType {
    items: EquipmentItem[];
    addItem: (item: Omit<EquipmentItem, 'id' | 'created_at'>) => Promise<void>;
    updateItem: (item: EquipmentItem) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
}

export interface Camera {
    id: string;
    name: string;
    description?: string;
    backup_hours: number;
    is_archived?: boolean;
    created_at: string;
}

export interface CameraContextType {
    cameras: Camera[];
    addCamera: (camera: Omit<Camera, 'id' | 'created_at'>) => Promise<void>;
    updateCamera: (camera: Camera) => Promise<void>;
    deleteCamera: (id: string) => Promise<void>;
}

export interface ShiftReport {
    id: string;
    folio: string;
    concierge_id: string;
    concierge_name: string;
    shift_date: string;
    shift_type: 'Manana' | 'Tarde' | 'Noche';
    status: 'open' | 'closed';
    novedades: string;
    has_incidents: boolean;
    incident_details?: string;
    incident_attachments?: string[]; // Base64 strings
    has_infrastructure_issues: boolean;
    infrastructure_issue_type?: string; 
    infrastructure_issue_types?: string[]; 
    infrastructure_issue_details?: string;
    infrastructure_attachments?: string[];
    has_equipment_issues: boolean;
    equipment_issue_type?: string; 
    equipment_issue_types?: string[]; 
    equipment_issue_details?: string;
    equipment_attachments?: string[];
    closed_at?: string;
    admin_reopen_reason?: string;
    admin_reopened_by?: string;
    created_at: string;
    is_archived?: boolean;
    resident_id?: string;
    owner_id?: string;
    department_id?: string;
}

export interface ShiftReportContextType {
    reports: ShiftReport[];
    addReport: (report: Omit<ShiftReport, 'id' | 'folio' | 'created_at' | 'status' | 'has_incidents' | 'has_infrastructure_issues' | 'has_equipment_issues'>) => Promise<boolean>;
    updateReport: (id: string, data: Partial<ShiftReport>) => Promise<void>;
    closeShift: (id: string, data: Partial<ShiftReport>) => Promise<void>;
    reopenShift: (id: string, admin_name: string, reason: string) => Promise<void>;
    deleteReport: (id: string) => Promise<void>;
    clearAllReports: () => void;
}

export interface ShiftLog {
    id: string;
    daily_report_id: string;
    timestamp: string;
    event: string;
    category?: 'routine' | 'incident' | 'check';
    concierge_id: string;
    is_archived?: boolean;
    created_at: string;
}

export interface EmergencyNumber {
    id: string;
    category: string;
    name: string;
    phone: string;
    description?: string;
    web_url?: string;
    is_archived?: boolean;
    created_at: string;
    updated_at?: string;
}

export interface EmergencyNumberContextType {
    numbers: EmergencyNumber[];
    addNumber: (number: Omit<EmergencyNumber, 'id' | 'created_at'>) => Promise<void>;
    updateNumber: (id: string, number: Omit<EmergencyNumber, 'id' | 'created_at'>) => Promise<void>;
    deleteNumber: (id: string) => Promise<void>;
}

export interface Certificate {
    id: string;
    folio: string;
    type: 'residencia' | 'gastos' | 'estado_cuenta' | 'liquidacion';
    resident_name: string;
    resident_rut: string;
    resident_address: string;
    generated_at: string;
    admin_name: string;
    admin_rut: string;
    condo_name: string;
    condo_rut: string;
    condo_address: string;
    financial_data?: {
        common_expense_debt: number;
        extraordinary_debt: number;
        reserve_debt: number;
        total_debt: number;
        last_payment_date?: string;
    };
}

export interface CertificateContextType {
    certificates: Certificate[];
    addCertificate: (certificate: Omit<Certificate, 'id' | 'folio' | 'generated_at'>) => Promise<Certificate>;
    deleteCertificate: (id: string) => Promise<void>;
}

export interface Advance {
    id: string;
    personnel_id: string;
    amount: number;
    date: string;
    description: string;
    status: 'pending' | 'deducted' | 'cancelled';
    payslip_id?: string;
}

export interface Payslip {
    id: string;
    folio: string;
    personnel_id: string;
    month: number;
    year: number;
    base_salary: number;
    gross_salary: number;
    worked_days: number;
    adjusted_worked_days?: number;
    health_discount: number;
    pension_discount: number;
    apv_discount: number;
    insurance_discount: number;
    advances_discount: number;
    total_deductions: number;
    net_salary: number;
    generated_at: string;
    bonus_points?: number; // Optional extras
}

export interface PayslipContextType {
    payslips: Payslip[];
    advances: Advance[];
    addPayslip: (payslip: Omit<Payslip, 'id' | 'folio' | 'generated_at'>) => Promise<Payslip>;
    deletePayslip: (id: string) => Promise<void>;
    addAdvance: (advance: Omit<Advance, 'id' | 'status'>) => Promise<string>;
    updateAdvanceStatus: (id: string, status: Advance['status'], payslip_id?: string) => Promise<void>;
    deleteAdvance: (id: string) => Promise<void>;
}

export interface CommunicationTemplate {
    id: string;
    name: string;
    subject: string;
    message: string;
    type: 'general' | 'arrears' | 'emergency';
    is_archived?: boolean;
    created_at: string;
}

export interface CommunicationHistory {
    id: string;
    subject: string;
    message: string;
    recipients: string[]; // Lista de correos
    sender_id: string;
    attachment_url?: string;
    target_filter: string; // Resumen del filtro aplicado
    is_archived?: boolean;
    created_at: string;
}

export interface CommunicationContextType {
    templates: CommunicationTemplate[];
    history: CommunicationHistory[];
    addTemplate: (template: Omit<CommunicationTemplate, 'id' | 'created_at'>) => Promise<void>;
    updateTemplate: (template: CommunicationTemplate) => Promise<void>;
    deleteTemplate: (id: string) => Promise<void>;
    addHistory: (item: Omit<CommunicationHistory, 'id' | 'created_at'>) => Promise<void>;
}

export interface SupplyRequest {
    id: string;
    folio: string;
    name: string;
    description?: string;
    requested_by: string; // concierge_id
    status: 'pending' | 'approved' | 'rejected' | 'delivered';
    is_archived?: boolean;
    created_at: string;
}

export interface CctvLog {
    id: string;
    folio: string;
    camera_id: string;
    event_type: 'intrusion' | 'movement' | 'error' | 'routine';
    description?: string;
    recorded_at: string;
    evidence_url?: string;
    is_archived?: boolean;
    created_at: string;
}
