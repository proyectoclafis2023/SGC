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
import { SettingsPage } from './pages/SettingsPage';
import { PersonnelPage } from './pages/PersonnelPage';
import { ResidentsPage } from './pages/ResidentsPage';
import { PrevisionesPage } from './pages/PrevisionesPage';
import { AFPsPage } from './pages/AFPsPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { InfrastructurePage } from './pages/InfrastructurePage';
import { CommonSpacesPage } from './pages/CommonSpacesPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { SystemMessagesPage } from './pages/SystemMessagesPage';
import { PublicCarouselPage } from './pages/PublicCarouselPage';
import { OwnersPage } from './pages/OwnersPage';
import { OwnerProvider } from './context/OwnerContext';
import { SpecialConditionProvider } from './context/SpecialConditionContext';
import { UnitTypeProvider } from './context/UnitTypeContext';
import { ParkingProvider } from './context/ParkingContext';
import { UnitTypesPage } from './pages/UnitTypesPage';
import { SpecialConditionsPage } from './pages/SpecialConditionsPage';
import { ParkingPage } from './pages/ParkingPage';
import { BanksPage } from './pages/BanksPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { BankProvider } from './context/BankContext';
import { ArticleProvider } from './context/ArticleContext';
import { ArticleDeliveryProvider } from './context/ArticleDeliveryContext';
import { HistoryLogProvider } from './context/HistoryLogContext';
import { Layout } from './components/Layout';
import { ArticleDeliveriesPage } from './pages/ArticleDeliveriesPage';
import { CommonExpenseProvider } from './context/CommonExpenseContext';
import { CommonExpensePaymentsPage } from './pages/CommonExpensePaymentsPage';
import { CommonExpenseRulesPage } from './pages/CommonExpenseRulesPage';
import { SpecialFundsPage } from './pages/SpecialFundsPage';
import { FixedAssetProvider } from './context/FixedAssetContext';
import { FixedAssetsPage } from './pages/FixedAssetsPage';
import { MassiveUploadPage } from './pages/MassiveUploadPage';
import { TicketProvider } from './context/TicketContext';
import { CameraRequestProvider } from './context/CameraRequestContext';
import { CorrespondenceProvider } from './context/CorrespondenceContext';
import { ContractorProvider } from './context/ContractorContext';
import { VisitorProvider } from './context/VisitorContext';
import { ShiftReportProvider } from './context/ShiftReportContext';
import { CommunityRequestsPage } from './pages/CommunityRequestsPage';
import { CameraMasterPage } from './pages/CameraMasterPage';
import { CameraRequestsPage } from './pages/CameraRequestsPage';
import { CorrespondencePage } from './pages/CorrespondencePage';
import { EmailSettingsMasterPage } from './pages/EmailSettingsMasterPage';
import { ContractorsPage } from './pages/ContractorsPage';
import { ContractorMasterPage } from './pages/ContractorMasterPage';
import { VisitorsPage } from './pages/VisitorsPage';
import { ShiftReportsPage } from './pages/ShiftReportsPage';
import { DailyReportPage } from './pages/DailyReportPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { PayslipsPage } from './pages/PayslipsPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { CommunityExpensesPage } from './pages/CommunityExpensesPage';
import { ResidentsServicesPage } from './pages/ResidentsServicesPage';

import { AccountSetupPage } from './pages/AccountSetupPage';
import { EmergencyNumberProvider } from './context/EmergencyNumberContext';
import { EmergencyNumbersPage } from './pages/EmergencyNumbersPage';
import { OperationalMastersPage } from './pages/OperationalMastersPage';
import { InfrastructureItemProvider } from './context/InfrastructureItemContext';
import { EquipmentItemProvider } from './context/EquipmentItemContext';
import { CameraProvider } from './context/CameraContext';
import { CourierProvider } from './context/CourierContext';
import { ContractorVisitProvider } from './context/ContractorVisitContext';
import { CertificateProvider } from './context/CertificateContext';
import { PayslipProvider } from './context/PayslipContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.status === 'setting_up') return <AccountSetupPage />;
  if (user?.mustChangePassword && location.pathname !== '/cambio-clave') {
    return <Navigate to="/cambio-clave" replace />;
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
                                                                              <Routes>
                                                                                <Route path="/login" element={<LoginPage />} />
                                                                                <Route path="/visor-mensajes" element={<PublicCarouselPage />} />
                                                                                <Route
                                                                                  path="/*"
                                                                                  element={
                                                                                    <PrivateRoute>
                                                                                      <Layout />
                                                                                    </PrivateRoute>
                                                                                  }
                                                                                >
                                                                                  <Route index element={<Dashboard />} />
                                                                                  <Route path="personal" element={<PersonnelPage />} />
                                                                                  <Route path="residentes" element={<ResidentsPage />} />
                                                                                  <Route path="propietarios" element={<OwnersPage />} />
                                                                                  <Route path="previsiones" element={<PrevisionesPage />} />
                                                                                  <Route path="afps" element={<AFPsPage />} />
                                                                                  <Route path="perfiles" element={<ProfilesPage />} />
                                                                                  <Route path="infraestructura" element={<InfrastructurePage />} />
                                                                                  <Route path="tipos-unidad" element={<UnitTypesPage />} />
                                                                                  <Route path="condiciones-especiales" element={<SpecialConditionsPage />} />
                                                                                  <Route path="espacios" element={<CommonSpacesPage />} />
                                                                                  <Route path="reservas" element={<ReservationsPage />} />
                                                                                  <Route path="mensajes" element={<SystemMessagesPage />} />
                                                                                  <Route path="estacionamientos" element={<ParkingPage />} />
                                                                                  <Route path="bancos" element={<BanksPage />} />
                                                                                  <Route path="articulos-personal" element={<ArticlesPage />} />
                                                                                  <Route path="entregas-articulos" element={<ArticleDeliveriesPage />} />
                                                                                  <Route path="configuracion" element={<SettingsPage />} />
                                                                                  <Route path="gastos-comunes" element={<CommonExpensePaymentsPage />} />
                                                                                  <Route path="registro-gastos" element={<CommunityExpensesPage />} />
                                                                                  <Route path="reglas-gastos-comunes" element={<CommonExpenseRulesPage />} />
                                                                                  <Route path="maestro-fondos" element={<SpecialFundsPage />} />
                                                                                  <Route path="activo-fijo" element={<FixedAssetsPage />} />
                                                                                  <Route path="carga-masiva" element={<MassiveUploadPage />} />
                                                                                  <Route path="reclamos" element={<CommunityRequestsPage />} />
                                                                                  <Route path="camaras" element={<CameraRequestsPage />} />
                                                                                  <Route path="correspondencia" element={<CorrespondencePage />} />
                                                                                  <Route path="contratistas" element={<ContractorMasterPage />} />
                                                                                  <Route path="registro-contratistas" element={<ContractorsPage />} />
                                                                                  <Route path="visitas" element={<VisitorsPage />} />
                                                                                  <Route path="bitacora-turnos" element={<ShiftReportsPage />} />
                                                                                  <Route path="reporte-diario" element={<DailyReportPage />} />
                                                                                  <Route path="certificados" element={<CertificatesPage />} />
                                                                                  <Route path="liquidaciones" element={<PayslipsPage />} />
                                                                                  <Route path="emergencias" element={<EmergencyNumbersPage />} />
                                                                                  <Route path="maestro-emergencias" element={<EmergencyNumbersPage isMaster />} />
                                                                                  <Route path="servicios-residentes" element={<ResidentsServicesPage />} />
                                                                                  <Route path="cambio-clave" element={<ChangePasswordPage />} />
                                                                                  <Route path="maestros-operativos" element={<OperationalMastersPage />} />
                                                                                  <Route path="maestro-camaras" element={<CameraMasterPage />} />
                                                                                  <Route path="maestro-correos" element={<EmailSettingsMasterPage />} />
                                                                                  <Route path="*" element={<Navigate to="/" replace />} />
                                                                                </Route>
                                                                              </Routes>
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
