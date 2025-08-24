

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.author.role)) {
      return res.status(403).json({ message: "Access Denied" });
    }
    next();
  };
};
