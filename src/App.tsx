import React, { useState, useEffect } from 'react';
import { User, Equipment } from './types/index.js';
import { api, getStoredToken, getStoredUser } from './services/api.js';
import { LoginView } from './components/LoginView.js';
import { Header } from './components/Header.js';
import { Sidebar, TabType } from './components/Sidebar.js';
import { DashboardView } from './components/DashboardView.js';
import { EquipmentView } from './components/EquipmentView.js';
import { EquipmentDetailModal } from './components/EquipmentDetailModal.js';
import { EquipmentFormModal } from './components/EquipmentFormModal.js';
import { CalibrationRecordModal } from './components/CalibrationRecordModal.js';
import { NotificationsView } from './components/NotificationsView.js';
import { ReportsView } from './components/ReportsView.js';
import { AuditLogView } from './components/AuditLogView.js';
import { UserManagementView } from './components/UserManagementView.js';
import { MasterDataView } from './components/MasterDataView.js';
import { GoogleSheetsExportModal } from './components/GoogleSheetsExportModal.js';
import { CalibrationsView } from './components/CalibrationsView.js';
import { LanguageProvider, useLanguage } from './context/LanguageContext.js';
import { ThemeProvider } from './context/ThemeContext.js';

function MainApp() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter pass-through from dashboard drilldown to equipment master
  const [equipmentFilter, setEquipmentFilter] = useState<{ status?: string; type?: string } | undefined>(undefined);

  // Modals state
  const [selectedDetailEquipmentId, setSelectedDetailEquipmentId] = useState<string | null>(null);
  const [isEquipmentFormOpen, setIsEquipmentFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const [isCalibrationRecordOpen, setIsCalibrationRecordOpen] = useState(false);
  const [calibratingEquipment, setCalibratingEquipment] = useState<Equipment | null>(null);

  const [googleSheetsExportData, setGoogleSheetsExportData] = useState<{
    title: string;
    headers: string[];
    rows: (string | number)[][];
  } | null>(null);

  const [allEquipmentList, setAllEquipmentList] = useState<Equipment[]>([]);

  // Load all equipment for select dropdowns
  const refreshEquipmentList = async () => {
    try {
      const data = await api.getEquipment({ active: 'all' });
      setAllEquipmentList(data.equipment);
    } catch (err) {
      console.error('Failed to pre-fetch equipment list', err);
    }
  };

  // Verify session on initial load
  useEffect(() => {
    const verifyAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsInitializing(false);
        return;
      }
      try {
        const data = await api.getMe();
        setCurrentUser(data.user);
        refreshEquipmentList();
      } catch (err) {
        console.warn('Session expired or invalid', err);
        setCurrentUser(null);
      } finally {
        setIsInitializing(false);
      }
    };
    verifyAuth();

    // Listen for unauthorized events
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };
    window.addEventListener('icms-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('icms-unauthorized', handleUnauthorized);
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
  };

  const handleDrilldownFromDashboard = (filter?: { status?: string; type?: string }) => {
    setEquipmentFilter(filter);
    setCurrentTab('equipment');
  };

  const handleOpenRecordCalibration = (eq: Equipment) => {
    setCalibratingEquipment(eq);
    setIsCalibrationRecordOpen(true);
  };

  const handleOpenRecordForEquipmentId = (eqId: string) => {
    const found = allEquipmentList.find((e) => e.equipment_id === eqId) || null;
    setCalibratingEquipment(found);
    setIsCalibrationRecordOpen(true);
  };

  const handleOpenAddEquipment = () => {
    setEditingEquipment(null);
    setIsEquipmentFormOpen(true);
  };

  const handleOpenEditEquipment = (eq: Equipment) => {
    setEditingEquipment(eq);
    setIsEquipmentFormOpen(true);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen liquid-canvas flex flex-col items-center justify-center text-slate-300">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl liquid-glass-panel flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.3)]">
            <div className="w-7 h-7 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
        <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase mt-4">
          {t('loading', 'Initializing PCS-NISSIN Security Context...')}
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          refreshEquipmentList();
        }}
      />
    );
  }

  const canEdit = currentUser.role === 'Admin' || currentUser.role === 'QA/QC';
  const canDelete = currentUser.role === 'Admin' || currentUser.role === 'QA/QC';

  return (
    <div className="min-h-screen liquid-canvas text-slate-100 flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-white relative overflow-hidden">
      {/* Liquid Mesh Light Refraction Orbs in Background */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-teal-500/8 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[700px] h-[700px] bg-indigo-500/8 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Top Application Header (Liquid Glass) */}
      <Header
        user={currentUser}
        onLogout={handleLogout}
        onNavigateToNotifications={() => setCurrentTab('notifications')}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onRefreshData={refreshEquipmentList}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (Liquid Glass) */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'equipment') setEquipmentFilter(undefined);
            setCurrentTab(tab);
          }}
          user={currentUser}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateToEquipment={handleDrilldownFromDashboard}
              onOpenRecordCalibration={handleOpenRecordCalibration}
              onOpenAddEquipment={handleOpenAddEquipment}
              canEdit={canEdit}
            />
          )}

          {currentTab === 'equipment' && (
            <EquipmentView
              initialFilter={equipmentFilter}
              onViewDetails={(eq) => setSelectedDetailEquipmentId(eq.id)}
              onRecordCalibration={handleOpenRecordCalibration}
              onOpenAddEquipment={handleOpenAddEquipment}
              onEditEquipment={handleOpenEditEquipment}
              onOpenGoogleSheetsExport={(data) => setGoogleSheetsExportData(data)}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}

          {currentTab === 'calibrations' && (
            <CalibrationsView
              onOpenRecordModal={() => {
                setCalibratingEquipment(allEquipmentList[0] || null);
                setIsCalibrationRecordOpen(true);
              }}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationsView
              onRecordCalibrationForEquipment={handleOpenRecordForEquipmentId}
              canEdit={canEdit}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              onOpenGoogleSheetsExport={(data) => setGoogleSheetsExportData(data)}
            />
          )}

          {currentTab === 'audit-log' && currentUser.role === 'Admin' && (
            <AuditLogView />
          )}

          {currentTab === 'users' && currentUser.role === 'Admin' && (
            <UserManagementView currentUser={currentUser} />
          )}

          {currentTab === 'master-data' && (currentUser.role === 'Admin' || currentUser.role === 'QA/QC') && (
            <MasterDataView />
          )}
        </main>
      </div>

      {/* Global Modals (Liquid Glass Backdrops) */}
      {selectedDetailEquipmentId && (
        <EquipmentDetailModal
          equipmentId={selectedDetailEquipmentId}
          onClose={() => setSelectedDetailEquipmentId(null)}
          onRecordCalibration={(eq) => {
            setSelectedDetailEquipmentId(null);
            handleOpenRecordCalibration(eq);
          }}
          onEditEquipment={(eq) => {
            setSelectedDetailEquipmentId(null);
            handleOpenEditEquipment(eq);
          }}
          canEdit={canEdit}
        />
      )}

      {isEquipmentFormOpen && (
        <EquipmentFormModal
          initialEquipment={editingEquipment}
          onClose={() => {
            setIsEquipmentFormOpen(false);
            setEditingEquipment(null);
          }}
          onSaved={() => {
            refreshEquipmentList();
          }}
        />
      )}

      {isCalibrationRecordOpen && (
        <CalibrationRecordModal
          equipment={calibratingEquipment}
          allEquipment={allEquipmentList}
          onClose={() => {
            setIsCalibrationRecordOpen(false);
            setCalibratingEquipment(null);
          }}
          onSaved={() => {
            refreshEquipmentList();
          }}
        />
      )}

      {googleSheetsExportData && (
        <GoogleSheetsExportModal
          data={googleSheetsExportData}
          onClose={() => setGoogleSheetsExportData(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}
