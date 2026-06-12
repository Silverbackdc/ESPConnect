export type SmartBedManufacturer = {
  /** Firmware build slug (matches the smartbed repo sdkconfig delta name). */
  slug: string;
  /** Human-readable dropdown label (brand name, not translated). */
  label: string;
  /** R2 binary base name, e.g. `TiMotionBed` -> `TiMotionBed-v7.3.1.bin`. */
  binName: string;
};

export type SmartBedInstallAction = 'erase' | 'flash-only';

export type SmartBedInstallRequest = {
  slug: string;
  label: string;
  binName: string;
  /** Version string as returned by `/api/stable/versions`, e.g. `v7.3.1`. */
  version: string;
  /** True for "Erase + Flash" (clean install), false for "Flash only". */
  erase: boolean;
};
