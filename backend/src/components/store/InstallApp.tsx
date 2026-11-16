'use client';

import { Download, X } from 'lucide-react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { readStored, writeStored } from '@/lib/client/storage';

const dismissedKey = 'globacart.installPrompt.dismissedAt';
const remindAfterMs = 30 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallContextValue = {
  canInstall: boolean;
  installed: boolean;
  open: boolean;
  openPrompt: () => void;
  dismiss: () => void;
  install: () => Promise<void>;
};

const InstallContext = createContext<InstallContextValue | null>(null);

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function installInstructions() {
  const userAgent = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIos) {
    return 'Tap the Share button, choose Add to Home Screen, then tap Add.';
  }
  if (/Android/i.test(userAgent)) {
    return 'Open your browser menu (⋮), then choose Install app or Add to Home screen.';
  }
  if (/Macintosh/i.test(userAgent) && /Safari/i.test(userAgent) && !/Chrome|CriOS|Edg/i.test(userAgent)) {
    return 'In Safari, choose File, then Add to Dock.';
  }
  return 'Open your browser menu and choose Install app or Create shortcut to add GlobaCart to your desktop.';
}

export function InstallAppProvider({ children }: { children: ReactNode }) {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const updateInstalled = () => {
      if (isStandalone()) {
        setInstalled(true);
        setOpen(false);
      }
    };
    updateInstalled();
    displayMode.addEventListener('change', updateInstalled);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const handleAppInstalled = () => {
      deferredPrompt.current = null;
      setCanInstall(false);
      setInstalled(true);
      setOpen(false);
      writeStored(dismissedKey, Date.now());
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const dismissedAt = readStored(dismissedKey, (value) =>
      typeof value === 'number' && Number.isFinite(value) ? value : null,
    );
    const timer = window.setTimeout(() => {
      if (!isStandalone() && (!dismissedAt || Date.now() - dismissedAt > remindAfterMs)) {
        setOpen(true);
      }
    }, 1500);

    return () => {
      window.clearTimeout(timer);
      displayMode.removeEventListener('change', updateInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    writeStored(dismissedKey, Date.now());
    setOpen(false);
  };

  const install = async () => {
    const event = deferredPrompt.current;
    if (!event) return;

    deferredPrompt.current = null;
    setCanInstall(false);
    try {
      await event.prompt();
      await event.userChoice;
      dismiss();
    } catch {
      // The browser may withdraw the install prompt. Keep manual steps visible.
    }
  };

  return (
    <InstallContext.Provider
      value={{
        canInstall,
        installed,
        open,
        openPrompt: () => {
          if (!isStandalone()) setOpen(true);
        },
        dismiss,
        install,
      }}
    >
      {children}
    </InstallContext.Provider>
  );
}

function useInstallApp() {
  const context = useContext(InstallContext);
  if (!context) throw new Error('InstallAppProvider is required');
  return context;
}

export function InstallAppPrompt() {
  const { canInstall, installed, open, dismiss, install } = useInstallApp();

  if (installed || !open) return null;

  return (
    <section className="install-prompt" aria-label="Add GlobaCart to your device">
      <button className="install-prompt__close" type="button" aria-label="Dismiss install prompt" onClick={dismiss}>
        <X size={20} aria-hidden="true" />
      </button>
      <img src="/icons/icon-192.png" alt="" width="52" height="52" />
      <div className="install-prompt__content">
        <h2>Add GlobaCart to your device</h2>
        <p>Open the website from your home screen or desktop, just like an app.</p>
        {canInstall ? (
          <button className="btn btn-primary" type="button" onClick={() => void install()}>
            <Download size={17} aria-hidden="true" /> Install app
          </button>
        ) : (
          <>
            <p className="install-prompt__steps">{installInstructions()}</p>
            <button className="btn btn-outline" type="button" onClick={dismiss}>Got it</button>
          </>
        )}
      </div>
    </section>
  );
}

export function InstallAppAction() {
  const { installed, openPrompt } = useInstallApp();

  if (installed) return <span className="muted">GlobaCart is already on this device.</span>;

  return (
    <button className="btn btn-primary" type="button" onClick={openPrompt}>
      <Download size={18} aria-hidden="true" /> Add website to your device
    </button>
  );
}
