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
import UserManagement from './pages/UserManagement';

function AppRoutes() {
  const { data, setData, loading } = useAppState();

  return (
    <AppContext.Provider value={{ data, setData, loading }}>
      <BrowserRouter>
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
            <Route path="/city/:cityId" element={<CityDetail />} />
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
          borderRadius: 6,
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
