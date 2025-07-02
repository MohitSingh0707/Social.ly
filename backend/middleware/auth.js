const jwt = require("jsonwebtoken");
const user = require("../models/User");

exports.isAuntenticated = async (req, res, next) => {
    try {
        const {token}= req.cookies;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Please login to access this resource",
            });
        }
        const decoded =await jwt.verify(token, process.env.JWT_SECRET);
        req.user = await user.findById(decoded._id);
        next();
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};