import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { SettingsProvider } from './context/SettingsContext';
import { PersonnelProvider } from './context/PersonnelContext';
import { HealthProviderProvider } from './context/HealthProviderContext';
import { PensionFundProvider } from './context/PensionFundContext';
import { ProfileProvider } from './context/ProfileContext';
import { CommonSpaceProvider } from './context/CommonSpaceContext';
import { ReservationProvider } from './context/ReservationContext';
import { InfrastructureProvider } from './context/InfrastructureContext';
import { SystemMessageProvider } from './context/SystemMessageContext';
import { ResidentProvider } from './context/ResidentContext';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { ConfiguracionPage } from './pages/ConfiguracionPage';
import { PersonnelPage } from './pages/PersonnelPage';
import { ResidentesPage } from './pages/ResidentesPage';
import { PrevisionesPage } from './pages/PrevisionesPage';
import { AFPsPage } from './pages/AFPsPage';
import { PerfilesPage } from './pages/PerfilesPage';
import { InfraestructuraPage } from './pages/InfraestructuraPage';
import { EspaciosPage } from './pages/EspaciosPage';
import { ReservasPage } from './pages/ReservasPage';
import { VisorPage } from './pages/VisorPage';
import { MensajesDirigidosPage } from './pages/MensajesDirigidosPage';
import { PublicCarouselPage } from './pages/PublicCarouselPage';
import { PropietariosPage } from './pages/PropietariosPage';
import { MaestroServiciosPage } from './pages/MaestroServiciosPage';
import { OwnerProvider } from './context/OwnerContext';
import { SpecialConditionProvider } from './context/SpecialConditionContext';
import { UnitTypeProvider } from './context/UnitTypeContext';
import { ParkingProvider } from './context/ParkingContext';
import { TiposUnidadPage } from './pages/TiposUnidadPage';
import { CondicionesEspecialesPage } from './pages/CondicionesEspecialesPage';
import { EstacionamientosPage } from './pages/EstacionamientosPage';
import { BancosPage } from './pages/BancosPage';
import { ArticulosPersonalPage } from './pages/ArticulosPersonalPage';
import { BankProvider } from './context/BankContext';
import { ArticleProvider } from './context/ArticleContext';
import { ArticleDeliveryProvider } from './context/ArticleDeliveryContext';
import { HistoryLogProvider } from './context/HistoryLogContext';
import { Layout } from './components/Layout';
import { EntregasArticulosPage } from './pages/EntregasArticulosPage';
import { CommonExpenseProvider } from './context/CommonExpenseContext';
import { GastosComunesPage } from './pages/GastosComunesPage';
import { ReglasGastosComunesPage } from './pages/ReglasGastosComunesPage';
import { MaestroFondosPage } from './pages/MaestroFondosPage';
import { FixedAssetProvider } from './context/FixedAssetContext';
import { ActivoFijoPage } from './pages/ActivoFijoPage';
import { CargaMasivaPage } from './pages/CargaMasivaPage';
import { MassUploadPage } from './pages/MassUploadPage';
import { MassUploadHistoryPage } from './pages/MassUploadHistoryPage';
import { SystemDoctorPage } from './pages/SystemDoctorPage';
import { TicketProvider } from './context/TicketContext';
import { CameraRequestProvider } from './context/CameraRequestContext';
import { CorrespondenceProvider } from './context/CorrespondenceContext';
import { ContractorProvider } from './context/ContractorContext';
import { VisitorProvider } from './context/VisitorContext';
import { ShiftReportProvider } from './context/ShiftReportContext';
import { ReclamosPage } from './pages/ReclamosPage';
import { CameraRequestsPage } from './pages/CameraRequestsPage';
import { CorrespondenciaPage } from './pages/CorrespondenciaPage';
import { MaestroCorreosPage } from './pages/MaestroCorreosPage';
import { RegistroContratistasPage } from './pages/RegistroContratistasPage';
import { ContratistasPage } from './pages/ContratistasPage';
import { VisitasPage } from './pages/VisitasPage';
import { ShiftReportsPage } from './pages/ShiftReportsPage';
import { ReporteDiarioPage } from './pages/ReporteDiarioPage';
import { CertificadosPage } from './pages/CertificadosPage';
import { LiquidacionesPage } from './pages/LiquidacionesPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { RegistroGastosPage } from './pages/RegistroGastosPage';
import { ServiciosResidentesPage } from './pages/ServiciosResidentesPage';
import { MaestroMensajesPage } from './pages/MaestroMensajesPage';
import { TicketsPage } from './pages/TicketsPage';
import { AccountSetupPage } from './pages/AccountSetupPage';
import { EmergencyNumberProvider } from './context/EmergencyNumberContext';
import { MaestroEmergenciasPage } from './pages/MaestroEmergenciasPage';
import { MaestrosOperativosPage } from './pages/MaestrosOperativosPage';
import { InfrastructureItemProvider } from './context/InfrastructureItemContext';
import { EquipmentItemProvider } from './context/EquipmentItemContext';
import { CameraProvider } from './context/CameraContext';
import { CamarasPage } from './pages/CamarasPage';
import { CourierProvider } from './context/CourierContext';
import { ContractorVisitProvider } from './context/ContractorVisitContext';
import { CertificateProvider } from './context/CertificateContext';
import { PayslipProvider } from './context/PayslipContext';
import { CommunicationProvider } from './context/CommunicationContext';
import { SystemParameterProvider } from './context/SystemParameterContext';
import { JornadaGroupProvider } from './context/JornadaGroupContext';
import { ParametrosPage } from './pages/ParametrosPage';
import { DashboardKPIPage } from './pages/DashboardKPIPage';
import { MaestroIPCPage } from './pages/MaestroIPCPage';
import { IPCProjectionProvider } from './context/IPCProjectionContext';
import { SolicitudInsumosPage } from './pages/SolicitudInsumosPage';
import { MyPaymentsPage } from './pages/MyPaymentsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { CondoBoardProvider } from './context/CondoBoardContext';
import { DirectivaPage } from './pages/DirectivaPage';
import { MaestroCategoriasArticulosPage } from './pages/MaestroCategoriasArticulosPage';
import { AvailableUnitsPage } from './pages/AvailableUnitsPage';
import { AFCProvider } from './context/AFCContext';
import { HolidayProvider } from './context/HolidayContext';
import { AFCPage } from './pages/AFCPage';
import { FeriadosPage } from './pages/FeriadosPage';
import { ServiceDirectoryProvider } from './context/ServiceDirectoryContext';

import { usePermissions } from './hooks/usePermissions';

const PrivateRoute: React.FC<{ children: React.ReactNode; permission?: string }> = ({ children, permission }) => {
  const { isAuthenticated, user } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.status === 'setting_up') return <AccountSetupPage />;
  if (user?.mustChangePassword && location.pathname !== '/cambio-clave') {
    return <Navigate to="/cambio-clave" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <HistoryLogProvider>
            <UserProvider>
              <HealthProviderProvider>
                <PensionFundProvider>
                  <ProfileProvider>
                    <ResidentProvider>
                      <OwnerProvider>
                        <SpecialConditionProvider>
                          <UnitTypeProvider>
                            <CommonSpaceProvider>
                              <ReservationProvider>
                                <InfrastructureProvider>
                                  <SystemMessageProvider>
                                    <PersonnelProvider>
                                      <ParkingProvider>
                                        <BankProvider>
                                          <ArticleProvider>
                                            <ArticleDeliveryProvider>
                                              <CommonExpenseProvider>
                                                <FixedAssetProvider>
                                                  <TicketProvider>
                                                    <CameraRequestProvider>
                                                      <CorrespondenceProvider>
                                                        <ContractorProvider>
                                                          <VisitorProvider>
                                                            <ShiftReportProvider>
                                                              <EmergencyNumberProvider>
                                                                <CameraProvider>
                                                                  <InfrastructureItemProvider>
                                                                    <EquipmentItemProvider>
                                                                      <CourierProvider>
                                                                        <ContractorVisitProvider>
                                                                          <CertificateProvider>
                                                                            <PayslipProvider>
                                                                              <SystemParameterProvider>
                                                                                <CommunicationProvider>
                                                                                  <IPCProjectionProvider>
                                                                                    <JornadaGroupProvider>

                                                                                      <CondoBoardProvider>
                                                        <AFCProvider>
                                                          <HolidayProvider>
                                                            <ServiceDirectoryProvider>
                                                              <Routes>
                                                                                          <Route path="/login" element={<LoginPage />} />
                                                                                          <Route path="/visor-mensajes" element={<PublicCarouselPage />} />
                                                                                          <Route
                                                                                            path="/"
                                                                                            element={
                                                                                              <PrivateRoute>
                                                                                                <Layout />
                                                                                              </PrivateRoute>
                                                                                            }
                                                                                          >
                                                                                            <Route index element={<Dashboard />} />
                                                                                            <Route path="mensajes-dirigidos" element={<MensajesDirigidosPage />} />
                                                                                            <Route path="personal" element={<PrivateRoute permission="personnel:manage"><PersonnelPage /></PrivateRoute>} />
                                                                                            <Route path="residentes" element={<PrivateRoute permission="residents:manage"><ResidentesPage /></PrivateRoute>} />
                                                                                            <Route path="propietarios" element={<PrivateRoute permission="owners:manage"><PropietariosPage /></PrivateRoute>} />
                                                                                            <Route path="previsiones" element={<PrevisionesPage />} />
                                                                                            <Route path="afps" element={<AFPsPage />} />
                                                              <Route path="afc" element={<AFCPage />} />
                                                                                            <Route path="perfiles" element={<PerfilesPage />} />
                                                                                            <Route path="infraestructura" element={<InfraestructuraPage />} />
                                                                                            <Route path="tipos-unidad" element={<TiposUnidadPage />} />
                                                                                            <Route path="condiciones-especiales" element={<CondicionesEspecialesPage />} />
                                                                                            <Route path="espacios" element={<EspaciosPage />} />
                                                                                            <Route path="reservas" element={<ReservasPage />} />
                                                                                            <Route path="mensajes" element={<VisorPage />} />
                                                                                            <Route path="estacionamientos" element={<EstacionamientosPage />} />
                                                                                            <Route path="bancos" element={<BancosPage />} />
                                                                                            <Route path="articulos-personal" element={<ArticulosPersonalPage />} />
                                                              <Route path="maestro-categorias-articulos" element={<MaestroCategoriasArticulosPage />} />
                                                              <Route path="feriados" element={<FeriadosPage />} />
                                                              <Route path="solicitud-insumos" element={<PrivateRoute permission="supplies:manage"><SolicitudInsumosPage /></PrivateRoute>} />
                                                                                            <Route path="entregas-articulos" element={<EntregasArticulosPage />} />
                                                                                            <Route path="configuracion" element={<PrivateRoute permission="settings:manage"><ConfiguracionPage /></PrivateRoute>} />
                                                                                            <Route path="configuracion/auditoria" element={<PrivateRoute permission="settings:manage"><AuditLogPage /></PrivateRoute>} />
                                                                                            <Route path="gastos-comunes" element={<PrivateRoute permission="finances:manage"><GastosComunesPage /></PrivateRoute>} />
                                                                                            <Route path="registro-gastos" element={<PrivateRoute permission="finances:manage"><RegistroGastosPage /></PrivateRoute>} />
                                                                                            <Route path="reglas-gastos-comunes" element={<ReglasGastosComunesPage />} />
                                                                                            <Route path="maestro-fondos" element={<MaestroFondosPage />} />
                                                                                            <Route path="activo-fijo" element={<PrivateRoute permission="assets:manage"><ActivoFijoPage /></PrivateRoute>} />
                                                                                            <Route path="carga-masiva-legacy" element={<CargaMasivaPage />} />
                                                                                            <Route path="carga-masiva" element={<PrivateRoute permission="mass_upload:execute"><MassUploadPage /></PrivateRoute>} />
                                                                                            <Route path="carga-masiva/historial" element={<PrivateRoute permission="mass_upload:execute"><MassUploadHistoryPage /></PrivateRoute>} />
                                                                                            <Route path="salud-sistema" element={<PrivateRoute permission="mass_upload:execute"><SystemDoctorPage /></PrivateRoute>} />
                                                                                            
                                                                                            {/* Redirecciones de Compatibilidad (Legacy) */}
                                                                                            <Route path="mass-upload" element={<Navigate to="/carga-masiva" replace />} />
                                                                                            <Route path="mass-upload/history" element={<Navigate to="/carga-masiva/historial" replace />} />
                                                                                            <Route path="system-doctor" element={<Navigate to="/salud-sistema" replace />} />
                                                                                            <Route path="reclamos" element={<ReclamosPage />} />
                                                                                            <Route path="directiva" element={<DirectivaPage />} />
                                                                                            <Route path="tickets" element={<TicketsPage />} />
                                                                                            <Route path="dashboard-kpi" element={<DashboardKPIPage />} />
                                                                                            <Route path="maestro-ipc" element={<MaestroIPCPage />} />
                                                                                            <Route path="camaras" element={<CameraRequestsPage />} />
                                                                                            <Route path="correspondencia" element={<CorrespondenciaPage />} />
                                                                                            <Route path="contratistas" element={<ContratistasPage />} />
                                                                                            <Route path="registro-contratistas" element={<RegistroContratistasPage />} />
                                                                                            <Route path="visitas" element={<PrivateRoute permission="visits:view"><VisitasPage /></PrivateRoute>} />
                                                                                            <Route path="bitacora-turnos" element={<PrivateRoute permission="shift_logs:view"><ShiftReportsPage /></PrivateRoute>} />
                                                                                            <Route path="reporte-diario" element={<PrivateRoute permission="reports:view"><ReporteDiarioPage /></PrivateRoute>} />
                                                                                            <Route path="certificados" element={<CertificadosPage />} />
                                                                                            <Route path="liquidaciones" element={<LiquidacionesPage />} />
                                                                                            <Route path="emergencias" element={<MaestroEmergenciasPage isMaster={false} />} />
                                                                                            <Route path="maestro-emergencias" element={<MaestroEmergenciasPage isMaster={true} />} />
                                                              <Route path="maestro-servicios" element={<MaestroServiciosPage />} />
                                                              <Route path="servicios-residentes" element={<ServiciosResidentesPage />} />
                                                                                            <Route path="cambio-clave" element={<ChangePasswordPage />} />
                                                                                            <Route path="maestros-operativos/:tab?" element={<MaestrosOperativosPage />} />
                                                                                            <Route path="maestro-camaras" element={<CamarasPage />} />
                                                                                            <Route path="maestro-correos" element={<MaestroCorreosPage />} />
                                                                                            <Route path="maestro-mensajes" element={<MaestroMensajesPage />} />
                                                                                            <Route path="parametros" element={<ParametrosPage />} />
                                                                                            <Route path="unidades-disponibles" element={<AvailableUnitsPage />} />
                                                                                            <Route path="mis-pagos" element={<MyPaymentsPage />} />
                                                                                            <Route path="*" element={<Navigate to="/" replace />} />
                                                                                          </Route>
                                                                                        </Routes>
                                                        </ServiceDirectoryProvider>
                                                      </HolidayProvider>
                                                        </AFCProvider>
                                                                                      </CondoBoardProvider>

                                                                                    </JornadaGroupProvider>
                                                                                  </IPCProjectionProvider>
                                                                                </CommunicationProvider>
                                                                              </SystemParameterProvider>
                                                                            </PayslipProvider>
                                                                          </CertificateProvider>
                                                                        </ContractorVisitProvider>
                                                                      </CourierProvider>
                                                                    </EquipmentItemProvider>
                                                                  </InfrastructureItemProvider>
                                                                </CameraProvider>
                                                              </EmergencyNumberProvider>
                                                            </ShiftReportProvider>
                                                          </VisitorProvider>
                                                        </ContractorProvider>
                                                      </CorrespondenceProvider>
                                                    </CameraRequestProvider>
                                                  </TicketProvider>
                                                </FixedAssetProvider>
                                              </CommonExpenseProvider>
                                            </ArticleDeliveryProvider>
                                          </ArticleProvider>
                                        </BankProvider>
                                      </ParkingProvider>
                                    </PersonnelProvider>
                                  </SystemMessageProvider>
                                </InfrastructureProvider>
                              </ReservationProvider>
                            </CommonSpaceProvider>
                          </UnitTypeProvider>
                        </SpecialConditionProvider>
                      </OwnerProvider>
                    </ResidentProvider>
                  </ProfileProvider>
                </PensionFundProvider>
              </HealthProviderProvider>
            </UserProvider>
          </HistoryLogProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
