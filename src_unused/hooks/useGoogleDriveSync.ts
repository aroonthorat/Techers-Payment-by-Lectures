
import { useState, useEffect, useCallback } from 'react';
import { GoogleDriveService } from '../utils/googleDriveService';
import { dbService } from '../firebase';
import { SyncStatus } from '../types';

export const useGoogleDriveSync = () => {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    GoogleDriveService.init().then(() => {
      setIsAuthenticated(GoogleDriveService.isAuthenticated());
    });
    
    const savedTime = localStorage.getItem('edupay_last_drive_sync');
    if (savedTime) setLastSyncTime(savedTime);
  }, []);

  const login = async () => {
    const success = await GoogleDriveService.signIn();
    if (success) setIsAuthenticated(true);
    return success;
  };

  const syncToDrive = useCallback(async () => {
    if (!GoogleDriveService.isAuthenticated()) return;
    
    setStatus('syncing');
    try {
      const data = await dbService.getAllData();
      const success = await GoogleDriveService.saveData(data);
      if (success) {
        const now = new Date().toISOString();
        setStatus('synced');
        setLastSyncTime(now);
        localStorage.setItem('edupay_last_drive_sync', now);
      } else {
        setStatus('error');
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  }, []);

  const restoreFromDrive = useCallback(async () => {
    if (!GoogleDriveService.isAuthenticated()) {
      const auth = await login();
      if (!auth) return false;
    }

    setStatus('syncing');
    try {
      const data = await GoogleDriveService.loadData();
      if (data) {
        await dbService.restoreData(data);
        setStatus('synced');
        return true;
      }
      setStatus('error');
      return false;
    } catch (e) {
      setStatus('error');
      return false;
    }
  }, []);

  // Auto-sync every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      syncToDrive();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, syncToDrive]);

  return { status, lastSyncTime, isAuthenticated, login, syncToDrive, restoreFromDrive };
};
