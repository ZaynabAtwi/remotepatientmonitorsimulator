export default function Header() {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Remote Patient Monitoring Simulator</h1>
        <p className="text-xs text-slate-500">Clinician monitoring dashboard · Real-time simulation</p>
      </div>
      <div className="text-xs text-slate-500">Role: Clinician</div>
    </header>
  );
}
