import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useTitle } from '../hooks/useSettings.js';
import TaxCalculator from './calculators/TaxCalculator.jsx';
import DemurrageCalculator from './calculators/DemurrageCalculator.jsx';
import LeasingCalculator from './calculators/LeasingCalculator.jsx';

export default function Calculators() {
  useTitle('Calculators', 'Offline vehicle tax, port demurrage, and leasing estimates.');
  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-extrabold">Calculators</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">Estimate common import and financing costs using the values you provide. Results are indicative and should be confirmed with the relevant authority or lender.</p>
      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Calculator types">
        {[['tax', 'Vehicle Tax'], ['demurrage', 'Demurrage'], ['leasing', 'Leasing']].map(([to, label]) => <NavLink key={to} to={`/calculators/${to}`} className={({ isActive }) => `btn ${isActive ? 'bg-brand text-white' : 'btn-ghost'}`}>{label}</NavLink>)}
      </nav>
      <div className="mt-6"><CalculatorRoutes /></div>
    </div>
  );
}

export function CalculatorRoutes() {
  return <Routes><Route index element={<Navigate to="tax" replace />} /><Route path="tax" element={<TaxCalculator />} /><Route path="demurrage" element={<DemurrageCalculator />} /><Route path="leasing" element={<LeasingCalculator />} /></Routes>;
}
