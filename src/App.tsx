import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ClassesIndexPage } from './pages/classes/ClassesIndexPage';
import { ClassDetailPage } from './pages/classes/ClassDetailPage';
import { ClassNewPage } from './pages/classes/ClassNewPage';
import { StudentsIndexPage } from './pages/students/StudentsIndexPage';
import { StudentDetailPage } from './pages/students/StudentDetailPage';
import { StudentNewPage } from './pages/students/StudentNewPage';
import { TemplatesIndexPage } from './pages/templates/TemplatesIndexPage';
import { TemplateNewPage } from './pages/templates/TemplateNewPage';
import { AssessmentsIndexPage } from './pages/assessments/AssessmentsIndexPage';
import { ReportPage } from './pages/reports/ReportPage';
import { FinanceDashboardPage } from './pages/finance/FinanceDashboardPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/classes" replace />} />
        <Route path="/classes" element={<ClassesIndexPage />} />
        <Route path="/classes/new" element={<ClassNewPage />} />
        <Route path="/classes/:id" element={<ClassDetailPage />} />
        <Route path="/students" element={<StudentsIndexPage />} />
        <Route path="/students/new" element={<StudentNewPage />} />
        <Route path="/students/:id" element={<StudentDetailPage />} />
        <Route path="/templates" element={<TemplatesIndexPage />} />
        <Route path="/templates/new" element={<TemplateNewPage />} />
        <Route path="/assessments" element={<AssessmentsIndexPage />} />
        <Route path="/reports/:studentId" element={<ReportPage />} />
        <Route path="/finance" element={<FinanceDashboardPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
