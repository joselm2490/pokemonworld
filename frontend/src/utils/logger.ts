const ts = () => {
  const d = new Date();
  return d.toISOString().split('T')[1].slice(0, 12);
};

export const battleLogger = {
  ws(message: string, data?: unknown) {
    if (data !== undefined) {
      console.log(`%c[${ts()}] [WS] ${message}`, 'color:#38bdf8;font-weight:bold', data);
    } else {
      console.log(`%c[${ts()}] [WS] ${message}`, 'color:#38bdf8;font-weight:bold');
    }
  },

  battle(message: string, data?: unknown) {
    if (data !== undefined) {
      console.log(`%c[${ts()}] [BATTLE] ${message}`, 'color:#34d399;font-weight:bold', data);
    } else {
      console.log(`%c[${ts()}] [BATTLE] ${message}`, 'color:#34d399;font-weight:bold');
    }
  },

  api(message: string, data?: unknown) {
    if (data !== undefined) {
      console.log(`%c[${ts()}] [API] ${message}`, 'color:#c084fc;font-weight:bold', data);
    } else {
      console.log(`%c[${ts()}] [API] ${message}`, 'color:#c084fc;font-weight:bold');
    }
  },

  warn(scope: string, message: string, data?: unknown) {
    if (data !== undefined) {
      console.warn(`[${ts()}] [${scope}] ${message}`, data);
    } else {
      console.warn(`[${ts()}] [${scope}] ${message}`);
    }
  },

  error(scope: string, message: string, data?: unknown) {
    if (data !== undefined) {
      console.error(`[${ts()}] [${scope}] ${message}`, data);
    } else {
      console.error(`[${ts()}] [${scope}] ${message}`);
    }
  },
};
