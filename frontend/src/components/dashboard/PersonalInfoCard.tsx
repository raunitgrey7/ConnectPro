export default function PersonalInfoCard() {
  return (
    <section className="lg:col-span-4 space-y-6">
      {/* Personal Info */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-container bg-primary-container flex items-center justify-center text-on-primary-container text-xl font-bold">
            AH
          </div>
          <div>
            <h4 className="text-lg font-semibold">Alex Henderson</h4>
            <p className="text-xs text-on-surface-variant">alex.h@connectpro.com</p>
          </div>
        </div>
        <div className="space-y-0 text-on-surface-variant text-sm">
          <div className="flex justify-between items-center py-3 border-b border-outline-variant/30">
            <span>Personal Meeting ID</span>
            <span className="font-bold text-on-surface font-mono">911 303 4488</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-outline-variant/30">
            <span>Host Key</span>
            <span className="font-bold text-on-surface">******</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span>Status</span>
            <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-bold text-[10px] uppercase">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
        <h3 className="text-sm font-bold mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-surface-container-low rounded-lg text-center">
            <span className="material-symbols-outlined text-primary text-2xl">videocam</span>
            <p className="text-lg font-bold mt-1">128</p>
            <p className="text-xs text-on-surface-variant">Total Meetings</p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg text-center">
            <span className="material-symbols-outlined text-primary text-2xl">schedule</span>
            <p className="text-lg font-bold mt-1">42h</p>
            <p className="text-xs text-on-surface-variant">Meeting Time</p>
          </div>
        </div>
      </div>
    </section>
  );
}
