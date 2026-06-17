import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import CalendarPage from "@/pages/CalendarPage";
import BookingPage from "@/pages/BookingPage";
import InventoryPage from "@/pages/InventoryPage";
import DutyPage from "@/pages/DutyPage";
import AnnouncementsPage from "@/pages/AnnouncementsPage";
import SettingsPage from "@/pages/SettingsPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="duty" element={<DutyPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
