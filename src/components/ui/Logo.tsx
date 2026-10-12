import { Link } from 'react-router-dom';
import { BRAND } from '@/config/brand';

/** Placeholder wordmark until the designer's final logo is ready — swap the SVG here. */
export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="logo" aria-label={`${BRAND.name} home`}>
      <span className="logo-mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
          <path d="M16 8c-1-1.500-2.500-2-4-2-2.500 0-4 1.200-4 3 0 4.500 8.500 2.400 8.500 7 0 2-1.800 3.200-4.500 3.200-2 0-3.700-.8-4.700-2.500" />
        </svg>
      </span>
      {BRAND.name}
    </Link>
  );
}
