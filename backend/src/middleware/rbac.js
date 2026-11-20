export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN_NO_ROLE',
          message: 'No role assigned to current user',
          requestId: req.id,
        },
      });
    }

    if (userRole === 'platform_admin' || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Action requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${userRole}`,
        requestId: req.id,
      },
    });
  };
}
