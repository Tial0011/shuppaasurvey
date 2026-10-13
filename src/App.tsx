import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SurveyConfigProvider } from '@/hooks/useSurveyConfig';
import { AuthProvider } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import Landing from '@/features/survey/Landing';
import SurveyPage from '@/features/survey/SurveyPage';

// The admin area is code-split so public visitors never download it.
const AdminLayout = lazy(() => import('@/features/admin/AdminLayout'));
const Login = lazy(() => import('@/features/admin/pages/Login'));
const Dashboard = lazy(() => import('@/features/admin/pages/Dashboard'));
const Responses = lazy(() => import('@/features/admin/pages/Responses'));
const Insights = lazy(() => import('@/features/admin/pages/Insights'));
const Builder = lazy(() => import('@/features/admin/pages/Builder'));
const Links = lazy(() => import('@/features/admin/pages/Links'));
const Settings = lazy(() => import('@/features/admin/pages/Settings'));

export default function App() {
  return (
    <BrowserRouter>
      <SurveyConfigProvider>
        <AuthProvider>
          <Suspense fallback={<div className="center-screen"><Spinner /></div>}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/survey" element={<SurveyPage />} />
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="responses" element={<Responses />} />
                <Route path="insights" element={<Insights />} />
                <Route path="builder" element={<Builder />} />
                <Route path="links" element={<Links />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </SurveyConfigProvider>
    </BrowserRouter>
  );
}
