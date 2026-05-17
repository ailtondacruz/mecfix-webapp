const shortCommit = __APP_COMMIT_SHA__.slice(0, 7);

export function AppVersionBadge() {
  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-50 rounded-full border border-slate-300 bg-white/95 px-3 py-1 text-xs font-semibold tracking-wide text-slate-700 shadow-sm">
      v{__APP_VERSION__} ({shortCommit})
    </div>
  );
}
