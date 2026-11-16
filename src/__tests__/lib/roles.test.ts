import { puedeAccederAdmin } from '@/lib/roles';

describe('puedeAccederAdmin', () => {
  it('permite la auditoría a super_admin y sistemas', () => {
    expect(puedeAccederAdmin('/dashboard/admin/auditoria', ['super_admin'])).toBe(
      true,
    );
    expect(puedeAccederAdmin('/dashboard/admin/auditoria', ['sistemas'])).toBe(
      true,
    );
  });

  it('no permite la auditoría a otros roles administrativos', () => {
    expect(puedeAccederAdmin('/dashboard/admin/auditoria', ['admin_comercial'])).toBe(
      false,
    );
    expect(puedeAccederAdmin('/dashboard/admin/auditoria', ['agente_atencion'])).toBe(
      false,
    );
  });
});
