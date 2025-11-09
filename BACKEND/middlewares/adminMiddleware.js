const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado, se requieren permisos de administrador' });
    }
    next();
};

module.exports = adminMiddleware;
