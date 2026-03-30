export interface User {
    id: string;
    name: string;
    email: string;
    role: 'global_admin' | 'admin' | 'resident' | 'worker' | 'owner' | 'user' | 'pending';
    profileId?: string;
    relatedId?: string; // ID of resident or personnel
    status: 'active' | 'inactive' | 'setting_up' | 'pending_approval';
    isArchived?: boolean;
    mustChangePassword?: boolean;
    password?: string;
    createdAt: string;
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
    } | null;
}

export interface UserContextType {
    users: User[];
    addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
    updateUser: (id: string, user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    resetPassword: (id: string, newPassword: string) => Promise<void>;
}

export interface SystemSettings {
    systemName: string;
    systemIcon: string;
    systemLogo?: string; // Base64 del logo personalizado
    systemFavicon?: string; // Base64 del favicon personalizado
    cameraBackupDays: number;
    darkMode: boolean;
    theme?: 'light' | 'dark' | 'modern';
    // Datos del Administrador/Condominio
    adminName?: string;
    adminRut?: string;
    condoRut?: string;
    condoAddress?: string;
    adminPhone?: string;
    adminSignature?: string; // Base64 de la firma
    deletionPassword?: string;
    vacationAccrualRate?: number;
    // Email Config
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    smtpFrom?: string;
    smtpBcc?: string; // Correo en copia (registro)
    conciergeEmail?: string; // Correo para recibir notificaciones de conserjería
    emailTriggers?: {
        expenses?: boolean;
        visits?: boolean;
        correspondence?: boolean;
        reservations?: boolean;
        systemAnnouncements?: boolean;
        suggestions?: boolean;
    };
}

export interface SettingsContextType {
    settings: SystemSettings;
    updateSettings: (newSettings: SystemSettings) => void;
    toggleTheme: () => void;
    setTheme: (theme: 'light' | 'dark' | 'modern') => void;
}

export interface EmergencyContact {
    names: string;
    lastNames: string;
    phone: string;
}

export interface Personnel {
    id: string;
    names: string;
    lastNames: string;
    dni: string;
    phone?: string;
    email?: string;
    photo?: string; // Base64
    isHonorary: boolean;
    bankId?: string;
    accountNumber?: string;
    baseSalary: number;
    vacationDays: number;
    healthInsuranceId?: string;
    hasComplementaryInsurance?: boolean;
    complementaryInsuranceType?: 'percentage' | 'amount';
    complementaryInsuranceValue?: number;
    pensionFundId?: string;
    hasAPV?: boolean;
    apvType?: 'percentage' | 'amount';
    apvValue?: number;
    address: string;
    hasEmergencyContact: boolean;
    emergencyContact?: EmergencyContact;
    medicalInfo?: string;
    position?: string;
    assignedShift?: 'Mañana' | 'Tarde' | 'Noche';
    vacationLastUpdate?: string;
    assignedArticles?: AssignedArticle[];
    status: 'active' | 'inactive';
    isArchived?: boolean;
    createdAt: string;
}

export interface Bank {
    id: string;
    name: string;
    isArchived?: boolean;
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
    category: 'EPP' | 'Aseo' | 'Oficina' | 'otro';
    price: number;
    stock: number;
    minStock: number;
    isActive: boolean;
    isArchived?: boolean;
}

export interface AssignedArticle {
    id: string;
    articleId: string;
    size?: string; // Talla o número
    quantity: number;
    assignedAt: string;
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
    rentalValue: number; // Valor entero ($)
    durationHours: number; // Duración por defecto en horas (entero)
    conditions?: string; // Leyenda con condiciones y reglas
    isArchived?: boolean;
}

export interface Reservation {
    id: string;
    folio: string;
    spaceId: string;
    userId: string; // Quien reserva
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm (calculado automáticamente)
    status: 'pending' | 'approved' | 'rejected';
    paymentStatus: 'pending' | 'paid';
    createdAt: string; // Timestamp para ver quien reservó primero
    approvalUserId?: string;
    approvalDate?: string;
    signedDocumentUrl?: string; // URL o base64 del documento firmado
    notes?: string;
}

export interface ReservationLog {
    id: string;
    reservationId: string;
    userId: string;
    action: 'created' | 'approved' | 'rejected' | 'payment_confirmed' | 'deleted';
    timestamp: string;
    details: string;
}

export interface HistoryLog {
    id: string;
    entityType: 'department' | 'owner' | 'resident' | 'personnel' | 'reservation';
    entityId: string;
    action: 'created' | 'updated' | 'deleted' | 'owner_change' | 'resident_change' | 'approval';
    previousValue?: any;
    newValue?: any;
    details: string;
    timestamp: string;
}

export interface SpecialCondition {
    id: string;
    name: string;
    description?: string;
    isArchived?: boolean;
}

export interface UnitType {
    id: string;
    name: string;
    baseCommonExpense: number; // Monto base para gastos comunes
    isArchived?: boolean;
}

export interface Department {
    id: string;
    towerId?: string;
    number: string;
    unitTypeId?: string;
    propertyRole?: string;
    m2?: number;
    waterClientId?: string;
    electricityClientId?: string;
    gasClientId?: string;
    ownerId?: string;
    residentId?: string;
    isArchived?: boolean;
    history?: HistoryLog[];
}

export interface Tower {
    id: string;
    name: string;
    isArchived?: boolean;
    departments: Department[];
}

export interface Owner {
    id: string;
    names: string;
    lastNames: string;
    dni: string;
    phone: string;
    email: string;
    notes?: string;
    status: 'active' | 'inactive';
    isArchived?: boolean;
    receiveResidentNotifications?: boolean;
    createdAt: string;
}

export interface Parking {
    id: string;
    number: string;
    location?: string; // Ej: Subterráneo -1
    isHandicapped?: boolean;
    notes?: string;
    isArchived?: boolean;
    createdAt: string;
}

export interface Resident {
    id: string;
    names: string;
    lastNames: string;
    dni: string;
    phone: string;
    email: string;
    photo?: string; // Base64 image
    towerId?: string;
    unitId?: string;
    parkingIds?: string[]; // IDs for associated parking spots
    familyCount: number;
    hasPets: boolean;
    conditionIds: string[]; // Maestra de condiciones especiales
    notes?: string;
    isTenant: boolean;
    rentAmount?: number;
    status: 'active' | 'inactive';
    isArchived?: boolean;
    createdAt: string;
}

export interface ParkingContextType {
    parkings: Parking[];
    addParking: (parking: Omit<Parking, 'id' | 'createdAt'>) => Promise<void>;
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
    unitTypes: UnitType[];
    addUnitType: (unitType: Omit<UnitType, 'id'>) => Promise<void>;
    updateUnitType: (unitType: UnitType) => Promise<void>;
    deleteUnitType: (id: string) => Promise<void>;
}

export interface OwnerContextType {
    owners: Owner[];
    addOwner: (owner: Omit<Owner, 'id' | 'createdAt' | 'status'>) => Promise<string>;
    updateOwner: (owner: Owner) => Promise<void>;
    deleteOwner: (id: string) => Promise<void>;
}

export interface ResidentContextType {
    residents: Resident[];
    addResident: (resident: Omit<Resident, 'id' | 'createdAt' | 'status'>) => Promise<string>;
    updateResident: (resident: Resident) => Promise<void>;
    deleteResident: (id: string) => Promise<void>;
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
    addReservation: (reservation: Omit<Reservation, 'id' | 'folio' | 'createdAt' | 'status' | 'paymentStatus'>) => Promise<void>;
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
    userId: string;
    unitId?: string;
    type: 'complaint' | 'suggestion';
    subject: string;
    description: string;
    image?: string; // Optional image base64
    status: 'pending' | 'read' | 'attended' | 'solved';
    createdAt: string;
    updatedAt: string;
    adminNotes?: string;
    history?: {
        status: string;
        notes: string;
        date: string;
        user: string;
    }[];
}

export interface TicketContextType {
    tickets: Ticket[];
    addTicket: (ticket: Omit<Ticket, 'id' | 'folio' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateTicketStatus: (id: string, status: Ticket['status'], adminNotes?: string) => Promise<void>;
    deleteTicket: (id: string) => Promise<void>;
}

export interface CameraRequest {
    id: string;
    folio: string;
    userId: string;
    residentName?: string; // Nombre completo del residente
    unitId?: string; // Unidad (Ej: Torre A - 101)
    cameraId: string; // O ubicación de la cámara
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
    status: 'pending' | 'attended' | 'rejected';
    createdAt: string;
    adminNotes?: string;
}

export interface CameraRequestContextType {
    requests: CameraRequest[];
    addRequest: (request: Omit<CameraRequest, 'id' | 'folio' | 'status' | 'createdAt'>) => Promise<void>;
    updateRequestStatus: (id: string, status: CameraRequest['status'], adminNotes?: string) => Promise<void>;
    deleteRequest: (id: string) => Promise<void>;
}

export interface InfrastructureContextType {
    towers: Tower[];
    departments: Department[];
    addTower: (tower: Omit<Tower, 'id'>) => Promise<void>;
    updateTower: (tower: Tower) => Promise<void>;
    deleteTower: (id: string) => Promise<void>;
    duplicateTower: (id: string, newName: string) => Promise<void>;
    deleteDepartment: (towerId: string, deptId: string) => Promise<void>;
}

export interface HealthProvider {
    id: string;
    name: string;
    type: 'fonasa' | 'isapre';
    discountRate: number; // % de descuento
    isArchived?: boolean;
}

export interface PensionFund {
    id: string;
    name: string;
    discountRate: number; // % de descuento fijo/variable
    isArchived?: boolean;
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
    isArchived?: boolean;
}

export interface ProfileContextType {
    profiles: Profile[];
    addProfile: (profile: Omit<Profile, 'id'>) => Promise<void>;
    updateProfile: (profile: Profile) => Promise<void>;
    deleteProfile: (id: string) => Promise<void>;
}

export interface PersonnelContextType {
    personnel: Personnel[];
    addPersonnel: (person: Omit<Personnel, 'id' | 'createdAt' | 'status'>) => Promise<string>;
    updatePersonnel: (person: Personnel) => Promise<void>;
    deletePersonnel: (id: string) => Promise<void>;
}

export interface SystemMessage {
    id: string;
    text: string;
    type: 'info' | 'warning' | 'danger' | 'success';
    isActive: boolean;
    image?: string;
    youtubeUrl?: string;
    durationSeconds?: number;
    isFullImage?: boolean; // Si la imagen debe ocupar gran parte del aviso
    expiresAt?: string;
    tags?: string[];
    isArchived?: boolean;
    createdAt: string;
}

export interface SystemMessageContextType {
    messages: SystemMessage[];
    addMessage: (message: Omit<SystemMessage, 'id' | 'createdAt'>) => Promise<void>;
    updateMessage: (message: SystemMessage) => Promise<void>;
    deleteMessage: (id: string) => Promise<void>;
    toggleMessageStatus: (id: string) => Promise<void>;
}

export interface ArticleDelivery {
    id: string;
    folio: string;
    personnelId: string;
    deliveryDate: string; // Fecha en que se entregó físicamente
    createdAt: string;    // Fecha en que se registró en sistema
    articles: {
        articleId: string;
        quantity: number;
        size?: string;
    }[];
    notes?: string;
    status: 'active' | 'voided';
    signedDocument?: string; // Base64 of signed document
}

export interface ArticleDeliveryContextType {
    deliveries: ArticleDelivery[];
    addDelivery: (delivery: Omit<ArticleDelivery, 'id' | 'folio' | 'createdAt'>) => Promise<string>;
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
    unitTypeId: string;
    calculationType: 'fixed' | 'percentage';
    value: number; // Fixed amount or % of Base Common Expense
    isExempt: boolean;
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
    totalAmountPerUnit: number; // Default amount per unit
    totalProjectAmount?: number; // Total amount to be collected (for proration)
    isActive: boolean;
    deadline?: string;
    unitConfigs?: FundUnitTypeConfig[];
    expenses?: FundExpense[];
    isArchived?: boolean;
    createdAt: string;
}

export interface CommonExpenseRule {
    id: string;
    unitTypeId?: string;
    amount: number;
    effectiveFrom: string;
    description?: string;
    isArchived?: boolean;
    createdAt: string;
}

export interface FundContribution {
    fundId: string;
    amount: number;
}

export interface CommonExpensePayment {
    id: string;
    departmentId: string;
    periodMonth: number;
    periodYear: number;
    amountPaid: number;
    paymentDate: string;
    status: 'paid' | 'pending' | 'mora';
    paymentMethod?: string;
    receiptFolio?: string;
    evidenceImage?: string; // Captura manual
    notes?: string;
    isElectronic: boolean;
    fundContributions?: FundContribution[];
    createdAt: string;
}

export interface CommunityExpense {
    id: string;
    description: string;
    amount: number;
    category: 'Sueldos' | 'Mantención' | 'Seguros' | 'Servicios Básicos' | 'Administración' | 'Otros' | 'Reparaciones';
    date: string;
    receiptUrl?: string;
    receiptImages?: string[];
    isArchived?: boolean;
    createdAt: string;
}

export interface CommonExpenseContextType {
    payments: CommonExpensePayment[];
    funds: SpecialFund[];
    rules: CommonExpenseRule[];
    communityExpenses: CommunityExpense[];
    fetchPayments: () => Promise<void>;
    fetchFunds: (includeArchived?: boolean) => Promise<void>;
    fetchCommunityExpenses: (includeArchived?: boolean) => Promise<void>;
    addPayment: (payment: Omit<CommonExpensePayment, 'id' | 'createdAt'>) => Promise<void>;
    updatePayment: (payment: CommonExpensePayment) => Promise<void>;
    deletePayment: (id: string) => Promise<void>;
    addFund: (fund: Omit<SpecialFund, 'id' | 'createdAt'>) => Promise<void>;
    updateFund: (fund: SpecialFund) => Promise<void>;
    deleteFund: (id: string) => Promise<void>;
    restoreFund: (id: string) => Promise<void>;
    addRule: (rule: Omit<CommonExpenseRule, 'id' | 'createdAt'>) => Promise<void>;
    calculateAmount: (deptId: string) => Promise<{ suggestedAmount: number, ruleUsed: any }>;
    addCommunityExpense: (expense: Omit<CommunityExpense, 'id' | 'createdAt'>) => Promise<void>;
    deleteCommunityExpense: (id: string) => Promise<void>;
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
    isArchived?: boolean;
    createdAt: string;
}

export interface FixedAssetContextType {
    assets: FixedAsset[];
    addAsset: (asset: Omit<FixedAsset, 'id' | 'createdAt'>) => Promise<void>;
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
    departmentId: string;
    towerId: string;
    type: 'package' | 'letter' | 'delivery' | 'other';
    addressee: string;
    receivedBy?: string; // Personnel ID or name
    courier?: string;
    details?: string;
    evidenceImage?: string;
    status: 'pending' | 'received' | 'notified' | 'delivered' | 'expected';
    receivedAt?: string;
    deliveredAt?: string;
    expectedDate?: string;
    expectedTimeRange?: string;
    createdAt: string;
}

export interface CorrespondenceContextType {
    items: Correspondence[];
    addItem: (item: Omit<Correspondence, 'id' | 'folio' | 'createdAt'>) => Promise<void>;
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
    createdAt: string;
}

export interface ContractorContextType {
    contractors: Contractor[];
    addContractor: (contractor: Omit<Contractor, 'id' | 'folio' | 'createdAt'>) => Promise<void>;
    updateContractor: (contractor: Contractor) => Promise<void>;
    deleteContractor: (id: string) => Promise<void>;
}

export interface ContractorVisit {
    id: string;
    folio: string;
    contractorId?: string; // If registered in master
    names: string;
    dni: string;
    company: string;
    subject: string;
    entryTime: string;
    exitTime?: string;
    status: 'entered' | 'exited';
    createdAt: string;
}

export interface ContractorVisitContextType {
    visits: ContractorVisit[];
    addVisit: (visit: Omit<ContractorVisit, 'id' | 'folio' | 'createdAt' | 'status'>) => Promise<void>;
    updateVisitStatus: (id: string, status: ContractorVisit['status']) => Promise<void>;
}

export interface Visitor {
    id: string;
    folio: string;
    names: string;
    dni: string;
    towerId: string;
    departmentId: string;
    visitDate: string;
    visitTime?: string;
    isPreRegistered: boolean; // Si fue registrado por el residente
    status: 'scheduled' | 'entered' | 'exited' | 'cancelled';
    entryTime?: string;
    exitTime?: string;
    vehiclePlate?: string;
    notes?: string;
    createdAt: string;
}

export interface VisitorContextType {
    visitors: Visitor[];
    addVisitor: (visitor: Omit<Visitor, 'id' | 'folio' | 'createdAt'>) => Promise<void>;
    updateVisitorStatus: (id: string, status: Visitor['status'], time?: string) => Promise<void>;
    deleteVisitor: (id: string) => Promise<void>;
}

export interface InfrastructureItem {
    id: string;
    name: string;
    isMandatory?: boolean;
    isArchived?: boolean;
    createdAt: string;
}

export interface EquipmentItem {
    id: string;
    name: string;
    isMandatory?: boolean;
    isArchived?: boolean;
    createdAt: string;
}

export interface InfrastructureItemContextType {
    items: InfrastructureItem[];
    addItem: (item: Omit<InfrastructureItem, 'id' | 'createdAt'>) => Promise<void>;
    updateItem: (item: InfrastructureItem) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
}

export interface EquipmentItemContextType {
    items: EquipmentItem[];
    addItem: (item: Omit<EquipmentItem, 'id' | 'createdAt'>) => Promise<void>;
    updateItem: (item: EquipmentItem) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
}

export interface Camera {
    id: string;
    name: string;
    description?: string;
    backupHours: number;
    isArchived?: boolean;
    createdAt: string;
}

export interface CameraContextType {
    cameras: Camera[];
    addCamera: (camera: Omit<Camera, 'id' | 'createdAt'>) => Promise<void>;
    updateCamera: (camera: Camera) => Promise<void>;
    deleteCamera: (id: string) => Promise<void>;
}

export interface ShiftReport {
    id: string;
    folio: string;
    workerId: string;
    workerName: string;
    shiftDate: string;
    shiftType: 'Mañana' | 'Tarde' | 'Noche';
    status: 'open' | 'closed';
    noveldades: string;
    hasIncidents: boolean;
    incidentDetails?: string;
    incidentAttachments?: string[]; // Base64 strings
    hasInfrastructureIssues: boolean;
    infrastructureIssueType?: string; // Keep for retrocompatibility if needed
    infrastructureIssueTypes?: string[]; // Select multiple from master
    infrastructureIssueDetails?: string;
    infrastructureAttachments?: string[];
    hasEquipmentIssues: boolean;
    equipmentIssueType?: string; // Keep for retrocompatibility
    equipmentIssueTypes?: string[]; // Select multiple from master
    equipmentIssueDetails?: string;
    equipmentAttachments?: string[];
    closedAt?: string;
    adminReopenReason?: string;
    adminReopenedBy?: string;
    createdAt: string;
}

export interface ShiftReportContextType {
    reports: ShiftReport[];
    addReport: (report: Omit<ShiftReport, 'id' | 'folio' | 'createdAt' | 'status' | 'hasIncidents' | 'hasInfrastructureIssues' | 'hasEquipmentIssues'>) => Promise<void>;
    updateReport: (id: string, data: Partial<ShiftReport>) => Promise<void>;
    closeShift: (id: string, data: Partial<ShiftReport>) => Promise<void>;
    reopenShift: (id: string, adminName: string, reason: string) => Promise<void>;
    deleteReport: (id: string) => void;
    clearAllReports: () => void;
}

export interface EmergencyNumber {
    id: string;
    category: string;
    name: string;
    phone: string;
    description?: string;
    webUrl?: string;
    isArchived?: boolean;
    createdAt: string;
}

export interface EmergencyNumberContextType {
    numbers: EmergencyNumber[];
    addNumber: (number: Omit<EmergencyNumber, 'id' | 'createdAt'>) => Promise<void>;
    updateNumber: (id: string, number: Omit<EmergencyNumber, 'id' | 'createdAt'>) => Promise<void>;
    deleteNumber: (id: string) => Promise<void>;
}

export interface Certificate {
    id: string;
    folio: string;
    type: 'residencia' | 'gastos' | 'estado_cuenta' | 'liquidacion';
    residentName: string;
    residentRut: string;
    residentAddress: string;
    generatedAt: string;
    adminName: string;
    adminRut: string;
    condoName: string;
    condoRut: string;
    condoAddress: string;
    financialData?: {
        commonExpenseDebt: number;
        extraordinaryDebt: number;
        reserveDebt: number;
        totalDebt: number;
        lastPaymentDate?: string;
    };
}

export interface CertificateContextType {
    certificates: Certificate[];
    addCertificate: (certificate: Omit<Certificate, 'id' | 'folio' | 'generatedAt'>) => Promise<Certificate>;
    deleteCertificate: (id: string) => Promise<void>;
}

export interface Advance {
    id: string;
    personnelId: string;
    amount: number;
    date: string;
    description: string;
    status: 'pending' | 'deducted' | 'cancelled';
    payslipId?: string;
}

export interface Payslip {
    id: string;
    folio: string;
    personnelId: string;
    month: number;
    year: number;
    baseSalary: number;
    grossSalary: number;
    healthDiscount: number;
    pensionDiscount: number;
    apvDiscount: number;
    insuranceDiscount: number;
    advancesDiscount: number;
    totalDeductions: number;
    netSalary: number;
    generatedAt: string;
    bonusPoints?: number; // Optional extras
}

export interface PayslipContextType {
    payslips: Payslip[];
    advances: Advance[];
    addPayslip: (payslip: Omit<Payslip, 'id' | 'folio' | 'generatedAt'>) => Promise<Payslip>;
    deletePayslip: (id: string) => Promise<void>;
    addAdvance: (advance: Omit<Advance, 'id' | 'status'>) => Promise<string>;
    updateAdvanceStatus: (id: string, status: Advance['status'], payslipId?: string) => Promise<void>;
    deleteAdvance: (id: string) => Promise<void>;
}
