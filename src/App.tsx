import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppContext } from './store/AppContext';
import { AuthProvider } from './store/AuthContext';
import { useAppState } from './store/useAppState';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/Login';
import ProvinceMap from './pages/ProvinceMap';
import CityDetail from './pages/CityDetail';
import DistrictDetail from './pages/DistrictDetail';
import CityDashboard from './pages/CityDashboard';
import PrivateSchoolDashboard from './pages/PrivateSchoolDashboard';
import EssayProjectDashboard from './pages/EssayProjectDashboard';
import ProvinceDashboard from './pages/ProvinceDashboard';
import ProvincePrivateSchoolDashboard from './pages/ProvincePrivateSchoolDashboard';
import ProvinceEssayProjectDashboard from './pages/ProvinceEssayProjectDashboard';
import UserManagement from './pages/UserManagement';

function AppRoutes() {
  const { data, setData, loading } = useAppState();

  return (
    <AppContext.Provider value={{ data, setData, loading }}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* 登录页（公开） */}
          <Route path="/login" element={<LoginPage />} />

          {/* 受保护路由 */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<ProvinceMap />} />
            <Route path="/province/dashboard" element={<ProvinceDashboard />} />
            <Route path="/province/private-schools" element={<ProvincePrivateSchoolDashboard />} />
            <Route path="/province/essay-project" element={<ProvinceEssayProjectDashboard />} />
            <Route path="/city/:cityId" element={<CityDetail />} />
            <Route path="/city/:cityId/dashboard" element={<CityDashboard />} />
            <Route path="/city/:cityId/private-schools" element={<PrivateSchoolDashboard />} />
            <Route path="/city/:cityId/essay-project" element={<EssayProjectDashboard />} />
            <Route path="/city/:cityId/:districtId" element={<DistrictDetail />} />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          colorBgContainer: '#ffffff',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
          fontSize: 14,
          colorText: '#1f2937',
          colorTextSecondary: '#6b7280',
          colorBorder: '#e5e7eb',
          colorBorderSecondary: '#f0f0f0',
          colorPrimaryBg: '#eff6ff',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          controlHeight: 36,
          lineHeight: 1.6,
        },
        components: {
          Card: {
            paddingLG: 20,
            borderRadiusLG: 12,
          },
          Button: {
            borderRadius: 8,
            controlHeight: 36,
            fontWeight: 500,
          },
          Table: {
            borderRadius: 10,
            headerBg: '#f9fafb',
            headerColor: '#374151',
            rowHoverBg: '#f0f4ff',
          },
          Menu: {
            itemBorderRadius: 8,
            itemMarginInline: 8,
          },
          Modal: {
            borderRadiusLG: 14,
            titleFontSize: 17,
          },
          Tag: {
            borderRadiusSM: 6,
          },
          Statistic: {
            contentFontSize: 28,
            titleFontSize: 13,
          },
          Input: {
            borderRadius: 8,
          },
          Select: {
            borderRadius: 8,
          },
        },
      }}
    >
      <AntApp>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
