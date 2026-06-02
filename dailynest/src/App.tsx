/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import { useTaskStore } from './store/useTaskStore';
import { ProtectedRoute } from './components/navigation/ProtectedRoute';

import Login from './pages/auth/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Tasks from './pages/tasks/Tasks';
import Pomodoro from './pages/pomodoro/Pomodoro';
import Habits from './pages/habits/Habits';
import Calendar from './pages/calendar/Calendar';
import Analytics from './pages/analytics/Analytics';
import Journal from './pages/journal/Journal';
import QuickAdd from './pages/add/QuickAdd';

function AppContent() {
  const { initializeAuth } = useAuthStore();
  const { tasks } = useTaskStore();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  useEffect(() => {
    const requestNotifications = async () => {
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
         try {
            await Notification.requestPermission();
         } catch(e) {}
      }
    };
    requestNotifications();

    const handleInteraction = () => {
        requestNotifications();
        document.removeEventListener('click', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);

    return () => document.removeEventListener('click', handleInteraction);
  }, []);

  return (
    <>
      <Helmet>
        <title>DailyNest | Premium Productivity Ecosystem</title>
        <meta name="description" content="Track habits, complete tasks, and build your perfect daily routine." />
        <meta name="theme-color" content="#4f46e5" />
      </Helmet>
      
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/pomodoro" element={<Pomodoro />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/add" element={<QuickAdd />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AppContent />
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '16px',
            padding: '16px',
            fontWeight: 500,
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
             iconTheme: {
               primary: '#f43f5e',
               secondary: '#fff',
             }
          }
        }} 
      />
    </HelmetProvider>
  );
}
