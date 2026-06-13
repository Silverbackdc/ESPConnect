export type SmartBedManufacturer = {
  /** Firmware build slug (matches the smartbed repo sdkconfig delta name). */
  slug: string;
  /** Human-readable dropdown label (brand name, not translated). */
  label: string;
  /** R2 binary base name, e.g. `TiMotionBed` -> `TiMotionBed-v7.3.1.bin`. */
  binName: string;
};

export type SmartBedInstallAction = 'erase' | 'flash-only';

/** OTA release channel: customer-facing `stable` or staff test `beta`. */
export type SmartBedChannel = 'stable' | 'beta';

export type SmartBedInstallRequest = {
  slug: string;
  label: string;
  binName: string;
  /** Version string as returned by `/api/{channel}/versions`, e.g. `v7.3.1` or `v7.5.0-beta.2`. */
  version: string;
  /** Channel the version list came from; also the R2 prefix for the download. */
  channel: SmartBedChannel;
  /** True for "Erase + Flash" (clean install), false for "Flash only". */
  erase: boolean;
};
