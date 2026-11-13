import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNative = Capacitor.isNativePlatform();

/** native helper in android/…/NavBarPlugin.java: bottom navigation bar color */
const NavBar = registerPlugin<{ setStyle(o: { dark: boolean; color?: string }): Promise<void> }>('NavBar');
/** native helper in android/…/SecurePlugin.java */
const Secure = registerPlugin<{ clock(): Promise<{ boot: string; ms: number }> }>('Secure');

/**
 * Time source for security timers that changing the phone's date/time can't rewind
 * (monotonic since boot + boot count). Falls back to the wall clock in the browser.
 */
export async function secureClock(): Promise<{ boot: string; ms: number }> {
  if (Capacitor.getPlatform() === 'android') {
    try {
      return await Secure.clock();
    } catch {
      /* fall through */
    }
  }
  return { boot: 'wall', ms: Date.now() };
}

/** light tap feedback (keypad, toggles) */
export const tap = () => isNative && Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
export const success = () => isNative && Haptics.notification({ type: NotificationType.Success }).catch(() => {});
export const warn = () => isNative && Haptics.notification({ type: NotificationType.Error }).catch(() => {});

const toBase64 = async (data: Blob) => {
  const buf = new Uint8Array(await data.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
};
export { toBase64 };

/** Save/share a generated file: native → share sheet (Files, Drive, LINE…); web → download */
export async function saveFile(name: string, data: Blob) {
  if (!isNative) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(data);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    return;
  }
  // exports are plaintext copies of the ledger: they go to one private folder that clearExports() wipes
  const { uri } = await Filesystem.writeFile({ path: `${EXPORT_DIR}/${name}`, data: await toBase64(data), directory: Directory.Cache, recursive: true });
  await Share.share({ title: name, files: [uri], dialogTitle: '儲存或分享檔案' });
}

const EXPORT_DIR = 'exports';
/**
 * Delete export/backup files left in the app cache. Called on launch (all) and on resume
 * (older than `maxAgeMs`, so an app still reading a just-shared file isn't cut off).
 */
export async function clearExports(maxAgeMs = 0) {
  if (!isNative) return;
  const cutoff = Date.now() - maxAgeMs;
  const sweep = async (dir: string, match: (n: string) => boolean) => {
    const { files = [] } = await Filesystem.readdir({ path: dir, directory: Directory.Cache }).catch(() => ({ files: [] }));
    for (const f of files)
      if (f.type === 'file' && match(f.name) && (maxAgeMs === 0 || Number(f.mtime) < cutoff))
        await Filesystem.deleteFile({ path: dir ? `${dir}/${f.name}` : f.name, directory: Directory.Cache }).catch(() => {});
  };
  await sweep(EXPORT_DIR, () => true);
  // files written by older builds straight into the cache root
  await sweep('', (n) => /^(diandi|tallydew)-.*\.(csv|xlsx|json|diandi|tallydew)$/.test(n));
}

export async function syncStatusBar(dark: boolean) {
  if (!isNative) return;
  await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
  if (Capacitor.getPlatform() === 'android') {
    const color = dark ? '#0b1210' : '#f4f8f6';
    await StatusBar.setBackgroundColor({ color }).catch(() => {});
    await NavBar.setStyle({ dark, color }).catch(() => {});
  }
}
