// Sinh ra từ RBACDom Policies
const rbacMiddleware = (requiredRoles, checkSoD = false) => {
  return async (req, res, next) => {
    const userRole = req.user.role;
    
    // Kiểm tra quyền (Least Privilege)
    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role' });
    }

    // Kiểm tra phân tách nhiệm vụ (Separation of Duties - SoD)
    // Ví dụ: Người tạo đơn không được duyệt đơn của chính mình
    if (checkSoD && req.body.creatorId === req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Separation of Duties violation' });
    }

    next();
  };
};

module.exports = rbacMiddleware;